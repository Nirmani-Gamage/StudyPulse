const analyticsService = require('./analyticsService');

const SYSTEM_INSTRUCTION = `You are StudyPulse AI Analyzer.

Your role is to analyze a student's recorded study behavior over a specific period.
You do not control the student's study plan. The student decides what to study and when.
You analyze the provided StudyPulse summary and identify meaningful patterns.

RULES:
- Only make claims supported by the provided data.
- Do not invent statistics.
- Do not diagnose medical or psychological conditions.
- Distinguish observations from interpretations.
- Use evidence for important insights (e.g., "You studied on 18 out of 30 days").
- Avoid generic motivational advice (e.g., "Keep working hard"). Be specific to their data.
- Be concise, practical, and student-friendly.
- If the data is extremely limited (e.g., 0-2 sessions or 0 tasks), explicitly set dataQuality.level to "limited" and avoid making long-term assumptions.

Return ONLY structured JSON matching this exact schema:
{
    "dataQuality": {
        "level": "limited" | "moderate" | "good",
        "message": "String (explain if data is limited)"
    },
    "overallAssessment": {
        "title": "String",
        "summary": "String",
        "status": "positive" | "neutral" | "negative"
    },
    "insights": [
        {
            "category": "consistency" | "subject_balance" | "task_behavior" | "goal_progress" | "study_patterns",
            "title": "String",
            "observation": "String",
            "evidence": "String (specific numbers from data)",
            "impact": "String",
            "severity": "low" | "medium" | "high"
        }
    ],
    "strengths": [
        {
            "title": "String",
            "description": "String",
            "evidence": "String"
        }
    ],
    "areasToImprove": [
        {
            "title": "String",
            "description": "String",
            "evidence": "String",
            "priority": "low" | "medium" | "high"
        }
    ],
    "subjectAnalysis": [
        {
            "subject": "String (name of subject)",
            "observation": "String",
            "evidence": "String",
            "priority": "low" | "medium" | "high"
        }
    ],
    "reflection": {
        "summary": "String",
        "pattern": "String"
    }
}`;

async function callGemini(context) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not configured");

  // Based on the prompt condition, use gemini-3.6-flash which is the configured model.
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

exports.analyzeStudentData = async (userId, period = '30d') => {
  // 1. Get raw metrics from Learning Data Engine
  const metrics = await analyticsService.getLearningMetrics(userId, { range: period });

  // 2. Prepare compact AI context
  const context = {
    analysisPeriod: `${metrics.period.daysInPeriod} days`,
    study: {
      totalHours: (metrics.study.totalMinutes / 60).toFixed(1),
      totalSessions: metrics.study.totalSessions,
      activeStudyDays: metrics.study.studyDays,
      averageSessionMins: Math.round(metrics.study.averageSessionMinutes)
    },
    tasks: {
      total: metrics.tasks.total,
      completed: metrics.tasks.completed,
      overdueOrIncomplete: metrics.tasks.notCompleted,
      completionRate: Math.round(metrics.tasks.completionRate) + '%'
    },
    goals: {
      active: metrics.goals.active,
      averageProgress: Math.round(metrics.goals.averageProgress) + '%'
    },
    journal: {
      entries: metrics.journal.entries,
      averageProductivity: metrics.journal.averageProductivity ? metrics.journal.averageProductivity.toFixed(1) + '/5' : 'No data'
    },
    subjectsDistribution: metrics.subjects.distribution.map(d => ({
      subjectId: d.subjectId,
      hours: (d.minutes / 60).toFixed(1),
      percentage: Math.round(d.percentage) + '%'
    }))
  };

  // 3. Short-circuit if data is too sparse (save API calls and hallucinations)
  if (metrics.study.totalSessions === 0 && metrics.tasks.total === 0) {
    return {
      dataQuality: {
        level: "limited",
        message: "There is no study data for this period yet. Start recording sessions and tasks to get AI insights!"
      },
      overallAssessment: {
        title: "No Activity Found",
        summary: "We need more data to analyze your study habits.",
        status: "neutral"
      },
      insights: [],
      strengths: [],
      areasToImprove: [],
      subjectAnalysis: [],
      reflection: { summary: "", pattern: "" }
    };
  }

  // 4. Call AI Provider
  let analysis;
  try {
    analysis = await callGemini(context);
  } catch (error) {
    console.error("AI Analyzer Error:", error.message);
    if (error.message === 'GEMINI_API_KEY is not configured') throw error;
    throw new Error("AI analysis is temporarily unavailable. Please try again.");
  }

  // 5. Validation (ensure arrays exist)
  analysis.insights = Array.isArray(analysis.insights) ? analysis.insights : [];
  analysis.strengths = Array.isArray(analysis.strengths) ? analysis.strengths : [];
  analysis.areasToImprove = Array.isArray(analysis.areasToImprove) ? analysis.areasToImprove : [];
  analysis.subjectAnalysis = Array.isArray(analysis.subjectAnalysis) ? analysis.subjectAnalysis : [];

  return analysis;
};
