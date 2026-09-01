const mongoose = require("mongoose");
const Goal = require("../models/Goal");
const Subject = require("../models/Subject");

// @desc    Create new goal
// @route   POST /api/goals
// @access  Private
const createGoal = async (req, res) => {
  try {
    const { title, subjectId, targetHours, completedHours, deadline, isCompleted } = req.body;
    const userId = req.user.userId;

    if (!title || title.trim() === "") {
      return res.status(400).json({ message: "Goal title is required" });
    }

    if (targetHours === undefined || targetHours <= 0) {
      return res.status(400).json({ message: "Target hours must be greater than 0" });
    }

    if (completedHours !== undefined && completedHours < 0) {
      return res.status(400).json({ message: "Completed hours cannot be negative" });
    }

    if (!deadline || isNaN(new Date(deadline).getTime())) {
      return res.status(400).json({ message: "Valid deadline is required (YYYY-MM-DD)" });
    }

    if (subjectId) {
      if (!mongoose.Types.ObjectId.isValid(subjectId)) {
        return res.status(400).json({ message: "Invalid subject ID" });
      }

      // Verify subject ownership
      const subject = await Subject.findOne({ _id: subjectId, userId });
      if (!subject) {
        return res.status(404).json({ message: "Subject not found" });
      }
    }

    const goal = await Goal.create({
      userId,
      title,
      subjectId: subjectId || null,
      targetHours,
      completedHours: completedHours || 0,
      deadline,
      isCompleted: isCompleted || false,
    });

    res.status(201).json({
      message: "Goal created successfully",
      goal,
    });
  } catch (error) {
    console.error("Error in createGoal:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Get all goals for the authenticated user
// @route   GET /api/goals
// @access  Private
const getGoals = async (req, res) => {
  try {
    const goals = await Goal.find({ userId: req.user.userId }).sort({ createdAt: -1 });

    res.status(200).json({
      goals,
    });
  } catch (error) {
    console.error("Error in getGoals:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Get single goal
// @route   GET /api/goals/:id
// @access  Private
const getGoalById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid goal ID" });
    }

    const goal = await Goal.findOne({
      _id: id,
      userId: req.user.userId,
    });

    if (!goal) {
      return res.status(404).json({ message: "Goal not found" });
    }

    res.status(200).json({ goal });
  } catch (error) {
    console.error("Error in getGoalById:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Update goal
// @route   PUT /api/goals/:id
// @access  Private
const updateGoal = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, subjectId, targetHours, completedHours, deadline, isCompleted } = req.body;
    const userId = req.user.userId;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid goal ID" });
    }

    // Prepare fields explicitly to prevent prototype pollution or _id/userId modification
    const updateFields = {};

    if (title !== undefined) {
      if (title.trim() === "") return res.status(400).json({ message: "Goal title cannot be empty" });
      updateFields.title = title;
    }

    if (targetHours !== undefined) {
      if (targetHours <= 0) return res.status(400).json({ message: "Target hours must be greater than 0" });
      updateFields.targetHours = targetHours;
    }

    if (completedHours !== undefined) {
      if (completedHours < 0) return res.status(400).json({ message: "Completed hours cannot be negative" });
      updateFields.completedHours = completedHours;
    }

    if (deadline !== undefined) {
      if (isNaN(new Date(deadline).getTime())) return res.status(400).json({ message: "Invalid deadline date" });
      updateFields.deadline = deadline;
    }

    if (isCompleted !== undefined) {
      updateFields.isCompleted = isCompleted;
    }

    if (subjectId !== undefined) {
      if (subjectId !== null && !mongoose.Types.ObjectId.isValid(subjectId)) {
        return res.status(400).json({ message: "Invalid subject ID" });
      }

      if (subjectId !== null) {
        // Verify new subject ownership
        const subject = await Subject.findOne({ _id: subjectId, userId });
        if (!subject) {
          return res.status(404).json({ message: "Subject not found" });
        }
      }
      
      updateFields.subjectId = subjectId;
    }

    const goal = await Goal.findOneAndUpdate(
      { _id: id, userId },
      updateFields,
      { new: true, runValidators: true }
    );

    if (!goal) {
      return res.status(404).json({ message: "Goal not found" });
    }

    res.status(200).json({
      message: "Goal updated successfully",
      goal,
    });
  } catch (error) {
    console.error("Error in updateGoal:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Delete goal
// @route   DELETE /api/goals/:id
// @access  Private
const deleteGoal = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid goal ID" });
    }

    const goal = await Goal.findOneAndDelete({
      _id: id,
      userId: req.user.userId,
    });

    if (!goal) {
      return res.status(404).json({ message: "Goal not found" });
    }

    res.status(200).json({ message: "Goal deleted successfully" });
  } catch (error) {
    console.error("Error in deleteGoal:", error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  createGoal,
  getGoals,
  getGoalById,
  updateGoal,
  deleteGoal,
};
