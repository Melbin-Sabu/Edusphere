const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    student_user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    applicationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Application",
    },

    admissionDate: {
      type: Date,
      default: Date.now,
    },

    // Personal Details
    fullName: {
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

    mobileNumber: {
      type: String,
      required: true,
      trim: true,
    },

    dob: {
      type: Date,
      required: true,
    },

    gender: {
      type: String,
      enum: ["Male", "Female", "Other"],
      required: true,
    },

    address: {
      type: String,
      required: true,
      trim: true,
    },

    // Academic Details
    course: {
      type: String,
      required: true,
      trim: true,
    },

    batch: {
      type: String,
      default: "General",
      trim: true,
    },

    admissionNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    tenthPercentage: {
      type: Number,
      required: true,
    },

    twelfthPercentage: {
      type: Number,
      required: true,
    },

    // Parent Details
    parentName: {
      type: String,
      required: true,
      trim: true,
    },

    parentEmail: {
      type: String,
      required: true,
      trim: true,
    },

    parentMobile: {
      type: String,
      required: true,
      trim: true,
    },

    relationship: {
      type: String,
      required: true,
      trim: true,
    },

    // Documents
    tenthCertificate: {
      type: String,
      default: "",
    },

    twelfthCertificate: {
      type: String,
      default: "",
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

module.exports = mongoose.model("Student", studentSchema);
