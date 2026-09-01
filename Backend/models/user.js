const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
      minlength: 6,
    },

    university: { type: String, default: "" },
    degree: { type: String, default: "" },
    bio: { type: String, default: "" },

    studyPrefs: {
      dailyTargetHours: { type: Number, default: 2 },
      preferredTime: { 
        type: String, 
        enum: ["morning", "afternoon", "evening", "night", "any"], 
        default: "any" 
      }
    },

    notificationPrefs: {
      studyReminders: { type: Boolean, default: true },
      goalReminders: { type: Boolean, default: true },
      achievementAlerts: { type: Boolean, default: true }
    },
  },
  {
    timestamps: true,
  }
);
// Transform the returned object to match frontend expectations (id instead of _id)
userSchema.set("toJSON", {
  virtuals: true,
  versionKey: false,
  transform: function (doc, ret) {
    ret.id = ret._id;
    delete ret._id;
  },
});

module.exports = mongoose.model("User", userSchema);