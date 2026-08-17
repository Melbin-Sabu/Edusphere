const mongoose = require("mongoose");
const Application = require("../models/Application");
const User = require("../models/User");
const Student = require("../models/Student");
const bcrypt = require("bcryptjs");
const { evaluateEligibility } = require("../services/eligibilityService");
const { processMockPayment } = require("../services/paymentService");
const { sendStudentRegistrationEmail } = require("../services/emailService");

/**
 * Generate Next Application ID (APP20260001)
 */
const generateApplicationId = async () => {
  const currentYear = new Date().getFullYear();
  const prefix = `APP${currentYear}`;
  const lastApp = await Application.findOne({
    applicationId: new RegExp(`^${prefix}`),
  })
    .sort({ createdAt: -1 })
    .exec();

  let nextSequence = 1;
  if (lastApp && lastApp.applicationId) {
    const numericPart = lastApp.applicationId.replace(prefix, "");
    const parsedSeq = parseInt(numericPart, 10);
    if (!isNaN(parsedSeq)) {
      nextSequence = parsedSeq + 1;
    }
  }
  return `${prefix}${String(nextSequence).padStart(4, "0")}`;
};

/**
 * Generate Next Admission Number (EDS20260001)
 */
const generateAdmissionNumber = async () => {
  const currentYear = new Date().getFullYear();
  const prefix = `EDS${currentYear}`;
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
  return `${prefix}${String(nextSequence).padStart(4, "0")}`;
};

/**
 * Generate Temporary Password
 */
const generateTempPassword = () => {
  const randomDigits = Math.floor(10000 + Math.random() * 90000);
  return `EduSphere@${randomDigits}`;
};

// ==========================================
// 1. Submit Admission Application (Public)
// ==========================================
const submitApplication = async (req, res) => {
  try {
    const {
      fullName,
      email,
      mobile,
      dateOfBirth,
      gender,
      address,
      courseId,
      batchId,
      tenthPercentage,
      twelfthPercentage,
      parentName,
      parentEmail,
      parentMobile,
      relationship,
    } = req.body;

    // Backend Validation
    if (
      !fullName ||
      !email ||
      !mobile ||
      !dateOfBirth ||
      !gender ||
      !address ||
      !courseId ||
      tenthPercentage === undefined ||
      twelfthPercentage === undefined ||
      !parentName ||
      !parentEmail ||
      !parentMobile ||
      !relationship
    ) {
      return res.status(400).json({
        message: "Please fill all mandatory application fields.",
      });
    }

    const tenthNum = Number(tenthPercentage);
    const twelfthNum = Number(twelfthPercentage);

    if (tenthNum < 0 || tenthNum > 100 || twelfthNum < 0 || twelfthNum > 100) {
      return res.status(400).json({
        message: "Percentages must be between 0 and 100.",
      });
    }

    const cleanEmail = email.toLowerCase().trim();
    const cleanMobile = mobile.trim();

    // Prevent duplicate active applications (allow resubmission if previously REJECTED)
    const existingActiveApp = await Application.findOne({
      $or: [{ email: cleanEmail }, { mobile: cleanMobile }],
      applicationStatus: { $ne: "REJECTED" },
    });

    if (existingActiveApp) {
      const matchField = existingActiveApp.email === cleanEmail ? "email address" : "mobile number";
      return res.status(409).json({
        message: `An active application (${existingActiveApp.applicationId}) already exists for this ${matchField}. Current Status: ${existingActiveApp.applicationStatus}`,
        applicationId: existingActiveApp.applicationId,
        status: existingActiveApp.applicationStatus,
      });
    }

    // Handle Certificate File Uploads (Multer)
    let tenthCertificate = "";
    let twelfthCertificate = "";

    if (req.files) {
      if (req.files.tenthCertificate && req.files.tenthCertificate[0]) {
        tenthCertificate = `/uploads/${req.files.tenthCertificate[0].filename}`;
      }
      if (req.files.twelfthCertificate && req.files.twelfthCertificate[0]) {
        twelfthCertificate = `/uploads/${req.files.twelfthCertificate[0].filename}`;
      }
    } else {
      if (req.body.tenthCertificate) tenthCertificate = req.body.tenthCertificate;
      if (req.body.twelfthCertificate) twelfthCertificate = req.body.twelfthCertificate;
    }

    const applicationId = await generateApplicationId();

    // Run Rule-Based Eligibility Evaluation so Administrator can see computed eligibility
    const eligibilityResult = await evaluateEligibility({
      courseId,
      tenthPercentage: tenthNum,
      twelfthPercentage: twelfthNum,
      tenthCertificate,
      twelfthCertificate,
      dateOfBirth,
    });

    // Store Application with calculated eligibilityStatus and UNDER_REVIEW status for Administrator review
    const application = await Application.create({
      applicationId: applicationId,
      fullName: fullName.trim(),
      email: cleanEmail,
      mobile: cleanMobile,
      dateOfBirth: new Date(dateOfBirth),
      gender: gender,
      address: address.trim(),
      courseId: courseId.trim(),
      batchId: batchId ? batchId.trim() : "General",
      tenthPercentage: tenthNum,
      twelfthPercentage: twelfthNum,
      tenthCertificate: tenthCertificate,
      twelfthCertificate: twelfthCertificate,
      parentName: parentName.trim(),
      parentEmail: parentEmail.toLowerCase().trim(),
      parentMobile: parentMobile.trim(),
      relationship: relationship.trim(),
      eligibilityStatus: eligibilityResult.status,
      applicationStatus: "UNDER_REVIEW",
      paymentStatus: "PENDING",
    });

    res.status(201).json({
      message: "Admission Application submitted successfully! Your application is under Administrator review.",
      application: {
        applicationId: application.applicationId,
        fullName: application.fullName,
        email: application.email,
        eligibilityStatus: application.eligibilityStatus,
        applicationStatus: "UNDER_REVIEW",
      },
      eligibilityResult,
    });
  } catch (error) {
    console.error("Submit Application Error:", error);
    res.status(500).json({
      message: error.message || "Failed to submit admission application.",
    });
  }
};

