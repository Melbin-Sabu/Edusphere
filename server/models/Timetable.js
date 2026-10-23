const mongoose = require("mongoose");

const timetableSessionSchema = new mongoose.Schema(
  {
    subject: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      default: "Class",
      trim: true,
    },
    color: {
      type: String,
      default: "bg-slate-100 text-slate-700 border-slate-200",
    },
  },
  { _id: false }
);

const timetableSchema = new mongoose.Schema(
  {
    course: {
      type: String,
      required: true,
      enum: ["NEET", "JEE"],
      trim: true,
    },
    batch: {
      type: String,
      required: true,
      enum: ["Morning", "Evening"],
      trim: true,
    },
    slots: [
      {
        type: String,
        required: true,
      },
    ],
    additionalSubjects: {
      type: String,
      default: "",
      trim: true,
    },
    schedule: {
      type: Map,
      of: [timetableSessionSchema],
      required: true,
    },
    generatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    status: {
      type: String,
      enum: ["Published", "Draft"],
      default: "Published",
    },
    academicYear: {
      type: String,
      default: () => new Date().getFullYear().toString(),
    },
  },
  {
    timestamps: true,
  }
);

// Ensure unique timetable per course and batch
timetableSchema.index({ course: 1, batch: 1 }, { unique: true });

module.exports = mongoose.model("Timetable", timetableSchema);
