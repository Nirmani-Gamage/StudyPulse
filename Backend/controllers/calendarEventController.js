const mongoose = require("mongoose");
const CalendarEvent = require("../models/CalendarEvent");
const Subject = require("../models/Subject");

// @desc    Create new calendar event
// @route   POST /api/events
// @access  Private
const createCalendarEvent = async (req, res) => {
  try {
    const { title, date, type, subjectId } = req.body;
    const userId = req.user.userId;

    if (!title || title.trim() === "") {
      return res.status(400).json({ message: "Event title is required" });
    }

    if (!date || isNaN(new Date(date).getTime())) {
      return res.status(400).json({ message: "Valid event date is required (YYYY-MM-DD)" });
    }

    if (!type || !["study", "assignment", "exam", "goal", "reminder"].includes(type)) {
      return res.status(400).json({ message: "Valid event type is required" });
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

    const calendarEvent = await CalendarEvent.create({
      userId,
      title,
      date,
      type,
      subjectId: subjectId || null,
    });

    res.status(201).json({
      message: "Calendar event created successfully",
      calendarEvent,
    });
  } catch (error) {
    console.error("Error in createCalendarEvent:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Get all calendar events for the authenticated user
// @route   GET /api/events
// @access  Private
const getCalendarEvents = async (req, res) => {
  try {
    const calendarEvents = await CalendarEvent.find({ userId: req.user.userId }).sort({ date: 1 });

    res.status(200).json({
      calendarEvents,
    });
  } catch (error) {
    console.error("Error in getCalendarEvents:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Get single calendar event
// @route   GET /api/events/:id
// @access  Private
const getCalendarEventById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid calendar event ID" });
    }

    const calendarEvent = await CalendarEvent.findOne({
      _id: id,
      userId: req.user.userId,
    });

    if (!calendarEvent) {
      return res.status(404).json({ message: "Calendar event not found" });
    }

    res.status(200).json({ calendarEvent });
  } catch (error) {
    console.error("Error in getCalendarEventById:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Update calendar event
// @route   PUT /api/events/:id
// @access  Private
const updateCalendarEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, date, type, subjectId } = req.body;
    const userId = req.user.userId;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid calendar event ID" });
    }

    // Explicitly select allowed fields
    const updateFields = {};

    if (title !== undefined) {
      if (title.trim() === "") return res.status(400).json({ message: "Event title cannot be empty" });
      updateFields.title = title;
    }

    if (date !== undefined) {
      if (isNaN(new Date(date).getTime())) return res.status(400).json({ message: "Invalid date format" });
      updateFields.date = date;
    }

    if (type !== undefined) {
      if (!["study", "assignment", "exam", "goal", "reminder"].includes(type)) {
        return res.status(400).json({ message: "Invalid event type" });
      }
      updateFields.type = type;
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

    const calendarEvent = await CalendarEvent.findOneAndUpdate(
      { _id: id, userId },
      updateFields,
      { new: true, runValidators: true }
    );

    if (!calendarEvent) {
      return res.status(404).json({ message: "Calendar event not found" });
    }

    res.status(200).json({
      message: "Calendar event updated successfully",
      calendarEvent,
    });
  } catch (error) {
    console.error("Error in updateCalendarEvent:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Delete calendar event
// @route   DELETE /api/events/:id
// @access  Private
const deleteCalendarEvent = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid calendar event ID" });
    }

    const calendarEvent = await CalendarEvent.findOneAndDelete({
      _id: id,
      userId: req.user.userId,
    });

    if (!calendarEvent) {
      return res.status(404).json({ message: "Calendar event not found" });
    }

    res.status(200).json({ message: "Calendar event deleted successfully" });
  } catch (error) {
    console.error("Error in deleteCalendarEvent:", error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  createCalendarEvent,
  getCalendarEvents,
  getCalendarEventById,
  updateCalendarEvent,
  deleteCalendarEvent,
};
