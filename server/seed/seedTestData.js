const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const connectDB = require("../config/db");
const User = require("../models/User");
const Student = require("../models/Student");
const Teacher = require("../models/Teacher");

const seedTestData = async () => {
  try {
    await connectDB();

    console.log("Seeding test data...");

    // Password for all seeded users
    const hashedPassword = await bcrypt.hash("123456", 10);

    // 1. Seed some Users
    const teacherUser = await User.findOneAndUpdate(
      { email: "teacher1@example.com" },
      {
        name: "John Doe",
        username: "teacher1",
        email: "teacher1@example.com",
        password: hashedPassword,
        role: "TEACHER",
        status: "Active",
        isFirstLogin: false,
      },
      { upsert: true, new: true }
    );

    const studentUser = await User.findOneAndUpdate(
      { email: "student1@example.com" },
      {
        name: "Jane Smith",
        username: "student1",
        email: "student1@example.com",
        password: hashedPassword,
        role: "STUDENT",
        status: "Active",
        isFirstLogin: false,
      },
      { upsert: true, new: true }
    );

    console.log("✅ Users seeded.");

    // 2. Seed a Teacher
    await Teacher.findOneAndUpdate(
      { email: "teacher1@example.com" },
      {
        user: teacherUser._id,
        firstName: "John",
        lastName: "Doe",
        email: "teacher1@example.com",
        phone: "1234567890",
        department: "Computer Science",
        designation: "Professor",
        gender: "Male",
        dob: new Date("1980-01-01"),
        address: "123 Teacher St, City, Country",
        qualifications: ["PhD in CS", "M.Tech"],
        experience: 10,
        status: "Active"
      },
      { upsert: true, new: true }
    );

    console.log("✅ Teacher seeded.");

    // 3. Seed a Student
    await Student.findOneAndUpdate(
      { email: "student1@example.com" },
      {
        user: studentUser._id,
        student_user: studentUser._id,
        fullName: "Jane Smith",
        email: "student1@example.com",
        mobileNumber: "0987654321",
        dob: new Date("2000-05-15"),
        gender: "Female",
        address: "456 Student Ave, City, Country",
        course: "B.Tech Computer Science",
        batch: "2024",
        admissionNumber: "ADM2024001",
        tenthPercentage: 90,
        twelfthPercentage: 92,
        parentName: "Mr. Smith",
        parentEmail: "parent1@example.com",
        parentMobile: "1122334455",
        relationship: "Father",
        status: "Active"
      },
      { upsert: true, new: true }
    );

    console.log("✅ Student seeded.");

    console.log("🎉 Test data seeded successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Failed to seed test data:", error);
    process.exit(1);
  }
};

seedTestData();
