const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema(
  {
    date: {
      type: Date,
      required: true,
    },
    batch: {
      type: String,
      required: true,
      trim: true,
    },
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Teacher",
      required: true,
    },
    records: [
      {
        studentId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Student",
          required: true,
        },
        status: {
          type: String,
          enum: ["Present", "Absent"],
          required: true,
        },
      }
    ],
  },
  {
    timestamps: true,
  }
);

// Ensure only one attendance record per batch per day
attendanceSchema.index({ date: 1, batch: 1 }, { unique: true });

module.exports = mongoose.model("Attendance", attendanceSchema);
