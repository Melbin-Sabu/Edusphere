const express = require("express");
const router = express.Router();
const {
  markAttendance,
  getAttendanceByBatchDate,
  getStudentAttendance
} = require("../controllers/attendanceController");
const { protect, authorizeRoles } = require("../middleware/authMiddleware");

// Teacher routes
router.post("/", protect, authorizeRoles("TEACHER", "ADMIN", "ADMINISTRATOR"), markAttendance);
router.get("/batch/:batch/date/:date", protect, authorizeRoles("TEACHER", "ADMIN", "ADMINISTRATOR"), getAttendanceByBatchDate);

// Student routes
router.get("/student", protect, authorizeRoles("STUDENT"), getStudentAttendance);

module.exports = router;
