const Student = require("../models/Student");
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const { sendStudentRegistrationEmail } = require("../services/emailService");
const { validateDeepEmail } = require("../utils/deepEmailValidator");

// Helper: Generate Unique Admission Number (e.g., EDS20260001)
const generateAdmissionNumber = async () => {
  const currentYear = new Date().getFullYear();
  const prefix = `EDS${currentYear}`;

  // Find the last student with admission number starting with current year prefix
  const lastStudent = await Student.findOne({
    admissionNumber: new RegExp(`^${prefix}`),
  })
    .sort({ createdAt: -1 })
    .exec();

  let nextSequence = 1;
  if (lastStudent && lastStudent.admissionNumber) {
    const numericPart = lastStudent.admissionNumber.replace(prefix, "");
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
// Register Student
// =======================
const registerStudent = async (req, res) => {
  try {
    const {
      fullName,
      email,
      mobileNumber,
      dob,
      gender,
      address,
      course,
      batch,
      tenthPercentage,
      twelfthPercentage,
      parentName,
      parentEmail,
      parentMobile,
      relationship,
    } = req.body;

    // Check required fields
    if (
      !fullName ||
      !email ||
      !mobileNumber ||
      !dob ||
      !gender ||
      !address ||
      !course ||
      !tenthPercentage ||
      !twelfthPercentage ||
      !parentName ||
      !parentEmail ||
      !parentMobile ||
      !relationship
    ) {
      return res.status(400).json({
        message: "Please fill all required student details",
      });
    }

    // 1. Deep Email Validation - Student Email
    const studentEmailVal = validateDeepEmail(email);
    if (!studentEmailVal.isValid) {
      return res.status(400).json({
        message: `Student Email Validation Error: ${studentEmailVal.error}`,
      });
    }

    // 2. Deep Email Validation - Parent Email
    const parentEmailVal = validateDeepEmail(parentEmail);
    if (!parentEmailVal.isValid) {
      return res.status(400).json({
        message: `Parent Email Validation Error: ${parentEmailVal.error}`,
      });
    }

    const cleanEmail = email.toLowerCase().trim();
    const cleanParentEmail = parentEmail.toLowerCase().trim();

    if (cleanEmail === cleanParentEmail) {
      return res.status(400).json({
        message: "Parent email address cannot be identical to student email address",
      });
    }

    // 3. Mobile Number Format & Equality Checks
    const indianMobileRegex = /^[6-9]\d{9}$/;
    if (!indianMobileRegex.test(mobileNumber.trim())) {
      return res.status(400).json({
        message: "Student mobile number must be a valid 10-digit number starting with 6, 7, 8, or 9",
      });
    }

    if (!indianMobileRegex.test(parentMobile.trim())) {
      return res.status(400).json({
        message: "Parent mobile number must be a valid 10-digit number starting with 6, 7, 8, or 9",
      });
    }

    if (mobileNumber.trim() === parentMobile.trim()) {
      return res.status(400).json({
        message: "Parent mobile number cannot be identical to student mobile number",
      });
    }

    // 4. DOB & Student Age Validation (14 to 40 years)
    const dobDate = new Date(dob);
    const today = new Date();
    if (isNaN(dobDate.getTime()) || dobDate >= today) {
      return res.status(400).json({
        message: "Invalid Date of Birth",
      });
    }

    let age = today.getFullYear() - dobDate.getFullYear();
    const m = today.getMonth() - dobDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dobDate.getDate())) {
      age--;
    }

    if (age < 14 || age > 40) {
      return res.status(400).json({
        message: "Student age must be between 14 and 40 years to register",
      });
    }

    // 5. Academic Score Range Checks
    const tenthNum = Number(tenthPercentage);
    const twelfthNum = Number(twelfthPercentage);
    if (isNaN(tenthNum) || tenthNum < 35 || tenthNum > 100) {
      return res.status(400).json({
        message: "10th percentage score must be between 35.00% and 100.00%",
      });
    }

    if (isNaN(twelfthNum) || twelfthNum < 35 || twelfthNum > 100) {
      return res.status(400).json({
        message: "12th percentage score must be between 35.00% and 100.00%",
      });
    }

    // Check if user or student with this email already exists
    const existingUser = await User.findOne({ email: cleanEmail });
    if (existingUser) {
      return res.status(400).json({
        message: "A user with this email already exists",
      });
    }


    // 1. Generate unique Admission Number
    const admissionNumber = await generateAdmissionNumber();

    // 2. Generate secure random temporary password
    const tempPassword = generateTempPassword();

    // 3. Hash the temporary password
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    // 4. Create User document
    const user = await User.create({
      name: fullName.trim(),
      email: cleanEmail,
      admissionNumber,
      password: hashedPassword,
      role: "Student",
      isFirstLogin: true,
      status: "Active",
    });

    // Handle document upload paths if uploaded via multer
    let tenthCertPath = "";
    let twelfthCertPath = "";

    if (req.files) {
      if (req.files.tenthCertificate && req.files.tenthCertificate[0]) {
        tenthCertPath = `/uploads/${req.files.tenthCertificate[0].filename}`;
      }
      if (req.files.twelfthCertificate && req.files.twelfthCertificate[0]) {
        twelfthCertPath = `/uploads/${req.files.twelfthCertificate[0].filename}`;
      }
    }

    // 5. Save complete student information inside students collection
    const student = await Student.create({
      user: user._id,
      fullName: fullName.trim(),
      email: cleanEmail,
      mobileNumber: mobileNumber.trim(),
      dob,
      gender,
      address: address.trim(),
      course: course.trim(),
      batch: batch ? batch.trim() : `${course.trim()} Batch`,
      admissionNumber,
      tenthPercentage: Number(tenthPercentage),
      twelfthPercentage: Number(twelfthPercentage),
      parentName: parentName.trim(),
      parentEmail: parentEmail.trim(),
      parentMobile: parentMobile.trim(),
      relationship: relationship.trim(),
      tenthCertificate: tenthCertPath,
      twelfthCertificate: twelfthCertPath,
      status: "Active",
    });

    // 6. Send automatic email notification via Nodemailer
    const emailResult = await sendStudentRegistrationEmail({
      studentName: fullName,
      email: cleanEmail,
      admissionNumber,
      tempPassword,
    });

    res.status(201).json({
      message: "Student registered successfully",
      student,
      user: {
        id: user._id,
        email: user.email,
        admissionNumber: user.admissionNumber,
        role: user.role,
        isFirstLogin: user.isFirstLogin,
        status: user.status,
      },
      tempPassword, // Returned for admin review/confirmation
      emailSent: emailResult.success,
    });
  } catch (error) {
    console.error("Registration Error:", error);
    res.status(500).json({
      message: error.message || "Failed to register student",
    });
  }
};

