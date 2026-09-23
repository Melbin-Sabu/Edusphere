const FeeStructure = require("../models/FeeStructure");
const StudentFee = require("../models/StudentFee");
const Payment = require("../models/Payment");
const Student = require("../models/Student");
const Installment = require("../models/Installment");
const mongoose = require("mongoose");

// Helper to update Overdue statuses
const updateOverdueStatuses = async () => {
  const currentDate = new Date();
  
  // Update Installments
  await Installment.updateMany(
    { 
      dueDate: { $lt: currentDate }, 
      status: { $in: ["UPCOMING", "PENDING", "PARTIALLY_PAID"] },
      pendingAmount: { $gt: 0 }
    },
    { $set: { status: "OVERDUE" } }
  );

  // Update StudentFees based on Installments and its own due date
  // A StudentFee is overdue if it has ANY overdue installment, OR if its own dueDate is past and it's pending
  await StudentFee.updateMany(
    { 
      dueDate: { $lt: currentDate }, 
      status: { $in: ["PENDING", "PARTIALLY_PAID"] },
      pendingAmount: { $gt: 0 }
    },
    { $set: { status: "OVERDUE" } }
  );
  
  // Sync StudentFee status based on installments (if installments exist and are OVERDUE)
  const overdueInstallments = await Installment.find({ status: "OVERDUE" }).distinct("studentFeeId");
  if (overdueInstallments.length > 0) {
    await StudentFee.updateMany(
      { _id: { $in: overdueInstallments }, status: { $ne: "OVERDUE" }, pendingAmount: { $gt: 0 } },
      { $set: { status: "OVERDUE" } }
    );
  }
};

// 1. Create a new Fee Structure
exports.createFeeStructure = async (req, res) => {
  try {
    const { 
      courseId, batchId, scope, academicYear, components, dueDate, 
      installmentEnabled, installmentCount, installmentIntervalMonths, firstInstallmentDate 
    } = req.body;

    if (!courseId || !academicYear || !components || !dueDate) {
      return res.status(400).json({ message: "Required fields are missing" });
    }

    const assignedScope = scope || "COURSE";
    if (assignedScope === "BATCH" && !batchId) {
      return res.status(400).json({ message: "Batch ID is required for BATCH scope" });
    }

    const totalAmount = components.reduce((acc, curr) => acc + Number(curr.amount), 0);

    const feeStructure = await FeeStructure.create({
      courseId,
      batchId: assignedScope === "BATCH" ? batchId : undefined,
      scope: assignedScope,
      academicYear,
      components,
      totalAmount,
      dueDate,
      installmentEnabled,
      installmentCount,
      installmentIntervalMonths,
      firstInstallmentDate,
      createdBy: req.user._id,
    });

    // Determine eligible active students
    let studentQuery = { 
      course: new RegExp(`^${courseId}$`, "i"), 
      status: "Active" 
    };
    if (assignedScope === "BATCH") {
      studentQuery.batch = new RegExp(`^${batchId}$`, "i");
    }

    const students = await Student.find(studentQuery);
    let studentsAssignedCount = 0;

    if (students.length > 0) {
      // Find existing fees to prevent duplicates and handle BATCH override
      const existingStudentFees = await StudentFee.find({
        studentId: { $in: students.map(s => s._id) }
      }).populate("feeStructureId");

      for (const student of students) {
        const existingFeesForCourseYear = existingStudentFees.filter(sf => 
          sf.studentId.toString() === student._id.toString() && 
          sf.feeStructureId &&
          sf.feeStructureId.academicYear === academicYear &&
          sf.feeStructureId.courseId.toLowerCase() === courseId.toLowerCase()
        );

        let shouldAssign = true;
        
        if (existingFeesForCourseYear.length > 0) {
          // If we are applying a BATCH scope fee, it should override a COURSE scope fee (if no payments made)
          if (assignedScope === "BATCH") {
            const courseFee = existingFeesForCourseYear.find(sf => sf.feeStructureId.scope === "COURSE");
            if (courseFee && courseFee.paidAmount === 0) {
              await Installment.deleteMany({ studentFeeId: courseFee._id });
              await StudentFee.findByIdAndDelete(courseFee._id);
            } else {
              shouldAssign = false; // Cannot override, either already has BATCH fee or has payments
            }
          } else {
            shouldAssign = false; // COURSE fee cannot override existing fees
          }
        }

        if (shouldAssign) {
          const studentFee = await StudentFee.create({
            studentId: student._id,
            feeStructureId: feeStructure._id,
            totalAmount,
            paidAmount: 0,
            pendingAmount: totalAmount,
            dueDate,
            status: "PENDING"
          });

          // Generate Installments
          if (installmentEnabled && installmentCount > 0) {
            const baseAmount = Math.floor(totalAmount / installmentCount);
            let remaining = totalAmount;
            let installmentsToInsert = [];
            
            for (let i = 1; i <= installmentCount; i++) {
              let instAmount = (i === installmentCount) ? remaining : baseAmount;
              remaining -= instAmount;
              
              let instDate = new Date(firstInstallmentDate);
              instDate.setMonth(instDate.getMonth() + ((i - 1) * (installmentIntervalMonths || 1)));
              
              installmentsToInsert.push({
                studentFeeId: studentFee._id,
                installmentNumber: i,
                amount: instAmount,
                dueDate: instDate,
                pendingAmount: instAmount,
                status: "UPCOMING"
              });
            }
            await Installment.insertMany(installmentsToInsert);
          }
          studentsAssignedCount++;
        }
      }
    }

    res.status(201).json({ message: "Fee structure created successfully", feeStructure, studentsAssigned: studentsAssignedCount });
  } catch (error) {
    console.error("Create Fee Structure Error:", error);
    res.status(500).json({ message: "Server error creating fee structure" });
  }
};

