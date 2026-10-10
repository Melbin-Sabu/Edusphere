const mongoose = require("mongoose");

const quizSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    course: {
      type: String,
      required: false,
      trim: true,
    },
    batch: {
      type: String,
      required: true,
      trim: true,
    },
    subject: {
      type: String,
      required: true,
      trim: true,
    },
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Teacher",
      required: true,
    },
    durationMinutes: {
      type: Number,
      required: true,
      min: 1,
    },
    totalQuestions: {
      type: Number,
      default: 0,
    },
    totalMarks: {
      type: Number,
      default: 0,
    },
    negativeMarkingEnabled: {
      type: Boolean,
      default: false,
    },
    defaultPositiveMark: {
      type: Number,
      default: 4,
    },
    defaultNegativeMark: {
      type: Number,
      default: 1,
    },
    startDate: {
      type: Date,
      required: true,
    },
    startTime: {
      type: String,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    endTime: {
      type: String,
      required: true,
    },
    attemptLimit: {
      type: Number,
      default: 1,
    },
    status: {
      type: String,
      enum: ["DRAFT", "PUBLISHED", "ACTIVE", "CLOSED"],
      default: "DRAFT",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Quiz", quizSchema);