// =======================
// Get All Students
// =======================
const getStudents = async (req, res) => {
  try {
    const students = await Student.find()
      .populate("user", "name email admissionNumber status isFirstLogin profilePic")
      .populate("applicationId")
      .sort({ createdAt: -1 });

    res.status(200).json({
      students,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// =======================
// Delete Student from MongoDB
// =======================
const deleteStudent = async (req, res) => {
  try {
    const { id } = req.params;

    let student = await Student.findById(id);
    if (!student) {
      student = await Student.findOne({ user_id: id });
    }

    let targetEmail = student ? student.email : null;
    let userId = student ? student.user_id : null;

    if (!student) {
      const user = await User.findById(id);
      if (user) {
        targetEmail = user.email;
        userId = user._id;
      }
    }

    if (!student && !userId && !targetEmail) {
      return res.status(404).json({ message: "Student/User record not found" });
    }

    if (userId) {
      await User.findByIdAndDelete(userId);
    }
    if (student) {
      await Student.findByIdAndDelete(student._id);
    }
    if (targetEmail) {
      const cleanEmail = targetEmail.toLowerCase().trim();
      await User.deleteMany({ email: cleanEmail });
      await Student.deleteMany({ email: cleanEmail });
    }

    res.status(200).json({
      message: "Student account and MongoDB record deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting student:", error);
    res.status(500).json({ message: "Failed to delete student record" });
  }
};

module.exports = {
  registerStudent,
  getStudents,
  deleteStudent,
};

