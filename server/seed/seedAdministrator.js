const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const connectDB = require("../config/db");
const User = require("../models/User");

const seedAdministrator = async () => {
  try {
    await connectDB();

    const adminEmail = "melbin@gmail.com";
    const existingAdmin = await User.findOne({ email: adminEmail.toLowerCase() });

    if (existingAdmin) {
      console.log(`ℹ️ Administrator account already exists (${adminEmail}). No duplicate created.`);
      process.exit(0);
    }

    const hashedPassword = await bcrypt.hash("123456", 10);

    const newAdmin = await User.create({
      name: "Administrator",
      email: adminEmail.toLowerCase(),
      username: "melbin",
      password: hashedPassword,
      role: "ADMINISTRATOR",
      status: "Active",
      isFirstLogin: false,
    });

    console.log("✅ Initial Administrator account created successfully!");
    console.log(`   Email: ${newAdmin.email}`);
    console.log(`   Role: ${newAdmin.role}`);
    console.log(`   isFirstLogin: ${newAdmin.isFirstLogin}`);
    process.exit(0);
  } catch (error) {
    console.error("❌ Failed to seed Administrator:", error);
    process.exit(1);
  }
};

seedAdministrator();
