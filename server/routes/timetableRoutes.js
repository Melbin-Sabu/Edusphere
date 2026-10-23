const express = require("express");
const router = express.Router();
const {
  saveTimetable,
  getTimetable,
  getAllTimetables,
} = require("../controllers/timetableController");
const { protect, authorizeRoles } = require("../middleware/authMiddleware");

// Save or Update Timetable (Administrator & Admin only)
router.post(
  "/",
  protect,
  authorizeRoles("Administrator", "Admin"),
  saveTimetable
);

// Get Timetable for course and batch (Administrator, Admin, Teacher, Student)
router.get("/", protect, getTimetable);

// Get All Timetables
router.get("/all", protect, getAllTimetables);

module.exports = router;
