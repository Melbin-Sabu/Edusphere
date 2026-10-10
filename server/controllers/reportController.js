const Attendance = require("../models/Attendance");
const Student = require("../models/Student");
const QuizAttempt = require("../models/QuizAttempt");

const getAdminAnalytics = async (req, res) => {
  try {
    // 1. Fetch all active students
    const students = await Student.find({ status: "Active" }).select("fullName admissionNumber course batch");

    // 2. Compute Attendance for all students
    const attendances = await Attendance.find({});
    
    // Map of studentId -> { present: number, total: number }
    const attendanceStats = {};
    
    attendances.forEach(att => {
      att.records.forEach(record => {
        const sid = record.studentId.toString();
        if (!attendanceStats[sid]) {
          attendanceStats[sid] = { present: 0, total: 0 };
        }
        attendanceStats[sid].total += 1;
        if (record.status === "Present" || record.status === "Late") {
          attendanceStats[sid].present += 1;
        }
      });
    });

    // 3. Compute Quiz Leaderboard
    // Fetch all submitted quiz attempts
    const attempts = await QuizAttempt.find({ status: { $in: ["SUBMITTED", "AUTO_SUBMITTED"] } });
    
    // Map of studentId -> { totalPercentage: number, quizzesTaken: number }
    const quizStats = {};

    attempts.forEach(attempt => {
      if (!attempt.studentId) return;
      const sid = attempt.studentId.toString();
      if (!quizStats[sid]) {
        quizStats[sid] = { totalPercentage: 0, quizzesTaken: 0 };
      }
      quizStats[sid].totalPercentage += (attempt.percentage || 0);
      quizStats[sid].quizzesTaken += 1;
    });

    // 4. Combine data for all students
    const result = students.map(student => {
      const sid = student._id.toString();
      
      // Attendance Percentage
      const att = attendanceStats[sid];
      let attendancePercentage = 0;
      if (att && att.total > 0) {
        attendancePercentage = Math.round((att.present / att.total) * 100);
      }

      // Quiz Performance
      const qz = quizStats[sid];
      let quizPercentage = 0;
      let totalQuizzes = 0;
      if (qz && qz.quizzesTaken > 0) {
        quizPercentage = Math.round(qz.totalPercentage / qz.quizzesTaken);
        totalQuizzes = qz.quizzesTaken;
      }

      return {
        id: sid,
        name: student.fullName,
        admissionNumber: student.admissionNumber,
        course: student.course,
        batch: student.batch,
        attendancePercentage,
        quizPercentage,
        totalQuizzes,
      };
    });

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Error in getAdminAnalytics:", error);
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message
    });
  }
};

module.exports = {
  getAdminAnalytics,
};
