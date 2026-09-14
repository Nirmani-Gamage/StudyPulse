const aiCoachService = require('../services/aiCoachService');
const dailyTaskController = require('./dailyTaskController');
const DailyTask = require('../models/DailyTask');
const Subject = require('../models/Subject');
const mongoose = require('mongoose');

exports.chat = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { message, intent } = req.body;

    if (!message) {
      return res.status(400).json({ success: false, message: "Message is required." });
    }

    const response = await aiCoachService.chat(userId, message, intent);

    res.status(200).json({
      success: true,
      data: response
    });
  } catch (error) {
    console.error("AI Coach Controller Error:", error);
    res.status(503).json({
      success: false,
      message: error.message || "AI Coach is temporarily unavailable."
    });
  }
};

exports.addPlan = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { plan } = req.body;

    if (!plan || !Array.isArray(plan)) {
      return res.status(400).json({ success: false, message: "A valid plan array is required." });
    }

    let created = 0;
    let skipped = 0;
    let errors = 0;

    const now = new Date();
    const todayUTCMidnight = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));

    for (const item of plan) {
      try {
        if (!item.title || !item.subjectId || !item.durationMinutes) {
          errors++;
          continue;
        }

        if (item.durationMinutes < 15 || item.durationMinutes > 120) {
          errors++;
          continue;
        }

        if (!mongoose.Types.ObjectId.isValid(item.subjectId)) {
          errors++;
          continue;
        }

        const subject = await Subject.findOne({ _id: item.subjectId, userId });
        if (!subject) {
          errors++;
          continue;
        }

        // Check for duplicates
        const existingTask = await DailyTask.findOne({
          userId,
          date: todayUTCMidnight,
          subjectId: item.subjectId,
          title: item.title.trim(),
          source: 'ai'
        });

        if (existingTask) {
          skipped++;
          continue;
        }

        // Create the task using the exact schema rules
        await DailyTask.create({
          userId,
          title: item.title.trim(),
          description: "Suggested by AI Coach",
          subjectId: item.subjectId,
          date: todayUTCMidnight,
          priority: "medium",
          completed: false,
          completedAt: null,
          estimatedMinutes: item.durationMinutes,
          source: "ai"
        });

        created++;
      } catch (err) {
        console.error("Error creating AI task:", err);
        errors++;
      }
    }

    res.status(200).json({
      success: true,
      data: {
        created,
        skipped,
        errors
      }
    });
  } catch (error) {
    console.error("AI Coach Add Plan Error:", error);
    res.status(500).json({ success: false, message: "Server error while adding plan." });
  }
};
