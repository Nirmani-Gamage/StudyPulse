const aiPlannerService = require('../services/aiPlannerService');

exports.generatePlan = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { availableMinutes } = req.body;

    if (!availableMinutes || typeof availableMinutes !== 'number') {
      return res.status(400).json({ success: false, message: 'availableMinutes must be a valid number' });
    }

    if (availableMinutes < 15 || availableMinutes > 720) {
      return res.status(400).json({ success: false, message: 'availableMinutes must be between 15 and 720' });
    }

    const plan = await aiPlannerService.generateDailyPlan(userId, availableMinutes);
    
    res.json({
      success: true,
      plan
    });
  } catch (error) {
    console.error("AI Planner Controller Error:", error);
    // As instructed: "Do not expose raw API errors... Return a controlled response"
    res.status(503).json({ 
      success: false, 
      message: error.message === 'GEMINI_API_KEY is not configured' 
        ? 'GEMINI_API_KEY is missing in your .env file.' 
        : 'AI planning is temporarily unavailable. Please try again.' 
    });
  }
};

exports.addToTasks = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { items } = req.body;
    
    if (!items || !Array.isArray(items)) {
      return res.status(400).json({ success: false, message: 'Invalid items array' });
    }

    const DailyTask = require('../models/DailyTask');
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    let created = 0;
    let skipped = 0;

    for (const item of items) {
      if (!item.subjectId || !item.activity || !item.durationMinutes) continue;

      // Duplicate check
      const existing = await DailyTask.findOne({
        userId,
        date: today,
        subjectId: item.subjectId,
        title: item.activity,
        source: 'ai'
      });

      if (existing) {
        skipped++;
      } else {
        await DailyTask.create({
          userId,
          title: item.activity,
          description: item.reason || 'AI generated study plan',
          subjectId: item.subjectId,
          date: today,
          priority: 'high',
          completed: false,
          estimatedMinutes: item.durationMinutes,
          source: 'ai'
        });
        created++;
      }
    }

    res.json({ success: true, created, skipped });
  } catch (error) {
    console.error("AI Planner Add Tasks Error:", error);
    res.status(500).json({ success: false, message: 'Failed to add tasks' });
  }
};
