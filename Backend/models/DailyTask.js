const mongoose = require("mongoose");

const dailyTaskSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    title: {
      type: String,
      required: [true, "Task title is required"],
      trim: true,
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subject",
      default: null,
    },
    date: {
      type: Date,
      required: [true, "Date is required"],
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },
    completed: {
      type: Boolean,
      default: false,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    estimatedMinutes: {
      type: Number,
      default: null,
      min: [1, "Estimated minutes must be positive"],
    },
    source: {
      type: String,
      enum: ["manual", "goal", "ai", "exam"],
      default: "manual",
    },
  },
  {
    timestamps: true,
  }
);

// Transform the returned object to match frontend expectations (id instead of _id)
// Also formats the date into YYYY-MM-DD string to strictly match frontend expectations
dailyTaskSchema.set("toJSON", {
  virtuals: true,
  versionKey: false,
  transform: function (doc, ret) {
    ret.id = ret._id;
    delete ret._id;
    if (ret.date) {
      ret.date = ret.date.toISOString().split("T")[0]; // YYYY-MM-DD format
    }
  },
});

module.exports = mongoose.model("DailyTask", dailyTaskSchema);
