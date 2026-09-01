const mongoose = require("mongoose");
const Subject = require("../models/Subject");

// @desc    Create new subject
// @route   POST /api/subjects
// @access  Private
const createSubject = async (req, res) => {
  try {
    const { name, color } = req.body;

    if (!name) {
      return res.status(400).json({ message: "Subject name is required" });
    }

    if (!color) {
      return res.status(400).json({ message: "Subject color is required" });
    }

    const subject = await Subject.create({
      name,
      color,
      userId: req.user.userId,
    });

    res.status(201).json({
      message: "Subject created successfully",
      subject,
    });
  } catch (error) {
    console.error("Error in createSubject:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Get all subjects for the authenticated user
// @route   GET /api/subjects
// @access  Private
const getSubjects = async (req, res) => {
  try {
    const subjects = await Subject.find({ userId: req.user.userId }).sort({ createdAt: -1 });

    res.status(200).json({
      subjects,
    });
  } catch (error) {
    console.error("Error in getSubjects:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Get single subject
// @route   GET /api/subjects/:id
// @access  Private
const getSubjectById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid subject ID" });
    }

    const subject = await Subject.findOne({
      _id: id,
      userId: req.user.userId,
    });

    if (!subject) {
      return res.status(404).json({ message: "Subject not found" });
    }

    res.status(200).json({ subject });
  } catch (error) {
    console.error("Error in getSubjectById:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Update subject
// @route   PUT /api/subjects/:id
// @access  Private
const updateSubject = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, color } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid subject ID" });
    }

    if (!name) {
      return res.status(400).json({ message: "Subject name is required" });
    }

    if (!color) {
      return res.status(400).json({ message: "Subject color is required" });
    }

    const subject = await Subject.findOneAndUpdate(
      { _id: id, userId: req.user.userId },
      { name, color },
      { new: true, runValidators: true }
    );

    if (!subject) {
      return res.status(404).json({ message: "Subject not found" });
    }

    res.status(200).json({
      message: "Subject updated successfully",
      subject,
    });
  } catch (error) {
    console.error("Error in updateSubject:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Delete subject
// @route   DELETE /api/subjects/:id
// @access  Private
const deleteSubject = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid subject ID" });
    }

    const subject = await Subject.findOneAndDelete({
      _id: id,
      userId: req.user.userId,
    });

    if (!subject) {
      return res.status(404).json({ message: "Subject not found" });
    }

    res.status(200).json({ message: "Subject deleted successfully" });
  } catch (error) {
    console.error("Error in deleteSubject:", error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  createSubject,
  getSubjects,
  getSubjectById,
  updateSubject,
  deleteSubject,
};
