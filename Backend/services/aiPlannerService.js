const Subject = require('../models/Subject');
const Goal = require('../models/Goal');
const CalendarEvent = require('../models/CalendarEvent');
const StudySession = require('../models/StudySession');
const recommendationService = require('./recommendationService');

// Helper to fetch context for AI
async function buildAIContext(userId, availableMinutes) {
  const now = new Date();
  const historyStart = new Date(now);
  historyStart.setDate(now.getDate() - 14);

  const [
    subjects,
    activeGoals,
    upcomingExams,
    recentSessions,
    recommendations
  ] = await Promise.all([
    Subject.find({ userId }),
    Goal.find({ userId, isCompleted: false }),
    CalendarEvent.find({ userId, type: 'exam', date: { $gte: now } }),
    StudySession.find({ userId, startTime: { $gte: historyStart } }),
    recommendationService.generateRecommendations(userId, { limit: 5 })
  ]);

  // Format subjects
  const formattedSubjects = subjects.map(s => ({
    subjectId: s._id.toString(),
    name: s.name
  }));

  // Format goals
  const formattedGoals = activeGoals.map(g => {
    const s = subjects.find(sub => sub._id.toString() === (g.subjectId ? g.subjectId.toString() : ''));
    return {
      subjectId: g.subjectId ? g.subjectId.toString() : null,
      subject: s ? s.name : "General Goal",
      progress: g.targetHours > 0 ? (g.completedHours / g.targetHours) * 100 : 0
    };
  });

  // Format exams
  const formattedExams = upcomingExams.map(e => {
    const daysUntil = Math.ceil((e.date.getTime() - now.getTime()) / (1000 * 3600 * 24));
    const s = subjects.find(sub => sub._id.toString() === (e.subjectId ? e.subjectId.toString() : ''));
    return {
      subjectId: e.subjectId ? e.subjectId.toString() : null,
      subject: s ? s.name : e.title,
      daysUntilExam: daysUntil
    };
  });

  // Format recent activity
  const recentActivityMap = {};
  recentSessions.forEach(session => {
    if (!session.subjectId) return;
    const sid = session.subjectId.toString();
    const daysAgo = Math.floor((now.getTime() - session.startTime.getTime()) / (1000 * 3600 * 24));
    if (!recentActivityMap[sid] || daysAgo < recentActivityMap[sid].lastStudiedDaysAgo) {
      recentActivityMap[sid] = {
        subjectId: sid,
        lastStudiedDaysAgo: daysAgo
      };
    }
  });

  const formattedRecentActivity = Object.values(recentActivityMap).map(a => {
    const s = subjects.find(sub => sub._id.toString() === a.subjectId);
    return {
      subjectId: a.subjectId,
      subject: s ? s.name : 'Unknown',
      lastStudiedDaysAgo: a.lastStudiedDaysAgo
    };
  });

  return {
    availableMinutes,
    subjects: formattedSubjects,
    activeGoals: formattedGoals,
    upcomingExams: formattedExams,
    recentStudyActivity: formattedRecentActivity,
    recommendations: recommendations.map(r => ({
      type: r.type,
      subjectId: r.subjectId,
      subject: r.subject,
      reason: r.reason
    }))
  };
}

const SYSTEM_INSTRUCTION = `You are StudyPulse AI, a study planning assistant for university students.

Your task is to create a realistic study plan for TODAY using ONLY the student information provided.

Prioritize:
1. Urgent upcoming exams
2. Goals with lower progress
3. Subjects that have not been studied recently
4. Existing deterministic StudyPulse recommendations
5. Balanced study when multiple priorities are similar

Rules:
- Use only subjects provided in the context.
- Return the exact subjectId provided for each subject.
- Never invent subjects.
- Never invent exams.
- Never invent goals.
- Never invent study history.
- Never exceed availableMinutes. The sum of durationMinutes MUST be <= availableMinutes.
- Prefer realistic study blocks (e.g. 15 to 120 mins).
- Avoid excessive context switching (max 6 items).
- Create actionable study activities (e.g. "CFG practice").
- Return structured JSON only, strictly matching this schema:
{
  "title": "String",
  "summary": "String",
  "totalMinutes": Number,
  "items": [
    {
      "subjectId": "String (exact subjectId)",
      "durationMinutes": Number,
      "activity": "String",
      "reason": "String"
    }
  ]
}`;

async function callGemini(context) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not configured");

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${apiKey}`;

  const payload = {
    systemInstruction: {
      parts: [{ text: SYSTEM_INSTRUCTION }]
    },
    contents: [{
      parts: [{ text: JSON.stringify(context, null, 2) }]
    }],
    generationConfig: {
      response_mime_type: "application/json",
      temperature: 0.2
    }
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Gemini API Error: ${response.status} ${text}`);
  }

  const data = await response.json();
  let content = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!content) throw new Error("Invalid response format from Gemini");
  
  // Strip markdown code block if present
  content = content.replace(/^```json\s*/, '').replace(/\s*```$/, '').trim();

  return JSON.parse(content);
}

exports.generateDailyPlan = async (userId, availableMinutes) => {
  // 1. Build context
  const context = await buildAIContext(userId, availableMinutes);
  const subjectsMap = new Map(context.subjects.map(s => [s.subjectId, s.name]));

  // 2. Call Gemini
  let plan;
  try {
    plan = await callGemini(context);
  } catch (error) {
    console.error("AI Generation Error:", error.message);
    if (error.message === 'GEMINI_API_KEY is not configured') throw error;
    throw new Error("AI planning is temporarily unavailable. Please try again.");
  }

  // 3. Validation
  if (!plan || !plan.title || !Array.isArray(plan.items)) {
    throw new Error("Invalid AI response structure.");
  }

  if (plan.items.length < 1 || plan.items.length > 6) {
    throw new Error("AI generated too many or zero items.");
  }

  let totalMins = 0;
  const validatedItems = [];

  for (const item of plan.items) {
    if (!item.subjectId || typeof item.subjectId !== 'string') continue;
    if (!subjectsMap.has(item.subjectId)) continue; // Subject hallucinated or invalid
    if (!item.durationMinutes || typeof item.durationMinutes !== 'number') continue;
    if (!item.activity || typeof item.activity !== 'string') continue;
    
    // clamp bounds
    const mins = Math.max(15, Math.min(120, item.durationMinutes));

    validatedItems.push({
      subjectId: item.subjectId,
      subject: subjectsMap.get(item.subjectId), // Force actual name
      durationMinutes: mins,
      activity: item.activity,
      reason: item.reason || "Study time"
    });
    
    totalMins += mins;
  }

  // 4. Hard available time limit
  if (totalMins > availableMinutes) {
    throw new Error("AI generated a plan exceeding available time.");
  }
  
  if (validatedItems.length === 0) {
    throw new Error("AI generated no valid items for your subjects.");
  }

  plan.items = validatedItems;
  plan.totalMinutes = totalMins;

  return plan;
};
