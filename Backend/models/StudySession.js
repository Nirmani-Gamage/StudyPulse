const mongoose = require("mongoose");

const studySessionSchema = new mongoose.Schema(
  {
    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, "Subject is required"],
      ref: "Subject",
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    startTime: {
      type: Date,
      required: [true, "Start time is required"],
    },
    endTime: {
      type: Date,
      required: [true, "End time is required"],
    },
    durationMinutes: {
      type: Number,
      required: [true, "Duration is required"],
      min: [1, "Duration must be a positive number"],
    },
    type: {
      type: String,
      enum: ["manual", "pomodoro"],
      required: true,
      default: "manual",
    },
    notes: {
      type: String,
      trim: true,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

// Transform the returned object to match frontend expectations (id instead of _id)
studySessionSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: function (doc, ret) {
    ret.id = ret._id;
    delete ret._id;
  }
});

module.exports = mongoose.model("StudySession", studySessionSchema);
