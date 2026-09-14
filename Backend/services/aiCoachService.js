const analyticsService = require('./analyticsService');
const { callGeminiApi } = require('../utils/geminiClient');

const SYSTEM_INSTRUCTION = `You are the StudyPulse AI Coach.
Your purpose is to help students with their studies by analyzing their actual StudyPulse learning data.
You must return your response in strict JSON format.

RULES:
1. NEVER invent facts, goals, exams, or study activity. Only make claims supported by the provided context.
2. NEVER diagnose psychological or medical conditions (e.g. ADHD, burnout). Focus on study behavior.
3. Be transparent if data is insufficient.
4. If asked to create a study plan, you may return a 'plan' array.
5. If the user specifies an available time (e.g., "I have 2 hours"), the total duration of the plan MUST NOT exceed that time.
6. When recommending subjects in a plan or insights, you MUST use the exact 'subjectId' provided in the context. Never invent a subjectId.

RESPONSE FORMAT (Strict JSON):
{
  "intent": "GENERAL_QUESTION | CREATE_STUDY_PLAN | ANALYZE_PROGRESS | STUDY_RECOMMENDATION | GOAL_ANALYSIS | EXAM_PREPARATION | CONSISTENCY_ANALYSIS | SUBJECT_ANALYSIS | TASK_ANALYSIS",
  "message": "Your conversational response to the student.",
  "insights": [
    {
      "type": "GOAL | STUDY_ACTIVITY | EXAM | CONSISTENCY",
      "subjectId": "REAL_SUBJECT_ID (optional)",
      "text": "Specific insight text.",
      "evidence": { "metric": "string", "value": "string or number" }
    }
  ],
  "plan": [
    {
      "subjectId": "REAL_SUBJECT_ID",
      "title": "Task title",
      "durationMinutes": 30
    }
  ]
}`;

async function callGemini(context, userMessage) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not configured");

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${apiKey}`;

  const fullContext = {
    studentData: context,
    userMessage: userMessage
  };

  const payload = {
    systemInstruction: {
      parts: [{ text: SYSTEM_INSTRUCTION }]
    },
    contents: [{
      parts: [{ text: JSON.stringify(fullContext, null, 2) }]
    }],
    generationConfig: {
      response_mime_type: "application/json",
      temperature: 0.2
    }
  };

  return await callGeminiApi(url, payload);
}

exports.chat = async (userId, message, intent = null) => {
  // 1. Get learning metrics from the Learning Data Engine
  const metrics = await analyticsService.getLearningMetrics(userId, { range: '30d' });

  // 2. Build compact context
  const context = {
    period: "30d",
    study: {
      totalHours: (metrics.study.totalMinutes / 60).toFixed(1),
      totalSessions: metrics.study.totalSessions,
      studyDays: metrics.study.studyDays
    },
    tasks: {
      completionRate: Math.round(metrics.tasks.completionRate)
    },
    goals: (metrics.goals.activeList || []).map(g => {
      const progress = g.targetHours > 0 ? (g.completedHours / g.targetHours) * 100 : 0;
      return {
        subjectId: g.subjectId,
        progress: Math.round(progress),
        status: progress < 50 ? 'at_risk' : 'on_track' // Simplified status
      };
    }),
    subjects: metrics.subjects.distribution.map(s => ({
      subjectId: s.subjectId,
      name: s.subjectName || "Unknown Subject",
      recentStudyMinutes: s.minutes
    })),
    // Map calendar events that are exams
    exams: [] 
  };
  
  // Note: If you want to include exams accurately, you need to pull from calendarEventController or pass it through analytics.
  // For simplicity and safety, we rely on the data provided by analyticsService.

  // 3. Call Gemini or Fallback
  let aiResponse;
  try {
    aiResponse = await callGemini(context, `User Intent: ${intent || 'UNKNOWN'}\nUser Message: ${message}`);
  } catch (error) {
    if (error.message === 'GEMINI_API_KEY is not configured') throw error;
    
    if (error.message === 'TEMPORARY_UNAVAILABLE') {
      console.log("[AI Coach] Attempting deterministic fallback");
      
      // Fallback logic
      if (context.study.totalSessions > 0 || context.tasks.completionRate > 0) {
        let fallbackMessage = "AI Coach is temporarily unavailable. Based on your recent study data, ";
        if (context.study.studyDays < 3) {
          fallbackMessage += "your study consistency has been low this week. Consider completing one focused study session today.";
        } else if (context.tasks.completionRate < 50) {
          fallbackMessage += "you have a low task completion rate. Try to break your tasks into smaller chunks.";
        } else {
          fallbackMessage += `you are doing well! You studied for ${context.study.totalHours} hours and completed ${context.tasks.completionRate}% of your tasks.`;
        }

        aiResponse = {
          intent: "GENERAL_QUESTION",
          message: fallbackMessage,
          insights: []
        };
      } else {
        throw new Error("AI_SERVICE_TEMPORARILY_UNAVAILABLE");
      }
    } else {
      console.error("AI Coach Error:", error.message);
      throw new Error("AI Coach is temporarily unavailable. Please try again shortly.");
    }
  }

  // 4. Validate output
  if (aiResponse.plan && Array.isArray(aiResponse.plan)) {
    // Filter out items with invalid subject IDs or durations
    aiResponse.plan = aiResponse.plan.filter(item => {
      const isValidSubject = context.subjects.some(s => s.subjectId === item.subjectId);
      const isValidDuration = typeof item.durationMinutes === 'number' && item.durationMinutes >= 15 && item.durationMinutes <= 120;
      return isValidSubject && isValidDuration;
    });
  }

  return aiResponse;
};
