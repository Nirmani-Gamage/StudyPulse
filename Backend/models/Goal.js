const mongoose = require("mongoose");

const goalSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    title: {
      type: String,
      required: [true, "Goal title is required"],
      trim: true,
    },
    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subject",
      default: null, // Optional
    },
    targetHours: {
      type: Number,
      required: [true, "Target hours are required"],
      min: [0.01, "Target hours must be greater than 0"],
    },
    completedHours: {
      type: Number,
      default: 0,
      min: [0, "Completed hours cannot be negative"],
    },
    deadline: {
      type: Date,
      required: [true, "Deadline is required"],
    },
    isCompleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Transform the returned object to match frontend expectations (id instead of _id)
// Also formats the deadline into YYYY-MM-DD string if possible to strictly match frontend
goalSchema.set("toJSON", {
  virtuals: true,
  versionKey: false,
  transform: function (doc, ret) {
    ret.id = ret._id;
    delete ret._id;
    if (ret.deadline) {
      ret.deadline = ret.deadline.toISOString().split("T")[0]; // YYYY-MM-DD format
    }
  },
});

module.exports = mongoose.model("Goal", goalSchema);
