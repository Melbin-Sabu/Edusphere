const express = require("express");
const router = express.Router();
const {
  createTeacher,
  getAllTeachers,
  getTeacherById,
  updateTeacher,
  deleteTeacher,
} = require("../controllers/teacherController");
const { protect, authorizeRoles } = require("../middleware/authMiddleware");

// Register / Create Teacher in MongoDB (Administrator only)
router.post(
  "/",
  protect,
  authorizeRoles("Administrator"),
  createTeacher
);

// Get All Teachers (Administrator, Admin, Teacher)
router.get(
  "/",
  protect,
  authorizeRoles("Administrator", "Admin", "Teacher"),
  getAllTeachers
);

// Get Single Teacher by ID
router.get(
  "/:id",
  protect,
  authorizeRoles("Administrator", "Admin", "Teacher"),
  getTeacherById
);

// Update Teacher in MongoDB
router.put(
  "/:id",
  protect,
  authorizeRoles("Administrator", "Admin"),
  updateTeacher
);

// Delete Teacher from MongoDB
router.delete(
  "/:id",
  protect,
  authorizeRoles("Administrator"),
  deleteTeacher
);

module.exports = router;
