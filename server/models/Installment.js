const mongoose = require("mongoose");

const installmentSchema = new mongoose.Schema(
  {
    studentFeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "StudentFee",
      required: true,
    },
    installmentNumber: {
      type: Number,
      required: true,
      min: 1,
    },
    amount: {
      type: Number,
      required: true,
      min: 1,
    },
    dueDate: {
      type: Date,
      required: true,
    },
    paidAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    pendingAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ["UPCOMING", "PENDING", "PARTIALLY_PAID", "PAID", "OVERDUE"],
      default: "UPCOMING",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Installment", installmentSchema);
