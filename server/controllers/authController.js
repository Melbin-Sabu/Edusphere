const User = require("../models/User");
const Teacher = require("../models/Teacher");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { sendForgotPasswordEmail, sendStaffRegistrationEmail } = require("../services/emailService");

// =======================
// Register User (Internal / Admin setup)
// =======================
const registerUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Check required fields
    if (!name || !email || !password || !role) {
      return res.status(400).json({
        message: "Please fill all fields",
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });

    if (existingUser) {
      return res.status(400).json({
        message: "User already exists",
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role,
    });

    res.status(201).json({
      message: "User Registered Successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isFirstLogin: user.isFirstLogin,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// =======================
// Login User (Email OR Admission Number)
// =======================
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const identifier = email || req.body.identifier;

    // Check required fields
    if (!identifier || !password) {
      return res.status(400).json({
        message: "Please enter email/admission number and password",
      });
    }

    const trimmedIdentifier = identifier.trim();

    // Find user by Email OR Admission Number
    const user = await User.findOne({
      $or: [
        { email: trimmedIdentifier.toLowerCase() },
        { admissionNumber: trimmedIdentifier },
      ],
    });

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    if (user.status === "Inactive") {
      return res.status(403).json({
        message: "Account is inactive. Please contact administration.",
      });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({
        message: "Invalid password",
      });
    }

    // Generate JWT Token
    const token = jwt.sign(
      {
        id: user._id,
        role: user.role,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "1d",
      }
    );

    const isAdministrator = (user.role || "").toUpperCase() === "ADMINISTRATOR";
    const firstLoginFlag = isAdministrator ? false : Boolean(user.isFirstLogin);

    res.status(200).json({
      message: "Login Successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        admissionNumber: user.admissionNumber || null,
        role: user.role,
        isFirstLogin: firstLoginFlag,
        status: user.status,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// =======================
// Change Password (First Login & Standard)
// =======================
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        message: "Please provide both current and new passwords",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        message: "New password must be at least 6 characters long",
      });
    }

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({
        message: "Incorrect current password",
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    user.password = hashedPassword;
    user.isFirstLogin = false;
    await user.save();

    res.status(200).json({
      message: "Password changed successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        admissionNumber: user.admissionNumber || null,
        role: user.role,
        isFirstLogin: false,
        status: user.status,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// Helper: Generate Secure Temporary Password for reset
const generateResetTempPassword = () => {
  const randomDigits = Math.floor(10000 + Math.random() * 90000);
  return `Reset@${randomDigits}`;
};

// =======================
// Forgot Password (Send Recovery Email)
// =======================
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        message: "Please enter your registered email address",
      });
    }

    const cleanEmail = email.toLowerCase().trim();

    // Check if user exists with this email
    const user = await User.findOne({ email: cleanEmail });

    if (!user) {
      return res.status(404).json({
        message: "No user account found with this email address",
      });
    }

    if (user.status === "Inactive") {
      return res.status(403).json({
        message: "Account is inactive. Please contact administration.",
      });
    }

    // Generate temp reset password
    const tempPassword = generateResetTempPassword();

    // Hash the temporary password
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    user.password = hashedPassword;
    user.isFirstLogin = true; // Force password change on next login
    await user.save();

    // Send email notification via Nodemailer
    const emailResult = await sendForgotPasswordEmail({
      userName: user.name,
      email: cleanEmail,
      tempPassword,
    });

    res.status(200).json({
      message: "Password reset instructions sent successfully to your email",
      emailSent: emailResult.success,
    });
  } catch (error) {
    console.error("Forgot Password Error:", error);
    res.status(500).json({
      message: error.message || "Failed to process forgot password request",
    });
  }
};

// =======================
// Reset Password (Verify Temp Password & Set New Password)
// =======================
const resetPassword = async (req, res) => {
  try {
    const { email, tempPassword, newPassword } = req.body;

    if (!email || !tempPassword || !newPassword) {
      return res.status(400).json({
        message: "Please provide email, temporary password, and new password",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        message: "New password must be at least 6 characters long",
      });
    }

    const cleanEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: cleanEmail });

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    // Verify temporary password
    const isMatch = await bcrypt.compare(tempPassword.trim(), user.password);
    if (!isMatch) {
      return res.status(401).json({
        message: "Invalid temporary password. Please check your email or request a new code.",
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    user.password = hashedPassword;
    user.isFirstLogin = false;
    await user.save();

    // Generate JWT Token so user is logged in
    const token = jwt.sign(
      {
        id: user._id,
        role: user.role,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "1d",
      }
    );

    res.status(200).json({
      message: "Password reset successfully!",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        admissionNumber: user.admissionNumber || null,
        role: user.role,
        isFirstLogin: false,
        status: user.status,
      },
    });
  } catch (error) {
    console.error("Reset Password Error:", error);
    res.status(500).json({
      message: error.message || "Failed to reset password",
    });
  }
};

// =======================
// Google Login / OAuth Single Sign-On
// =======================
const googleLogin = async (req, res) => {
  try {
    const { email, name, googleId } = req.body;

    if (!email) {
      return res.status(400).json({
        message: "Google email is required",
      });
    }

    const cleanEmail = email.toLowerCase().trim();

    // Check if user already exists
    let user = await User.findOne({ email: cleanEmail });

    if (!user) {
      // Create user if not exists
      const dummyPassword = await bcrypt.hash(
        `GoogleOAuth_${Date.now()}_${Math.random()}`,
        10
      );

      user = await User.create({
        name: name || "Google User",
        email: cleanEmail,
        password: dummyPassword,
        role: "Student", // Default role for OAuth
        isFirstLogin: false,
        status: "Active",
      });
    }

    if (user.status === "Inactive") {
      return res.status(403).json({
        message: "Account is inactive. Please contact administration.",
      });
    }

    // Generate JWT Token
    const token = jwt.sign(
      {
        id: user._id,
        role: user.role,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "1d",
      }
    );

    res.status(200).json({
      message: "Google Sign-In Successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        admissionNumber: user.admissionNumber || null,
        role: user.role,
        isFirstLogin: user.isFirstLogin || false,
        status: user.status,
      },
    });
  } catch (error) {
    console.error("Google Login Error:", error);
    res.status(500).json({
      message: error.message || "Failed to process Google sign-in",
    });
  }
};

// Helper: Generate Secure Temporary Password for Staff (e.g. EduSphere@58291)
const generateStaffTempPassword = () => {
  const randomDigits = Math.floor(10000 + Math.random() * 90000);
  return `EduSphere@${randomDigits}`;
};

// =======================
// Add Staff User (Admin & Teacher creation by Administrator/Admin)
// =======================
const addStaffUser = async (req, res) => {
  try {
    const {
      name,
      email,
      role,
      mobileNumber,
      department,
      designation,
      qualification,
      experience,
      gender,
      joiningDate,
      address,
    } = req.body;

    if (!name || !email || !role) {
      return res.status(400).json({
        message: "Please fill all required fields (name, email, role)",
      });
    }

    if (!["Admin", "Teacher", "Administrator"].includes(role)) {
      return res.status(400).json({
        message: "Invalid role specified. Role must be Admin or Teacher",
      });
    }

    const cleanEmail = email.toLowerCase().trim();

    // Check if user already exists
    const existingUser = await User.findOne({ email: cleanEmail });
    if (existingUser) {
      return res.status(400).json({
        message: "A user account with this email address already exists",
      });
    }

    // Generate secure temporary password
    const tempPassword = generateStaffTempPassword();

    // Hash temporary password
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    // Create user in DB
    const user = await User.create({
      name: name.trim(),
      email: cleanEmail,
      password: hashedPassword,
      role: role,
      isFirstLogin: true,
      status: "Active",
    });

    let teacherRecord = null;
    // If creating a Teacher account, also store detailed teacher record in MongoDB
    if (role === "Teacher") {
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
      const employeeId = `${prefix}${String(nextSequence).padStart(4, "0")}`;

      teacherRecord = await Teacher.create({
        user: user._id,
        fullName: name.trim(),
        email: cleanEmail,
        employeeId,
        mobileNumber: mobileNumber ? mobileNumber.trim() : "N/A",
        department: department ? department.trim() : "General",
        designation: designation ? designation.trim() : "Faculty",
        qualification: qualification ? qualification.trim() : "N/A",
        experience: experience ? experience.trim() : "N/A",
        gender: gender || "Male",
        joiningDate: joiningDate ? new Date(joiningDate) : new Date(),
        address: address ? address.trim() : "N/A",
        status: "Active",
      });
    }

    // Send email notification
    const emailResult = await sendStaffRegistrationEmail({
      name: name.trim(),
      email: cleanEmail,
      role,
      tempPassword,
    });

    res.status(201).json({
      message: `${role} account & MongoDB records created successfully!`,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isFirstLogin: user.isFirstLogin,
        status: user.status,
        createdAt: user.createdAt,
      },
      teacher: teacherRecord,
      tempPassword,
      emailSent: emailResult.success,
    });
  } catch (error) {
    console.error("Add Staff Error:", error);
    res.status(500).json({
      message: error.message || "Failed to create staff user account",
    });
  }
};

