const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    studentFeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "StudentFee",
      required: true,
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },
    installmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Installment",
    },
    amount: {
      type: Number,
      required: true,
      min: 1, // Minimum payment of 1
    },
    paymentMethod: {
      type: String,
      enum: ["ONLINE", "CASH", "BANK_TRANSFER", "UPI", "CARD"],
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ["PENDING", "SUCCESS", "FAILED", "REFUNDED"],
      default: "SUCCESS", // Default to SUCCESS for manual recording
    },
    transactionId: {
      type: String,
      trim: true,
    },
    paymentDate: {
      type: Date,
      default: Date.now,
    },
    receiptNumber: {
      type: String,
      unique: true,
      sparse: true,
    },
    recordedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

// Index to quickly fetch a student's payments
paymentSchema.index({ studentId: 1 });

module.exports = mongoose.model("Payment", paymentSchema);
