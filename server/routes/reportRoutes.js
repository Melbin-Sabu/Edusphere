const express = require("express");
const router = express.Router();
const { protect, authorizeRoles } = require("../middleware/authMiddleware");
const { getAdminAnalytics } = require("../controllers/reportController");

// Only Admin and Administrator can view these reports
router.use(protect);
router.use(authorizeRoles("ADMIN", "ADMINISTRATOR"));

router.get("/analytics", getAdminAnalytics);

module.exports = router;
