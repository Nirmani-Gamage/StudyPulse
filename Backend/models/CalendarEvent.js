const mongoose = require("mongoose");

const calendarEventSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    title: {
      type: String,
      required: [true, "Event title is required"],
      trim: true,
    },
    date: {
      type: Date,
      required: [true, "Event date is required"],
    },
    type: {
      type: String,
      enum: ["study", "assignment", "exam", "goal", "reminder"],
      required: [true, "Event type is required"],
    },
    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subject",
      default: null, // Optional
    },
  },
  {
    timestamps: true,
  }
);

// Transform the returned object to match frontend expectations (id instead of _id)
// Formats the date into YYYY-MM-DD string to strictly match frontend and avoid timezone shifts
calendarEventSchema.set("toJSON", {
  virtuals: true,
  versionKey: false,
  transform: function (doc, ret) {
    ret.id = ret._id;
    delete ret._id;
    if (ret.date) {
      // toISOString returns in UTC. Since we want the exact date string they sent (e.g. 2026-09-15),
      // and they are saved at UTC midnight, returning the UTC date component guarantees no timezone shifting
      ret.date = ret.date.toISOString().split("T")[0];
    }
  },
});

module.exports = mongoose.model("CalendarEvent", calendarEventSchema);
