const express = require("express");
const router = express.Router();
const { protect, authorizeRoles } = require("../middleware/authMiddleware");
const feeController = require("../controllers/feeController");

// Protect all fee routes
router.use(protect);

// Fee Structures (Admin/Administrator)
router.post(
  "/structures",
  authorizeRoles("ADMINISTRATOR", "ADMIN"),
  feeController.createFeeStructure
);
router.get(
  "/structures",
  authorizeRoles("ADMINISTRATOR", "ADMIN"),
  feeController.getFeeStructures
);
router.delete(
  "/structures/:id",
  authorizeRoles("ADMINISTRATOR", "ADMIN"),
  feeController.deleteFeeStructure
);

// Student Fees (Admin/Administrator)
router.get(
  "/students",
  authorizeRoles("ADMINISTRATOR", "ADMIN"),
  feeController.getStudentFees
);

// My Fees (Student)
router.get(
  "/my-fees",
  authorizeRoles("STUDENT"),
  feeController.getMyFees
);

// Payments (Admin/Administrator)
router.post(
  "/payments",
  authorizeRoles("ADMINISTRATOR", "ADMIN"),
  feeController.recordPayment
);
router.get(
  "/payments",
  authorizeRoles("ADMINISTRATOR", "ADMIN"),
  feeController.getPayments
);

// Receipts (Accessible by Admin/Administrator or specific Student)
router.get(
  "/payments/:id/receipt",
  feeController.getReceipt
);

// Reports (Admin/Administrator)
router.get(
  "/reports/summary",
  authorizeRoles("ADMINISTRATOR", "ADMIN"),
  feeController.getFeeReports
);

// Installments
router.get(
  "/:studentFeeId/installments",
  feeController.getInstallments
);

router.post(
  "/installments/:installmentId/pay",
  authorizeRoles("STUDENT"),
  feeController.payInstallment
);

router.post(
  "/:studentFeeId/pay-full",
  authorizeRoles("STUDENT"),
  feeController.payFullFee
);

module.exports = router;
