const mongoose = require("mongoose");
const StudySession = require("../models/StudySession");
const Subject = require("../models/Subject");

// Helper function to validate dates and durations
const validateSessionData = (startTime, endTime, durationMinutes) => {
  if (!startTime) return "Start time is required";
  if (!endTime) return "End time is required";

  const start = new Date(startTime);
  const end = new Date(endTime);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return "Invalid start or end time";
  }

  if (end <= start) {
    return "End time must be after start time";
  }

  if (durationMinutes === undefined || durationMinutes === null) {
    return "Duration is required";
  }

  if (isNaN(durationMinutes) || durationMinutes <= 0) {
    return "Duration must be a positive number";
  }

  return null;
};

// @desc    Create new study session
// @route   POST /api/sessions
// @access  Private
const createStudySession = async (req, res) => {
  try {
    const { subjectId, startTime, endTime, durationMinutes, type, notes } = req.body;
    const userId = req.user.userId;

    if (!subjectId) {
      return res.status(400).json({ message: "Subject is required" });
    }

    if (!mongoose.Types.ObjectId.isValid(subjectId)) {
      return res.status(400).json({ message: "Invalid subject ID" });
    }

    const validationError = validateSessionData(startTime, endTime, durationMinutes);
    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    // Verify subject ownership
    const subject = await Subject.findOne({ _id: subjectId, userId });
    if (!subject) {
      return res.status(404).json({ message: "Subject not found" });
    }

    const session = await StudySession.create({
      subjectId,
      userId,
      startTime,
      endTime,
      durationMinutes,
      type: type || "manual",
      notes: notes || "",
    });

    res.status(201).json({
      message: "Study session created successfully",
      session,
    });
  } catch (error) {
    console.error("Error in createStudySession:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Get all study sessions for the authenticated user
// @route   GET /api/sessions
// @access  Private
const getStudySessions = async (req, res) => {
  try {
    const sessions = await StudySession.find({ userId: req.user.userId }).sort({ createdAt: -1 });

    res.status(200).json({
      sessions,
    });
  } catch (error) {
    console.error("Error in getStudySessions:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Get single study session
// @route   GET /api/sessions/:id
// @access  Private
const getStudySessionById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid study session ID" });
    }

    const session = await StudySession.findOne({
      _id: id,
      userId: req.user.userId,
    });

    if (!session) {
      return res.status(404).json({ message: "Study session not found" });
    }

    res.status(200).json({ session });
  } catch (error) {
    console.error("Error in getStudySessionById:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Update study session
// @route   PUT /api/sessions/:id
// @access  Private
const updateStudySession = async (req, res) => {
  try {
    const { id } = req.params;
    const { subjectId, startTime, endTime, durationMinutes, type, notes } = req.body;
    const userId = req.user.userId;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid study session ID" });
    }

    if (subjectId) {
      if (!mongoose.Types.ObjectId.isValid(subjectId)) {
        return res.status(400).json({ message: "Invalid subject ID" });
      }

      // Verify new subject ownership
      const subject = await Subject.findOne({ _id: subjectId, userId });
      if (!subject) {
        return res.status(404).json({ message: "Subject not found" });
      }
    }

    if (startTime || endTime || durationMinutes !== undefined) {
      // Find existing to merge values for validation if some are missing in req.body
      const existing = await StudySession.findById(id);
      if (!existing) {
        return res.status(404).json({ message: "Study session not found" });
      }

      const mergedStartTime = startTime || existing.startTime;
      const mergedEndTime = endTime || existing.endTime;
      const mergedDuration = durationMinutes !== undefined ? durationMinutes : existing.durationMinutes;

      const validationError = validateSessionData(mergedStartTime, mergedEndTime, mergedDuration);
      if (validationError) {
        return res.status(400).json({ message: validationError });
      }
    }

    // Build update object
    const updateFields = {};
    if (subjectId) updateFields.subjectId = subjectId;
    if (startTime) updateFields.startTime = startTime;
    if (endTime) updateFields.endTime = endTime;
    if (durationMinutes !== undefined) updateFields.durationMinutes = durationMinutes;
    if (type) updateFields.type = type;
    if (notes !== undefined) updateFields.notes = notes;

    const session = await StudySession.findOneAndUpdate(
      { _id: id, userId },
      updateFields,
      { new: true, runValidators: true }
    );

    if (!session) {
      return res.status(404).json({ message: "Study session not found" });
    }

    res.status(200).json({
      message: "Study session updated successfully",
      session,
    });
  } catch (error) {
    console.error("Error in updateStudySession:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Delete study session
// @route   DELETE /api/sessions/:id
// @access  Private
const deleteStudySession = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid study session ID" });
    }

    const session = await StudySession.findOneAndDelete({
      _id: id,
      userId: req.user.userId,
    });

    if (!session) {
      return res.status(404).json({ message: "Study session not found" });
    }

    res.status(200).json({ message: "Study session deleted successfully" });
  } catch (error) {
    console.error("Error in deleteStudySession:", error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  createStudySession,
  getStudySessions,
  getStudySessionById,
  updateStudySession,
  deleteStudySession,
};
