const Teacher = require("../models/Teacher");
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const { sendStaffRegistrationEmail } = require("../services/emailService");
const { validateDeepEmail } = require("../utils/deepEmailValidator");

// Helper: Generate Unique Employee ID (e.g. TCH20260001)
const generateEmployeeId = async () => {
  const currentYear = new Date().getFullYear();
  const prefix = `TCH${currentYear}`;

  const lastTeacher = await Teacher.findOne({
    employeeId: new RegExp(`^${prefix}`),
  })
    .sort({ createdAt: -1 })
    .exec();

  let nextSequence = 1;
  if (lastTeacher && lastTeacher.teacher_employee_id) {
    const numericPart = lastTeacher.teacher_employee_id.replace(prefix, "");
    const parsedSeq = parseInt(numericPart, 10);
    if (!isNaN(parsedSeq)) {
      nextSequence = parsedSeq + 1;
    }
  }

  const paddedSequence = String(nextSequence).padStart(4, "0");
  return `${prefix}${paddedSequence}`;
};

// Helper: Generate Secure Temporary Password (e.g., Edu@48392)
const generateTempPassword = () => {
  const randomDigits = Math.floor(10000 + Math.random() * 90000);
  return `Edu@${randomDigits}`;
};

// =======================
// Create / Register Teacher (Stored in MongoDB)
// =======================
const createTeacher = async (req, res) => {
  try {
    const {
      fullName,
      email,
      mobileNumber,
      department,
      subject,
      designation,
      qualification,
      experience,
      gender,
      joiningDate,
      address,
      assignedBatches,
    } = req.body;

    if (!fullName || !email || !mobileNumber || !department || !designation) {
      return res.status(400).json({
        message: "Please fill required fields (fullName, email, mobileNumber, department, designation)",
      });
    }

    // Validate email
    const emailVal = validateDeepEmail(email);
    if (!emailVal.isValid) {
      return res.status(400).json({
        message: `Email Validation Error: ${emailVal.error}`,
      });
    }

    const cleanEmail = email.toLowerCase().trim();

    // Check if user or teacher with email already exists
    const existingUser = await User.findOne({ email: cleanEmail });
    if (existingUser) {
      return res.status(400).json({
        message: "A user account with this email address already exists",
      });
    }

    const existingTeacher = await Teacher.findOne({ email: cleanEmail });
    if (existingTeacher) {
      return res.status(400).json({
        message: "A teacher record with this email address already exists",
      });
    }

    // Generate unique employee ID and temporary password
    const employeeId = await generateEmployeeId();
    const tempPassword = generateTempPassword();
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    // 1. Create User in MongoDB
    const user = await User.create({
      name: fullName.trim(),
      email: cleanEmail,
      password: hashedPassword,
      role: "Teacher",
      isFirstLogin: true,
      status: "Active",
    });

    // 2. Create Teacher details document in MongoDB
    const teacher = await Teacher.create({
      user_id: user._id,
      fullName: fullName.trim(),
      email: cleanEmail,
      employeeId: employeeId,
      mobileNumber: mobileNumber.trim(),
      department: department.trim(),
      subject: subject ? subject.trim() : "General",
      designation: designation.trim(),
      qualification: qualification ? qualification.trim() : "N/A",
      experience: experience ? experience.trim() : "N/A",
      gender: gender || "Male",
      joiningDate: joiningDate ? new Date(joiningDate) : new Date(),
      address: address ? address.trim() : "N/A",
      assignedBatches: Array.isArray(assignedBatches) ? assignedBatches : [],
      status: "Active",
    });

    // 3. Send email notification
    let emailSent = false;
    try {
      const emailResult = await sendStaffRegistrationEmail({
        name: fullName.trim(),
        email: cleanEmail,
        role: "Teacher",
        tempPassword,
      });
      emailSent = emailResult.success;
    } catch (mailErr) {
      console.error("Failed to send teacher welcome email:", mailErr);
    }

    res.status(201).json({
      message: "Teacher account & details stored successfully in MongoDB!",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isFirstLogin: user.isFirstLogin,
        status: user.status,
      },
      teacher,
      tempPassword,
      emailSent,
    });
  } catch (error) {
    console.error("Error creating teacher in MongoDB:", error);
    res.status(500).json({
      message: error.message || "Failed to save teacher details in MongoDB",
    });
  }
};

// =======================
// Get All Teachers from MongoDB
// =======================
const getAllTeachers = async (req, res) => {
  try {
    const { department, search } = req.query;

    let query = {};
    if (department) {
      query.teacher_department = department;
    }

    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { employeeId: { $regex: search, $options: "i" } },
        { department: { $regex: search, $options: "i" } },
      ];
    }

    const teachers = await Teacher.find(query)
      .populate("user", "name email role isFirstLogin status profilePic")
      .sort({ createdAt: -1 });

    res.status(200).json({
      count: teachers.length,
      teachers,
    });
  } catch (error) {
    console.error("Error fetching teachers from MongoDB:", error);
    res.status(500).json({
      message: "Failed to fetch teachers from database",
    });
  }
};