/**
 * Find Application by ObjectId, applicationId, email, or admissionNumber (direct or via Student model)
 */
const findApplicationByAnyId = async (id) => {
  if (!id) return null;
  const cleanId = String(id).trim();

  // 1. Search directly in Application collection
  let application = await Application.findOne({
    $or: [
      { _id: mongoose.Types.ObjectId.isValid(cleanId) ? cleanId : null },
      { applicationId: new RegExp(`^${cleanId}$`, "i") },
      { email: new RegExp(`^${cleanId}$`, "i") },
    ],
  });

  if (application) return application;

  // 2. Search via Student model for admissionNumber or email link
  const student = await Student.findOne({
    $or: [
      { admissionNumber: new RegExp(`^${cleanId}$`, "i") },
      { email: new RegExp(`^${cleanId}$`, "i") },
    ],
  });

  if (student) {
    application = await Application.findOne({
      $or: [
        { _id: student.applicationId },
        { email: new RegExp(`^${student.email}$`, "i") },
      ],
    });
  }

  return application;
};
// ==========================================
// 2. Get Single Application Details
// ==========================================
const getApplicationById = async (req, res) => {
  try {
    const { id } = req.params;
    const application = await findApplicationByAnyId(id);

    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }

    res.status(200).json({ application });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ==========================================
// 3. Process Registration Fee Payment (Mock)
// ==========================================
const processPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { amount } = req.body;

    const application = await findApplicationByAnyId(id);

    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }

    if (application.eligibilityStatus !== "ELIGIBLE") {
      return res.status(400).json({
        message: "Payment allowed only for ELIGIBLE applications.",
      });
    }

    if (application.paymentStatus === "SUCCESS") {
      return res.status(400).json({
        message: "Payment has already been completed for this application.",
      });
    }

    // Call Mock Payment Service
    const paymentResult = await processMockPayment({
      applicationId: application.applicationId,
      amount: amount || 500,
    });

    application.paymentStatus = "SUCCESS";
    application.applicationStatus = "PAYMENT_SUCCESS";
    application.paymentId = paymentResult.paymentId;
    application.transactionId = paymentResult.transactionId;
    application.paymentAmount = paymentResult.paymentAmount;
    application.paymentDate = paymentResult.paymentDate;

    await application.save();

    res.status(200).json({
      message: "Registration fee payment successful!",
      application,
      paymentResult,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ==========================================
// 4. Get All Applications (Administrator Only)
// ==========================================
const getAdministratorApplications = async (req, res) => {
  try {
    const { status, eligibility } = req.query;
    let filter = {};

    if (status) filter.applicationStatus = status;
    if (eligibility) filter.eligibilityStatus = eligibility;

    const applications = await Application.find(filter).sort({ createdAt: -1 });

    res.status(200).json({ applications });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ==========================================
// 5. Approve Application & Enroll Student (Administrator Only)
// ==========================================
const approveApplication = async (req, res) => {
  try {
    const { id } = req.params;

    const application = await findApplicationByAnyId(id);

    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }

    // Server-side Guard Validations
    if (application.applicationStatus === "ENROLLED" || application.applicationStatus === "APPROVED") {
      return res.status(400).json({
        message: "This application has already been approved and enrolled.",
      });
    }

    // Generate Student Credentials
    // Generate Student Credentials safely
    let user = await User.findOne({ email: application.email.toLowerCase() });
    let admissionNumber = user?.admissionNumber || (await generateAdmissionNumber());
    const tempPassword = generateTempPassword();
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    // Create or Update User Document safely
    if (!user) {
      user = await User.create({
        name: application.fullName,
        email: application.email,
        username: application.email,
        admissionNumber,
        password: hashedPassword,
        role: "STUDENT",
        isFirstLogin: true,
        status: "Active",
      });
    } else {
      user.name = application.fullName;
      user.admissionNumber = admissionNumber;
      user.password = hashedPassword;
      user.role = "STUDENT";
      user.isFirstLogin = true;
      user.status = "Active";
      await user.save();
    }

    // Create or Update Student Document safely
    let student = await Student.findOne({ email: application.email.toLowerCase() });
    if (!student) {
      student = await Student.create({
        user: user._id,
        userId: user._id,
        applicationId: application._id,
        admissionNumber,
        fullName: application.fullName,
        email: application.email,
        mobileNumber: application.mobile,
        dob: application.dateOfBirth,
        gender: application.gender,
        address: application.address,
        course: application.courseId,
        batch: application.batchId,
        tenthPercentage: application.tenthPercentage,
        twelfthPercentage: application.twelfthPercentage,
        tenthCertificate: application.tenthCertificate,
        twelfthCertificate: application.twelfthCertificate,
        parentName: application.parentName,
        parentEmail: application.parentEmail,
        parentMobile: application.parentMobile,
        relationship: application.relationship,
        admissionDate: new Date(),
        status: "Active",
      });
    } else {
      student.admissionNumber = admissionNumber;
      student.student_status = "Active";
      await student.save();
    }

    // Update Application Status & Payment Status
    application.applicationStatus = "ENROLLED";
    application.eligibilityStatus = "ELIGIBLE";
    application.paymentStatus = "SUCCESS";
    application.application_reviewed_by = req.user?._id;
    application.application_reviewed_at = new Date();
    await application.save();

    // Send Credentials Email via Nodemailer (asynchronously with error logging, preventing DB rollback if email fails)
    let emailSent = false;
    try {
      const emailRes = await sendStudentRegistrationEmail({
        studentName: application.fullName,
        email: application.email,
        admissionNumber,
        tempPassword,
      });
      emailSent = emailRes.success;
    } catch (emailErr) {
      console.error("Email dispatch failed on approval:", emailErr.message);
    }

    res.status(200).json({
      message: "Application Approved & Student Enrolled Successfully!",
      admissionNumber,
      tempPassword,
      emailSent,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        admissionNumber: user.admissionNumber,
      },
      student,
    });
  } catch (error) {
    console.error("Approve Application Error:", error);
    res.status(500).json({
      message: error.message || "Failed to approve application.",
    });
  }
};

// ==========================================
// 6. Mark Application Eligible & Send Payment Email (Administrator Only)
// ==========================================
const markEligibleAndSendPaymentRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const mongoose = require("mongoose");
    const { sendPaymentRequestEmail } = require("../services/emailService");

    const application = await findApplicationByAnyId(id);

    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }

    // Generate Admission Number & Temporary Password if not already generated
    let admissionNumber = "";
    let tempPassword = generateTempPassword();

    // Check if User already exists for this application
    let user = await User.findOne({ email: application.email.toLowerCase() });

    if (!user) {
      admissionNumber = await generateAdmissionNumber();
      const hashedPassword = await bcrypt.hash(tempPassword, 10);

      user = await User.create({
        name: application.fullName,
        email: application.email,
        username: application.email,
        admissionNumber,
        password: hashedPassword,
        role: "STUDENT",
        isFirstLogin: true,
        status: "Active",
      });

      await Student.create({
        user: user._id,
        userId: user._id,
        applicationId: application._id,
        admissionNumber,
        fullName: application.fullName,
        email: application.email,
        mobileNumber: application.mobile,
        dob: application.dateOfBirth,
        gender: application.gender,
        address: application.address,
        course: application.courseId,
        batch: application.batchId,
        tenthPercentage: application.tenthPercentage,
        twelfthPercentage: application.twelfthPercentage,
        tenthCertificate: application.tenthCertificate,
        twelfthCertificate: application.twelfthCertificate,
        parentName: application.parentName,
        parentEmail: application.parentEmail,
        parentMobile: application.parentMobile,
        relationship: application.relationship,
        admissionDate: new Date(),
        status: "Active",
      });
    } else {
      admissionNumber = user.admissionNumber || (await generateAdmissionNumber());
    }

    application.eligibilityStatus = "ELIGIBLE";
    application.applicationStatus = "PAYMENT_PENDING";
    application.application_reviewed_by = req.user?._id;
    application.application_reviewed_at = new Date();

    await application.save();

    // Send Email to Applicant with Admission Number, Temporary Password, Payment Link, and First-Login Password Notice
    let emailSent = false;
    try {
      const emailRes = await sendPaymentRequestEmail({
        applicantName: application.fullName,
        email: application.email,
        applicationId: application.applicationId,
        admissionNumber,
        tempPassword,
      });
      emailSent = emailRes.success;
    } catch (emailErr) {
      console.error("Payment request email dispatch failed:", emailErr.message);
    }

    res.status(200).json({
      message: "Application marked as ELIGIBLE. Student credentials generated and email sent with payment link!",
      application,
      admissionNumber,
      tempPassword,
      emailSent,
    });
  } catch (error) {
    console.error("Mark Eligible Error:", error);
    res.status(500).json({ message: error.message || "Failed to process eligibility approval." });
  }
};

// ==========================================
// 7. Reject Application (Administrator Only)
// ==========================================
const rejectApplication = async (req, res) => {
  try {
    const { id } = req.params;
    const { rejectionReason } = req.body;

    if (!rejectionReason) {
      return res.status(400).json({
        message: "Please provide a rejection reason.",
      });
    }

    const application = await Application.findOne({
      $or: [{ _id: mongoose.Types.ObjectId.isValid(id) ? id : null }, { applicationId: id }],
    });

    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }

    if (application.applicationStatus === "ENROLLED") {
      return res.status(400).json({
        message: "Cannot reject an application that is already ENROLLED.",
      });
    }

    application.applicationStatus = "REJECTED";
    application.application_rejection_reason = rejectionReason.trim();
    application.application_reviewed_by = req.user?._id;
    application.application_reviewed_at = new Date();

    await application.save();

    res.status(200).json({
      message: "Application rejected.",
      application,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  submitApplication,
  getApplicationById,
  processPayment,
  getAdministratorApplications,
  approveApplication,
  markEligibleAndSendPaymentRequest,
  rejectApplication,
};
