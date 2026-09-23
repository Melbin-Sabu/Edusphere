const mongoose = require("mongoose");

const feeStructureSchema = new mongoose.Schema(
  {
    courseId: {
      type: String,
      required: true,
      trim: true,
    },
    scope: {
      type: String,
      enum: ["COURSE", "BATCH"],
      default: "COURSE",
    },
    batchId: {
      type: String,
      trim: true,
    },
    academicYear: {
      type: String,
      required: true,
      trim: true,
    },
    components: [
      {
        name: {
          type: String,
          required: true,
        },
        amount: {
          type: Number,
          required: true,
          min: 0,
        },
      },
    ],
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    dueDate: {
      type: Date,
      required: true,
    },
    installmentEnabled: {
      type: Boolean,
      default: false,
    },
    installmentCount: {
      type: Number,
      min: 1,
    },
    installmentIntervalMonths: {
      type: Number,
      min: 1,
    },
    firstInstallmentDate: {
      type: Date,
    },
    status: {
      type: String,
      enum: ["ACTIVE", "INACTIVE"],
      default: "ACTIVE",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("FeeStructure", feeStructureSchema);
