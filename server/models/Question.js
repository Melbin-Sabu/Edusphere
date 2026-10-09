const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema(
  {
    quizId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Quiz",
      required: true,
    },
    questionText: {
      type: String,
      required: true,
      trim: true,
    },
    options: {
      type: [String],
      required: true,
      validate: [arrayLimit, '{PATH} must have at least 2 options'],
    },
    correctAnswer: {
      type: String,
      required: true,
      trim: true,
    },
    positiveMark: {
      type: Number,
      required: true,
    },
    negativeMark: {
      type: Number,
      required: true,
      min: 0,
    },
    explanation: {
      type: String,
      trim: true,
      default: "",
    },
    order: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

function arrayLimit(val) {
  return val.length >= 2;
}

module.exports = mongoose.model("Question", questionSchema);
