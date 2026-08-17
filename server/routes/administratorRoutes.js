const express = require("express");
const router = express.Router();
const { protect, authorizeRoles } = require("../middleware/authMiddleware");

const {
  getAdministratorApplications,
  approveApplication,
  markEligibleAndSendPaymentRequest,
  rejectApplication,
  getApplicationById,
} = require("../controllers/applicationController");

// All Administrator routes require protect + ADMINISTRATOR role
router.use(protect);
router.use(authorizeRoles("ADMINISTRATOR"));

router.get("/applications", getAdministratorApplications);
router.get("/applications/:id", getApplicationById);
router.post("/applications/:id/mark-eligible", markEligibleAndSendPaymentRequest);
router.post("/applications/:id/approve", approveApplication);
router.post("/applications/:id/reject", rejectApplication);

module.exports = router;
