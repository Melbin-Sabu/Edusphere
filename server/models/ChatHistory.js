const mongoose = require("mongoose");

const chatHistorySchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
      unique: true,
    },
    messages: [
      {
        role: {
          type: String,
          enum: ["user", "model"],
          required: true,
        },
        text: {
          type: String,
          required: true,
        },
        timestamp: {
          type: Date,
          default: Date.now,
        }
      }
    ]
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("ChatHistory", chatHistorySchema);
