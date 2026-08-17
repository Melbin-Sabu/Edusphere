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

    username: {
      type: String,
      unique: true,
      sparse: true,
      lowercase: true,
      trim: true,
    },

    admissionNumber: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
    },

    role: {
      type: String,
      enum: ["ADMINISTRATOR", "ADMIN", "TEACHER", "STUDENT", "Administrator", "Admin", "Teacher", "Student"],
      default: "STUDENT",
    },

    isFirstLogin: {
      type: Boolean,
      default: function () {
        const r = (this.role || "").toUpperCase();
        return r !== "ADMINISTRATOR";
      },
    },

    status: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Active",
    },

    profilePic: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("User", userSchema);