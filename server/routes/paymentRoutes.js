const express = require("express");
const router = express.Router();
const {
  createRazorpayOrder,
  verifyRazorpayPayment,
} = require("../controllers/paymentController");

// Public / Protected payment routes for Razorpay
router.post("/razorpay/create-order", createRazorpayOrder);
router.post("/razorpay/verify-payment", verifyRazorpayPayment);

module.exports = router;
