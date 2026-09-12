const mongoose = require("mongoose");
const JournalEntry = require("../models/JournalEntry");

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

// @desc    Get journal entries for the authenticated user
// @route   GET /api/journal
// @access  Private
const getJournalEntries = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { date } = req.query;

    const query = { userId };

    if (date) {
      const targetDate = parseDateToUTCMidnight(date);
      const nextDay = new Date(targetDate);
      nextDay.setUTCDate(nextDay.getUTCDate() + 1);
      query.date = { $gte: targetDate, $lt: nextDay };
    }

    const entries = await JournalEntry.find(query).sort({ date: -1, createdAt: -1 });

    res.status(200).json({ entries });
  } catch (error) {
    console.error("Error in getJournalEntries:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Get single journal entry
// @route   GET /api/journal/:id
// @access  Private
const getJournalEntry = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid journal ID" });
    }

    const entry = await JournalEntry.findOne({ _id: id, userId });
    
    if (!entry) {
      return res.status(404).json({ message: "Journal entry not found" });
    }

    res.status(200).json({ entry });
  } catch (error) {
    console.error("Error in getJournalEntry:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Create a new journal entry
// @route   POST /api/journal
// @access  Private
const createJournalEntry = async (req, res) => {
  try {
    const userId = req.user.userId;
    const {
      date,
      title,
      content,
      mood,
      energy,
      productivity,
      achievements,
      learnings,
      challenges,
      tomorrowFocus
    } = req.body;

    if (!title || typeof title !== "string" || title.trim() === "") {
      return res.status(400).json({ message: "Journal title is required" });
    }

    const entryDate = parseDateToUTCMidnight(date);

    // Check if entry already exists for this date
    const nextDay = new Date(entryDate);
    nextDay.setUTCDate(nextDay.getUTCDate() + 1);
    
    const existingEntry = await JournalEntry.findOne({
      userId,
      date: { $gte: entryDate, $lt: nextDay }
    });

    if (existingEntry) {
      return res.status(400).json({ message: "A journal entry already exists for this date." });
    }

    const entry = await JournalEntry.create({
      userId,
      date: entryDate,
      title: title.trim(),
      content: content || "",
      mood: mood || null,
      energy: energy || null,
      productivity: productivity || null,
      achievements: Array.isArray(achievements) ? achievements : [],
      learnings: Array.isArray(learnings) ? learnings : [],
      challenges: Array.isArray(challenges) ? challenges : [],
      tomorrowFocus: Array.isArray(tomorrowFocus) ? tomorrowFocus : []
    });

    res.status(201).json({
      message: "Journal entry created successfully",
      entry
    });
  } catch (error) {
    console.error("Error in createJournalEntry:", error);
    // Handle MongoDB duplicate key error explicitly just in case
    if (error.code === 11000) {
       return res.status(400).json({ message: "A journal entry already exists for this date." });
    }
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Update an existing journal entry
// @route   PUT /api/journal/:id
// @access  Private
const updateJournalEntry = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const {
      title,
      content,
      mood,
      energy,
      productivity,
      achievements,
      learnings,
      challenges,
      tomorrowFocus
    } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid journal ID" });
    }

    const updateFields = {};

    if (title !== undefined) {
      if (typeof title !== "string" || title.trim() === "") {
        return res.status(400).json({ message: "Journal title cannot be empty" });
      }
      updateFields.title = title.trim();
    }
    
    if (content !== undefined) updateFields.content = content;
    if (mood !== undefined) updateFields.mood = mood;
    if (energy !== undefined) updateFields.energy = energy;
    if (productivity !== undefined) updateFields.productivity = productivity;
    if (achievements !== undefined) updateFields.achievements = achievements;
    if (learnings !== undefined) updateFields.learnings = learnings;
    if (challenges !== undefined) updateFields.challenges = challenges;
    if (tomorrowFocus !== undefined) updateFields.tomorrowFocus = tomorrowFocus;

    const entry = await JournalEntry.findOneAndUpdate(
      { _id: id, userId },
      updateFields,
      { new: true, runValidators: true }
    );

    if (!entry) {
      return res.status(404).json({ message: "Journal entry not found" });
    }

    res.status(200).json({
      message: "Journal entry updated successfully",
      entry
    });
  } catch (error) {
    console.error("Error in updateJournalEntry:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Delete a journal entry
// @route   DELETE /api/journal/:id
// @access  Private
const deleteJournalEntry = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid journal ID" });
    }

    const entry = await JournalEntry.findOneAndDelete({ _id: id, userId });
    if (!entry) {
      return res.status(404).json({ message: "Journal entry not found" });
    }

    res.status(200).json({ message: "Journal entry deleted successfully" });
  } catch (error) {
    console.error("Error in deleteJournalEntry:", error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  getJournalEntries,
  getJournalEntry,
  createJournalEntry,
  updateJournalEntry,
  deleteJournalEntry
};
