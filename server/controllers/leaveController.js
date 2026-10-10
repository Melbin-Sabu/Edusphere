const LeaveRequest = require("../models/LeaveRequest");
const Student = require("../models/Student");
const Teacher = require("../models/Teacher");

// ==============================
// STUDENT CONTROLLERS
// ==============================

// Apply for Leave
const applyForLeave = async (req, res) => {
  try {
    const { startDate, endDate, reason } = req.body;

    // Get the student's record using the authenticated user
    const student = await Student.findOne({ user: req.user._id });
    if (!student) {
      return res.status(403).json({ message: "Student record not found." });
    }

    const leave = new LeaveRequest({
      studentId: student._id,
      batch: student.batch || "General",
      startDate,
      endDate,
      reason,
    });

    await leave.save();

    res.status(201).json({
      success: true,
      message: "Leave application submitted successfully.",
      leave,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get My Leaves
const getMyLeaves = async (req, res) => {
  try {
    const student = await Student.findOne({ user: req.user._id });
    if (!student) {
      return res.status(403).json({ message: "Student record not found." });
    }

    const leaves = await LeaveRequest.find({ studentId: student._id }).sort({ createdAt: -1 });

    res.status(200).json({ success: true, leaves });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==============================
// TEACHER CONTROLLERS
// ==============================

// Get Leaves for assigned batches
const getTeacherLeaves = async (req, res) => {
  try {
    const teacher = await Teacher.findOne({ user: req.user._id });
    if (!teacher) {
      return res.status(403).json({ message: "Teacher record not found." });
    }

    // Teacher can see all leaves for their assigned batches
    // Assuming teacher.assignedBatches exists. If empty, maybe they can see all for now, 
    // but ideally we filter by teacher.assignedBatches.
    const query = {};
    if (teacher.assignedBatches && teacher.assignedBatches.length > 0) {
      query.batch = { $in: teacher.assignedBatches };
    }

    const leaves = await LeaveRequest.find(query)
      .populate("studentId", "fullName admissionNumber course")
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, leaves });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update Leave Status
const updateLeaveStatus = async (req, res) => {
  try {
    const { status, remarks } = req.body;
    const { id } = req.params;

    const teacher = await Teacher.findOne({ user: req.user._id });
    if (!teacher) {
      return res.status(403).json({ message: "Teacher record not found." });
    }

    const leave = await LeaveRequest.findById(id);
    if (!leave) {
      return res.status(404).json({ message: "Leave request not found." });
    }

    leave.status = status;
    if (remarks) {
      leave.teacherRemarks = remarks;
    }
    leave.reviewedBy = teacher._id;
    await leave.save();

    res.status(200).json({
      success: true,
      message: `Leave request ${status.toLowerCase()} successfully.`,
      leave,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  applyForLeave,
  getMyLeaves,
  getTeacherLeaves,
  updateLeaveStatus,
};