// 2. Get all Fee Structures
exports.getFeeStructures = async (req, res) => {
  try {
    const structures = await FeeStructure.find().sort("-createdAt").populate("createdBy", "name email");
    res.status(200).json({ feeStructures: structures });
  } catch (error) {
    res.status(500).json({ message: "Server error fetching fee structures" });
  }
};

// 3. Get all Student Fees (For Admin)
exports.getStudentFees = async (req, res) => {
  try {
    await updateOverdueStatuses();
    const { courseId, batchId, status } = req.query;
    
    let studentMatch = {};
    if (courseId) studentMatch.course = courseId;
    if (batchId) studentMatch.batch = batchId;

    let feeQuery = {};
    if (status) feeQuery.status = status;

    const studentFees = await StudentFee.find(feeQuery)
      .populate({
        path: "studentId",
        match: Object.keys(studentMatch).length > 0 ? studentMatch : null,
        select: "fullName admissionNumber course batch email mobileNumber"
      })
      .populate("feeStructureId", "academicYear scope")
      .sort("-createdAt");

    const filteredFees = studentFees.filter(fee => fee.studentId !== null);

    res.status(200).json({ studentFees: filteredFees });
  } catch (error) {
    res.status(500).json({ message: "Server error fetching student fees" });
  }
};

// 4. Get My Fees (For Student)
exports.getMyFees = async (req, res) => {
  try {
    await updateOverdueStatuses();
    
    const student = await Student.findOne({ user: req.user._id });
    if (!student) {
      return res.status(404).json({ message: "Student record not found" });
    }

    const myFees = await StudentFee.find({ studentId: student._id })
      .populate("feeStructureId")
      .sort("-createdAt")
      .lean();

    // Fetch installments and attach to fees
    for (let fee of myFees) {
      fee.installments = await Installment.find({ studentFeeId: fee._id }).sort("installmentNumber");
    }

    const feeIds = myFees.map(f => f._id);
    const payments = await Payment.find({ studentFeeId: { $in: feeIds }, paymentStatus: "SUCCESS" }).sort("-createdAt");

    res.status(200).json({ myFees, payments });
  } catch (error) {
    res.status(500).json({ message: "Server error fetching your fees" });
  }
};

