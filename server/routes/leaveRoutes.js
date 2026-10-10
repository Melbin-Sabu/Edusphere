const express = require("express");
const router = express.Router();
const { protect, authorizeRoles } = require("../middleware/authMiddleware");
const {
  applyForLeave,
  getMyLeaves,
  getTeacherLeaves,
  updateLeaveStatus,
} = require("../controllers/leaveController");

// ==============================
// STUDENT ROUTES
// ==============================
router.post("/apply", protect, authorizeRoles("STUDENT"), applyForLeave);
router.get("/student", protect, authorizeRoles("STUDENT"), getMyLeaves);

// ==============================
// TEACHER ROUTES
// ==============================
// Using TEACHER role, but ADMIN/ADMINISTRATOR can also view if needed.
router.get("/teacher", protect, authorizeRoles("TEACHER", "ADMIN", "ADMINISTRATOR"), getTeacherLeaves);
router.put("/:id/status", protect, authorizeRoles("TEACHER", "ADMIN", "ADMINISTRATOR"), updateLeaveStatus);

module.exports = router;
