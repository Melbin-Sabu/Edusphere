const mongoose = require("mongoose");

const applicationSchema = new mongoose.Schema(
  {
    applicationId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    fullName: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },

    mobile: {
      type: String,
      required: true,
      trim: true,
    },

    dateOfBirth: {
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

    courseId: {
      type: String,
      required: true,
      trim: true,
    },

    batchId: {
      type: String,
      default: "General",
      trim: true,
    },

    tenthPercentage: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },

    twelfthPercentage: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },

    tenthCertificate: {
      type: String,
      default: "",
    },

    twelfthCertificate: {
      type: String,
      default: "",
    },

    parentName: {
      type: String,
      required: true,
      trim: true,
    },

    parentEmail: {
      type: String,
      required: true,
      lowercase: true,
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

    eligibilityStatus: {
      type: String,
      enum: ["PENDING", "ELIGIBLE", "NOT_ELIGIBLE", "NEEDS_REVIEW"],
      default: "PENDING",
    },

    applicationStatus: {
      type: String,
      enum: [
        "PENDING",
        "PAYMENT_PENDING",
        "PAYMENT_SUCCESS",
        "UNDER_REVIEW",
        "APPROVED",
        "REJECTED",
        "ENROLLED",
      ],
      default: "PENDING",
    },

    paymentStatus: {
      type: String,
      enum: ["PENDING", "SUCCESS", "FAILED"],
      default: "PENDING",
    },

    paymentId: {
      type: String,
      default: "",
    },

    paymentAmount: {
      type: Number,
      default: 0,
    },

    paymentDate: {
      type: Date,
    },

    transactionId: {
      type: String,
      default: "",
    },

    rejectionReason: {
      type: String,
      default: "",
    },

    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    reviewedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Application", applicationSchema);