// 5. Record a Payment (Admin/Administrator)
exports.recordPayment = async (req, res) => {
  try {
    const { studentFeeId, installmentId, amount, paymentMethod, transactionId } = req.body;

    if (!amount || amount <= 0) {
      throw new Error("Invalid payment amount");
    }

    const studentFee = await StudentFee.findById(studentFeeId);
    if (!studentFee) {
      throw new Error("Student Fee record not found");
    }

    let targetInstallment = null;
    if (installmentId) {
      targetInstallment = await Installment.findById(installmentId);
      if (!targetInstallment || targetInstallment.studentFeeId.toString() !== studentFeeId) {
        throw new Error("Invalid installment");
      }
      if (amount > targetInstallment.pendingAmount) {
        throw new Error(`Amount exceeds pending installment amount. Pending: ₹${targetInstallment.pendingAmount}`);
      }
    } else {
      if (amount > studentFee.pendingAmount) {
        throw new Error(`Amount exceeds pending amount. Pending: ₹${studentFee.pendingAmount}`);
      }
    }

    const receiptNumber = `RCPT-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const payment = new Payment({
      studentFeeId: studentFee._id,
      studentId: studentFee.studentId,
      installmentId: targetInstallment ? targetInstallment._id : undefined,
      amount,
      paymentMethod,
      transactionId: transactionId || "N/A",
      paymentStatus: "SUCCESS", 
      receiptNumber,
      recordedBy: req.user._id
    });
    
    await payment.save();

    // Update Installment if applicable
    if (targetInstallment) {
      targetInstallment.paidAmount += Number(amount);
      targetInstallment.pendingAmount = targetInstallment.amount - targetInstallment.paidAmount;
      
      if (targetInstallment.pendingAmount === 0) {
        targetInstallment.status = "PAID";
      } else {
        const currentDate = new Date();
        if (targetInstallment.dueDate < currentDate) {
          targetInstallment.status = "OVERDUE";
        } else {
          targetInstallment.status = "PARTIALLY_PAID";
        }
      }
      await targetInstallment.save();
    }

    // Update Student Fee
    studentFee.paidAmount += Number(amount);
    studentFee.pendingAmount = studentFee.totalAmount - studentFee.paidAmount;

    if (studentFee.pendingAmount === 0) {
      studentFee.status = "PAID";
    } else {
      const currentDate = new Date();
      // Check if any installment is overdue
      const hasOverdueInstallment = await Installment.exists({ studentFeeId: studentFee._id, status: "OVERDUE" });
      
      if (hasOverdueInstallment || studentFee.dueDate < currentDate) {
        studentFee.status = "OVERDUE";
      } else {
        studentFee.status = "PARTIALLY_PAID";
      }
    }

    await studentFee.save();

    res.status(201).json({ message: "Payment recorded successfully", payment });
  } catch (error) {
    console.error("Record Payment Error:", error);
    res.status(400).json({ message: error.message || "Failed to record payment" });
  }
};

// 6. Get Payment History (Admin)
exports.getPayments = async (req, res) => {
  try {
    const payments = await Payment.find()
      .populate("studentId", "fullName admissionNumber course batch")
      .populate("recordedBy", "name")
      .sort("-paymentDate");
    res.status(200).json({ payments });
  } catch (error) {
    res.status(500).json({ message: "Server error fetching payments" });
  }
};

// 7. Get Receipt details
exports.getReceipt = async (req, res) => {
  try {
    const { id } = req.params;
    const payment = await Payment.findById(id)
      .populate("studentId", "fullName admissionNumber course batch email")
      .populate({
        path: "studentFeeId",
        populate: { path: "feeStructureId", select: "academicYear components totalAmount scope" }
      });
      
    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }

    if (req.user.role.toUpperCase() === "STUDENT") {
      const student = await Student.findOne({ user: req.user._id });
      if (!student || student._id.toString() !== payment.studentId._id.toString()) {
        return res.status(403).json({ message: "Unauthorized access to this receipt" });
      }
    }

    res.status(200).json({ payment });
  } catch (error) {
    res.status(500).json({ message: "Server error fetching receipt" });
  }
};

// 8. Get Reports
exports.getFeeReports = async (req, res) => {
  try {
    await updateOverdueStatuses();
    
    const overallStats = await StudentFee.aggregate([
      {
        $group: {
          _id: null,
          totalExpected: { $sum: "$totalAmount" },
          totalCollected: { $sum: "$paidAmount" },
          totalPending: { $sum: "$pendingAmount" }
        }
      }
    ]);

    const overdueStats = await StudentFee.aggregate([
      { $match: { status: "OVERDUE" } },
      {
        $group: {
          _id: null,
          totalOverdue: { $sum: "$pendingAmount" },
          count: { $sum: 1 }
        }
      }
    ]);

    const recentPayments = await Payment.find({ paymentStatus: "SUCCESS" })
      .populate("studentId", "fullName admissionNumber course")
      .sort("-paymentDate")
      .limit(5);

    res.status(200).json({
      summary: overallStats[0] || { totalExpected: 0, totalCollected: 0, totalPending: 0 },
      overdue: overdueStats[0] || { totalOverdue: 0, count: 0 },
      recentPayments
    });
  } catch (error) {
    res.status(500).json({ message: "Server error generating reports" });
  }
};

// 9. Get Installments for a Fee
exports.getInstallments = async (req, res) => {
  try {
    const { studentFeeId } = req.params;
    
    const studentFee = await StudentFee.findById(studentFeeId);
    if (!studentFee) return res.status(404).json({ message: "Fee record not found" });

    if (req.user.role.toUpperCase() === "STUDENT") {
      const student = await Student.findOne({ user: req.user._id });
      if (!student || student._id.toString() !== studentFee.studentId.toString()) {
        return res.status(403).json({ message: "Unauthorized" });
      }
    }

    const installments = await Installment.find({ studentFeeId }).sort("installmentNumber");
    res.status(200).json({ installments });
  } catch (error) {
    res.status(500).json({ message: "Server error fetching installments" });
  }
};

// 10. Pay Installment (Simulated for Student)
exports.payInstallment = async (req, res) => {
  try {
    const { installmentId } = req.params;
    
    const student = await Student.findOne({ user: req.user._id });
    if (!student) throw new Error("Student not found");

    const installment = await Installment.findById(installmentId);
    if (!installment) throw new Error("Installment not found");

    const studentFee = await StudentFee.findById(installment.studentFeeId);
    if (!studentFee || studentFee.studentId.toString() !== student._id.toString()) {
      throw new Error("Unauthorized access to this installment");
    }

    const amount = installment.pendingAmount;
    if (amount <= 0) throw new Error("Installment already paid");

    const receiptNumber = `RCPT-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const payment = new Payment({
      studentFeeId: studentFee._id,
      studentId: student._id,
      installmentId: installment._id,
      amount,
      paymentMethod: "ONLINE",
      transactionId: `MOCK-TXN-${Date.now()}`,
      paymentStatus: "SUCCESS",
      receiptNumber,
      recordedBy: req.user._id
    });
    
    await payment.save();

    installment.paidAmount += amount;
    installment.pendingAmount = 0;
    installment.status = "PAID";
    await installment.save();

    studentFee.paidAmount += amount;
    studentFee.pendingAmount = studentFee.totalAmount - studentFee.paidAmount;

    if (studentFee.pendingAmount === 0) {
      studentFee.status = "PAID";
    } else {
      const hasOverdueInstallment = await Installment.exists({ studentFeeId: studentFee._id, status: "OVERDUE" });
      if (hasOverdueInstallment) {
        studentFee.status = "OVERDUE";
      } else {
        studentFee.status = "PARTIALLY_PAID";
      }
    }
    await studentFee.save();

    res.status(200).json({ message: "Installment paid successfully", payment });
  } catch (error) {
    res.status(400).json({ message: error.message || "Failed to process payment" });
  }
};

