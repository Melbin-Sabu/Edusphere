const express = require("express");
const router = express.Router();

const {
  registerUser,
  loginUser,
  changePassword,
  forgotPassword,
  resetPassword,
  googleLogin,
  addStaffUser,
  getStaffUsers,
  deleteStaffUser,
  getCurrentUser,
} = require("../controllers/authController");
const { protect, authorizeRoles } = require("../middleware/authMiddleware");

// Register Route
router.post("/register", registerUser);

// Login Route
router.post("/login", loginUser);

// Change Password Route
router.post("/change-password", protect, changePassword);

// Forgot Password Route
router.post("/forgot-password", forgotPassword);

// Reset Password Route (Verify Temp Pass & Update)
router.post("/reset-password", resetPassword);

// Google OAuth Login Route
router.post("/google-login", googleLogin);

// Add Staff User (Admin & Teacher) Route
router.post("/add-staff", protect, authorizeRoles("Administrator", "Admin"), addStaffUser);

// Get Staff Users Route
router.get("/staff-users", protect, authorizeRoles("Administrator", "Admin"), getStaffUsers);

// Delete Staff User Route
router.delete("/staff-users/:id", protect, authorizeRoles("Administrator"), deleteStaffUser);

// Get Current User Route
router.get("/me", protect, getCurrentUser);

module.exports = router;