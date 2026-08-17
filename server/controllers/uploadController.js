const path = require("path");
const fs = require("fs");
const User = require("../models/User");
const Student = require("../models/Student");
const Teacher = require("../models/Teacher");

// =======================
// Upload Profile Picture
// =======================
const uploadProfilePic = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No image file provided" });
    }

    // Construct relative URL for static serving (e.g. /uploads/profile-pics/filename.jpg)
    const relativeUrl = `/uploads/profile-pics/${req.file.filename}`;
    const fullUrl = `${req.protocol}://${req.get("host")}${relativeUrl}`;

    const userId = req.user ? req.user._id : req.body.userId;

    if (userId) {
      // 1. Update User document
      const user = await User.findByIdAndUpdate(
        userId,
        { profilePic: relativeUrl },
        { new: true }
      );

      // 2. Update Student document if exists
      await Student.findOneAndUpdate({ user_id: userId }, { profilePic: relativeUrl });

      // 3. Update Teacher document if exists
      await Teacher.findOneAndUpdate({ user_id: userId }, { profilePic: relativeUrl });

      return res.status(200).json({
        message: "Profile picture uploaded successfully!",
        profilePic: relativeUrl,
        fullUrl,
        user,
      });
    }

    res.status(200).json({
      message: "Image uploaded successfully!",
      profilePic: relativeUrl,
      fullUrl,
    });
  } catch (error) {
    console.error("Error uploading profile picture:", error);
    res.status(500).json({
      message: error.message || "Failed to upload profile picture",
    });
  }
};

module.exports = {
  uploadProfilePic,
};
