const mongoose = require("mongoose");
const DailyTask = require("../models/DailyTask");
const Subject = require("../models/Subject");

// Helper to normalize a date string (YYYY-MM-DD) or Date object to UTC midnight
const parseDateToUTCMidnight = (dateInput) => {
  if (!dateInput) {
    const now = new Date();
    return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
  }
  
  if (typeof dateInput === "string" && dateInput.includes("T")) {
    dateInput = dateInput.split("T")[0];
  }

  const [year, month, day] = String(dateInput).split("-").map(Number);
  if (!year || !month || !day) {
    const d = new Date(dateInput);
    return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  }

  return new Date(Date.UTC(year, month - 1, day));
};

// Priority map for sorting (high > medium > low)
const priorityOrder = { high: 3, medium: 2, low: 1 };

// @desc    Get daily tasks for the authenticated user
// @route   GET /api/daily-tasks
// @access  Private
const getDailyTasks = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { date, startDate, endDate } = req.query;

    const query = { userId };

    if (date) {
      const targetDate = parseDateToUTCMidnight(date);
      const nextDay = new Date(targetDate);
      nextDay.setUTCDate(nextDay.getUTCDate() + 1);
      query.date = { $gte: targetDate, $lt: nextDay };
    } else if (startDate || endDate) {
      query.date = {};
      if (startDate) {
        query.date.$gte = parseDateToUTCMidnight(startDate);
      }
      if (endDate) {
        const endTarget = parseDateToUTCMidnight(endDate);
        endTarget.setUTCDate(endTarget.getUTCDate() + 1);
        query.date.$lt = endTarget;
      }
    }

    const rawTasks = await DailyTask.find(query);

    // Sort tasks by:
    // 1. date (ascending)
    // 2. priority (high -> medium -> low)
    // 3. createdAt (descending)
    const sortedTasks = rawTasks.sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      if (dateA !== dateB) return dateA - dateB;

      const prioA = priorityOrder[a.priority] || 2;
      const prioB = priorityOrder[b.priority] || 2;
      if (prioA !== prioB) return prioB - prioA;

      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    res.status(200).json({
      tasks: sortedTasks,
    });
  } catch (error) {
    console.error("Error in getDailyTasks:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Get today's tasks for the authenticated user with summary stats
// @route   GET /api/daily-tasks/today
// @access  Private
const getTodayTasks = async (req, res) => {
  try {
    const userId = req.user.userId;

    const now = new Date();
    const todayStart = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
    const todayEnd = new Date(todayStart);
    todayEnd.setUTCDate(todayEnd.getUTCDate() + 1);

    const query = {
      userId,
      date: { $gte: todayStart, $lt: todayEnd },
    };

    const rawTasks = await DailyTask.find(query);

    const sortedTasks = rawTasks.sort((a, b) => {
      const prioA = priorityOrder[a.priority] || 2;
      const prioB = priorityOrder[b.priority] || 2;
      if (prioA !== prioB) return prioB - prioA;

      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    const total = sortedTasks.length;
    const completed = sortedTasks.filter((t) => t.completed).length;
    const progress = total === 0 ? 0 : Math.round((completed / total) * 100);

    res.status(200).json({
      tasks: sortedTasks,
      total,
      completed,
      progress,
    });
  } catch (error) {
    console.error("Error in getTodayTasks:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Create a new daily task
// @route   POST /api/daily-tasks
// @access  Private
const createDailyTask = async (req, res) => {
  try {
    const userId = req.user.userId;
    const {
      title,
      description,
      subjectId,
      date,
      priority,
      estimatedMinutes,
      source,
    } = req.body;

    if (!title || typeof title !== "string" || title.trim() === "") {
      return res.status(400).json({ message: "Task title is required" });
    }

    if (priority && !["low", "medium", "high"].includes(priority)) {
      return res.status(400).json({ message: "Priority must be low, medium, or high" });
    }

    if (source && !["manual", "goal", "ai", "exam"].includes(source)) {
      return res.status(400).json({ message: "Source must be manual, goal, ai, or exam" });
    }

    if (estimatedMinutes !== undefined && estimatedMinutes !== null) {
      if (typeof estimatedMinutes !== "number" || estimatedMinutes <= 0) {
        return res.status(400).json({ message: "Estimated minutes must be a positive number" });
      }
    }

    if (subjectId) {
      if (!mongoose.Types.ObjectId.isValid(subjectId)) {
        return res.status(400).json({ message: "Invalid subject ID" });
      }

      const subject = await Subject.findOne({ _id: subjectId, userId });
      if (!subject) {
        return res.status(404).json({ message: "Subject not found or does not belong to user" });
      }
    }

    const taskDate = parseDateToUTCMidnight(date);

    const task = await DailyTask.create({
      userId,
      title: title.trim(),
      description: description ? description.trim() : "",
      subjectId: subjectId || null,
      date: taskDate,
      priority: priority || "medium",
      completed: false,
      completedAt: null,
      estimatedMinutes: estimatedMinutes || null,
      source: source || "manual",
    });

    res.status(201).json({
      message: "Daily task created successfully",
      task,
    });
  } catch (error) {
    console.error("Error in createDailyTask:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Update an existing daily task
// @route   PUT /api/daily-tasks/:id
// @access  Private
const updateDailyTask = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const {
      title,
      description,
      subjectId,
      date,
      priority,
      estimatedMinutes,
    } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid task ID" });
    }

    const updateFields = {};

    if (title !== undefined) {
      if (typeof title !== "string" || title.trim() === "") {
        return res.status(400).json({ message: "Task title cannot be empty" });
      }
      updateFields.title = title.trim();
    }

    if (description !== undefined) {
      updateFields.description = typeof description === "string" ? description.trim() : "";
    }

    if (priority !== undefined) {
      if (!["low", "medium", "high"].includes(priority)) {
        return res.status(400).json({ message: "Priority must be low, medium, or high" });
      }
      updateFields.priority = priority;
    }

    if (estimatedMinutes !== undefined) {
      if (estimatedMinutes !== null && (typeof estimatedMinutes !== "number" || estimatedMinutes <= 0)) {
        return res.status(400).json({ message: "Estimated minutes must be a positive number" });
      }
      updateFields.estimatedMinutes = estimatedMinutes;
    }

    if (date !== undefined) {
      updateFields.date = parseDateToUTCMidnight(date);
    }

    if (subjectId !== undefined) {
      if (subjectId !== null && !mongoose.Types.ObjectId.isValid(subjectId)) {
        return res.status(400).json({ message: "Invalid subject ID" });
      }

      if (subjectId !== null) {
        const subject = await Subject.findOne({ _id: subjectId, userId });
        if (!subject) {
          return res.status(404).json({ message: "Subject not found or does not belong to user" });
        }
      }
      updateFields.subjectId = subjectId;
    }

    const task = await DailyTask.findOneAndUpdate(
      { _id: id, userId },
      updateFields,
      { new: true, runValidators: true }
    );

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    res.status(200).json({
      message: "Task updated successfully",
      task,
    });
  } catch (error) {
    console.error("Error in updateDailyTask:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Toggle completion state of a daily task
// @route   PATCH /api/daily-tasks/:id/toggle
// @access  Private
const toggleDailyTask = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid task ID" });
    }

    const existingTask = await DailyTask.findOne({ _id: id, userId });
    if (!existingTask) {
      return res.status(404).json({ message: "Task not found" });
    }

    const newCompleted = !existingTask.completed;
    const newCompletedAt = newCompleted ? new Date() : null;

    existingTask.completed = newCompleted;
    existingTask.completedAt = newCompletedAt;
    await existingTask.save();

    res.status(200).json({
      message: `Task marked as ${newCompleted ? "completed" : "incomplete"}`,
      task: existingTask,
    });
  } catch (error) {
    console.error("Error in toggleDailyTask:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Delete a daily task
// @route   DELETE /api/daily-tasks/:id
// @access  Private
const deleteDailyTask = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid task ID" });
    }

    const task = await DailyTask.findOneAndDelete({ _id: id, userId });
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    res.status(200).json({ message: "Task deleted successfully" });
  } catch (error) {
    console.error("Error in deleteDailyTask:", error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  getDailyTasks,
  getTodayTasks,
  createDailyTask,
  updateDailyTask,
  toggleDailyTask,
  deleteDailyTask,
};
