const mongoose = require("mongoose");

const noteViewSchema = new mongoose.Schema(
  {
    noteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Note",
      required: true,
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },
    batchId: {
      type: String,
      required: true,
    },
    firstViewedAt: {
      type: Date,
      default: Date.now,
    },
    lastViewedAt: {
      type: Date,
      default: Date.now,
    },
    viewCount: {
      type: Number,
      default: 1,
    },
  },
  {
    timestamps: true,
  }
);

// Ensure a student can only have one view record per note
noteViewSchema.index({ noteId: 1, studentId: 1 }, { unique: true });

module.exports = mongoose.model("NoteView", noteViewSchema);