// 11. Delete Fee Structure (Admin/Administrator)
exports.deleteFeeStructure = async (req, res) => {
  try {
    const { id } = req.params;
    
    const studentFees = await StudentFee.find({ feeStructureId: id });
    const hasPayments = studentFees.some(fee => fee.paidAmount > 0);
    
    if (hasPayments) {
      throw new Error("Cannot delete fee structure because payments have already been recorded.");
    }

    const feeIds = studentFees.map(fee => fee._id);
    
    await Installment.deleteMany({ studentFeeId: { $in: feeIds } });
    await StudentFee.deleteMany({ feeStructureId: id });
    await FeeStructure.findByIdAndDelete(id);

    res.status(200).json({ message: "Fee structure deleted successfully" });
  } catch (error) {
    res.status(400).json({ message: error.message || "Failed to delete fee structure" });
  }
};

// 12. Pay Full Fee (Simulated for Student)
exports.payFullFee = async (req, res) => {
  try {
    const { studentFeeId } = req.params;
    
    const student = await Student.findOne({ user: req.user._id });
    if (!student) throw new Error("Student not found");

    const studentFee = await StudentFee.findById(studentFeeId);
    if (!studentFee || studentFee.studentId.toString() !== student._id.toString()) {
      throw new Error("Unauthorized access to this fee");
    }

    const amount = studentFee.pendingAmount;
    if (amount <= 0) throw new Error("Fee already paid in full");

    const receiptNumber = `RCPT-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const payment = new Payment({
      studentFeeId: studentFee._id,
      studentId: student._id,
      amount,
      paymentMethod: "ONLINE",
      transactionId: `MOCK-TXN-${Date.now()}`,
      paymentStatus: "SUCCESS",
      receiptNumber,
      recordedBy: req.user._id
    });
    
    await payment.save();

    const installments = await Installment.find({ studentFeeId: studentFee._id });
    for (let inst of installments) {
      if (inst.pendingAmount > 0) {
        inst.paidAmount += inst.pendingAmount;
        inst.pendingAmount = 0;
        inst.status = "PAID";
        await inst.save();
      }
    }

    studentFee.paidAmount += amount;
    studentFee.pendingAmount = 0;
    studentFee.status = "PAID";
    await studentFee.save();

    res.status(200).json({ message: "Full fee paid successfully", payment });
  } catch (error) {
    res.status(400).json({ message: error.message || "Failed to process full payment" });
  }
};