// =======================
// Get Single Teacher by ID
// =======================
const getTeacherById = async (req, res) => {
  try {
    const teacher = await Teacher.findById(req.params.id).populate("user");

    if (!teacher) {
      return res.status(404).json({ message: "Teacher record not found" });
    }

    res.status(200).json({ teacher });
  } catch (error) {
    console.error("Error fetching teacher:", error);
    res.status(500).json({ message: "Failed to fetch teacher details" });
  }
};

// =======================
// Update Teacher Details in MongoDB
// =======================
const updateTeacher = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const teacher = await Teacher.findById(id);
    if (!teacher) {
      return res.status(404).json({ message: "Teacher record not found" });
    }

    // Update teacher details
    const updatedTeacher = await Teacher.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    }).populate("user");

    // Also update associated User name/email/status if changed
    if (updateData.fullName || updateData.email || updateData.status) {
      await User.findByIdAndUpdate(teacher.user_id, {
        ...(updateData.fullName && { name: updateData.fullName }),
        ...(updateData.email && { email: updateData.email.toLowerCase().trim() }),
        ...(updateData.status && { status: updateData.status }),
      });
    }

    res.status(200).json({
      message: "Teacher details updated successfully in MongoDB",
      teacher: updatedTeacher,
    });
  } catch (error) {
    console.error("Error updating teacher in MongoDB:", error);
    res.status(500).json({ message: "Failed to update teacher details" });
  }
};

// =======================
// Delete Teacher from MongoDB
// =======================
const deleteTeacher = async (req, res) => {
  try {
    const { id } = req.params;

    let teacher = await Teacher.findById(id);
    if (!teacher) {
      teacher = await Teacher.findOne({ user_id: id });
    }

    let targetEmail = teacher ? teacher.teacher_email : null;
    let userId = teacher ? teacher.user_id : null;

    if (!teacher) {
      const user = await User.findById(id);
      if (user) {
        targetEmail = user.email;
        userId = user._id;
      }
    }

    if (!teacher && !userId && !targetEmail) {
      return res.status(404).json({ message: "Teacher/User record not found" });
    }

    // Delete all matching User & Teacher records by ID and email to ensure no orphaned user remains
    if (userId) {
      await User.findByIdAndDelete(userId);
    }
    if (teacher) {
      await Teacher.findByIdAndDelete(teacher._id);
    }
    if (targetEmail) {
      const cleanEmail = targetEmail.toLowerCase().trim();
      await User.deleteMany({ email: cleanEmail });
      await Teacher.deleteMany({ email: cleanEmail });
    }

    res.status(200).json({
      message: "Teacher account and MongoDB record deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting teacher:", error);
    res.status(500).json({ message: "Failed to delete teacher record" });
  }
};

// =======================
// Toggle Subject Batch (Class Teacher Action)
// =======================
const toggleSubjectBatch = async (req, res) => {
  try {
    const { teacherId } = req.params;
    const { batchId } = req.body;

    if (!batchId) {
      return res.status(400).json({ message: "Batch ID is required" });
    }

    // Verify logged-in user is the Class Teacher for this batch
    const loggedInTeacher = await Teacher.findOne({ user_id: req.user._id }) || await Teacher.findOne({ user: req.user._id });
    
    if (!loggedInTeacher) {
      return res.status(404).json({ message: "Your teacher profile was not found" });
    }

    if (!loggedInTeacher.assignedBatches || !loggedInTeacher.assignedBatches.includes(batchId)) {
      return res.status(403).json({ message: "You are not authorized to assign subject teachers for this batch" });
    }

    // Find the target teacher
    const targetTeacher = await Teacher.findById(teacherId);
    if (!targetTeacher) {
      return res.status(404).json({ message: "Target teacher not found" });
    }

    // Don't allow assigning a batch as a subject batch if they are already the Class Teacher for it
    if (targetTeacher.assignedBatches && targetTeacher.assignedBatches.includes(batchId)) {
      return res.status(400).json({ message: "This teacher is already the Class Teacher for this batch" });
    }

    // Toggle the batchId in subjectBatches
    let subjectBatches = targetTeacher.subjectBatches || [];
    
    if (subjectBatches.includes(batchId)) {
      subjectBatches = subjectBatches.filter(b => b !== batchId);
    } else {
      subjectBatches.push(batchId);
    }

    targetTeacher.subjectBatches = subjectBatches;
    await targetTeacher.save();

    res.status(200).json({ 
      message: "Subject teacher assignment updated successfully",
      teacher: targetTeacher
    });
  } catch (error) {
    console.error("Error toggling subject batch:", error);
    res.status(500).json({ message: "Failed to update subject teacher assignment" });
  }
};

module.exports = {
  createTeacher,
  getAllTeachers,
  getTeacherById,
  updateTeacher,
  deleteTeacher,
  toggleSubjectBatch,
};
