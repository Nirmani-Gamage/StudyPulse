const User = require("../models/User");

// @desc    Get user profile and settings
// @route   GET /api/user/profile
// @access  Private
const getProfile = async (req, res) => {
  try {
    // Select everything EXCEPT the password
    const user = await User.findById(req.user.userId).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ user });
  } catch (error) {
    console.error("Error in getProfile:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Update user profile and settings
// @route   PUT /api/user/profile
// @access  Private
const updateProfile = async (req, res) => {
  try {
    const { name, university, degree, bio, studyPrefs, notificationPrefs } = req.body;
    const userId = req.user.userId;

    const updateFields = {};

    // Base Profile Fields
    if (name !== undefined) {
      if (name.trim() === "") return res.status(400).json({ message: "Name cannot be empty" });
      updateFields.name = name;
    }
    if (university !== undefined) updateFields.university = university;
    if (degree !== undefined) updateFields.degree = degree;
    if (bio !== undefined) updateFields.bio = bio;

    // Study Preferences
    if (studyPrefs !== undefined) {
      // Must merge with existing to avoid blowing away unmodified sub-fields
      const user = await User.findById(userId);
      updateFields.studyPrefs = { ...user.studyPrefs.toObject(), ...studyPrefs };

      if (updateFields.studyPrefs.dailyTargetHours !== undefined && updateFields.studyPrefs.dailyTargetHours <= 0) {
        return res.status(400).json({ message: "Daily target hours must be greater than 0" });
      }
      
      const validTimes = ["morning", "afternoon", "evening", "night", "any"];
      if (updateFields.studyPrefs.preferredTime !== undefined && !validTimes.includes(updateFields.studyPrefs.preferredTime)) {
        return res.status(400).json({ message: "Invalid preferred time" });
      }
    }

    // Notification Preferences
    if (notificationPrefs !== undefined) {
      const user = updateFields.studyPrefs ? null : await User.findById(userId);
      const existingNotifs = user ? user.notificationPrefs.toObject() : (await User.findById(userId)).notificationPrefs.toObject();
      updateFields.notificationPrefs = { ...existingNotifs, ...notificationPrefs };
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updateFields },
      { new: true, runValidators: true }
    ).select("-password");

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      message: "Profile updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Error in updateProfile:", error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  getProfile,
  updateProfile,
};