// =======================
// Get Staff Users (Admins & Teachers)
// =======================
const getStaffUsers = async (req, res) => {
  try {
    const { role } = req.query;
    let query = { role: { $in: ["Admin", "Teacher", "Administrator"] } };

    if (role) {
      query.role = role;
    }

    const users = await User.find(query).select("-password").sort({ createdAt: -1 });

    // If querying teachers, attach their detailed Teacher records from MongoDB
    const usersWithTeacherDetails = await Promise.all(
      users.map(async (userDoc) => {
        const u = userDoc.toObject();
        if (u.role === "Teacher") {
          const teacherDoc = await Teacher.findOne({ user_id: u._id });
          if (teacherDoc) {
            u.teacherDetails = teacherDoc;
            u.employeeId = teacherDoc.employeeId;
            u.department = teacherDoc.department;
            u.designation = teacherDoc.designation;
            u.mobileNumber = teacherDoc.mobileNumber;
            u.qualification = teacherDoc.qualification;
            u.experience = teacherDoc.experience;
            u.gender = teacherDoc.gender;
            u.address = teacherDoc.address;
          }
        }
        return u;
      })
    );

    res.status(200).json({
      users: usersWithTeacherDetails,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message || "Failed to fetch staff accounts",
    });
  }
};

// =======================
// Delete Staff User (Admin/Teacher)
// =======================
const deleteStaffUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);
    let targetEmail = user ? user.email : null;

    if (user) {
      await User.findByIdAndDelete(id);
    }

    if (targetEmail) {
      const cleanEmail = targetEmail.toLowerCase().trim();
      await User.deleteMany({ email: cleanEmail });
      await Teacher.deleteMany({ email: cleanEmail });
      await Student.deleteMany({ email: cleanEmail });
    }

    res.status(200).json({
      message: "Staff user account deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting staff user:", error);
    res.status(500).json({
      message: error.message || "Failed to delete staff user account",
    });
  }
};

// =======================
// Get Current User (/me)
// =======================
const getCurrentUser = async (req, res) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isAdministrator = (user.role || "").toUpperCase() === "ADMINISTRATOR";
    const firstLoginFlag = isAdministrator ? false : Boolean(user.isFirstLogin);

    res.status(200).json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        admissionNumber: user.admissionNumber || null,
        role: user.role,
        isFirstLogin: firstLoginFlag,
        status: user.status,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// Export Functions
module.exports = {
  registerUser,
  loginUser,
  changePassword,
  forgotPassword,
  resetPassword,
  googleLogin,
  addStaffUser,
  getStaffUsers,
  deleteStaffUser,
  getCurrentUser,
};