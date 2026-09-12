const mongoose = require("mongoose");

const journalSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    date: {
      type: Date,
      required: [true, "Date is required"],
    },
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
    },
    content: {
      type: String,
      default: "",
    },
    mood: {
      type: Number,
      min: 1,
      max: 5,
      default: null,
    },
    energy: {
      type: Number,
      min: 1,
      max: 5,
      default: null,
    },
    productivity: {
      type: Number,
      min: 1,
      max: 5,
      default: null,
    },
    achievements: {
      type: [String],
      default: [],
    },
    learnings: {
      type: [String],
      default: [],
    },
    challenges: {
      type: [String],
      default: [],
    },
    tomorrowFocus: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

// Enforce one journal entry per user per calendar day
journalSchema.index({ userId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model("JournalEntry", journalSchema);
