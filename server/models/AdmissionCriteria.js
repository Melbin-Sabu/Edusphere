const mongoose = require("mongoose");

const admissionCriteriaSchema = new mongoose.Schema(
  {
    courseId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    courseName: {
      type: String,
      required: true,
      trim: true,
    },

    minimumTenthPercentage: {
      type: Number,
      default: 50,
      min: 0,
      max: 100,
    },

    minimumTwelfthPercentage: {
      type: Number,
      default: 50,
      min: 0,
      max: 100,
    },

    requiredSubjects: {
      type: [String],
      default: [],
    },

    requiredDocuments: {
      type: [String],
      default: ["10thCertificate", "12thCertificate"],
    },

    minimumAge: {
      type: Number,
      default: 15,
    },

    maximumAge: {
      type: Number,
      default: 35,
    },

    registrationFee: {
      type: Number,
      default: 500,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("AdmissionCriteria", admissionCriteriaSchema);
