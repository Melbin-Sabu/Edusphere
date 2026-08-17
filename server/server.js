const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
require("dotenv").config();

const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const studentRoutes = require("./routes/studentRoutes");
const teacherRoutes = require("./routes/teacherRoutes");
const uploadRoutes = require("./routes/uploadRoutes");
const applicationRoutes = require("./routes/applicationRoutes");
const administratorRoutes = require("./routes/administratorRoutes");
const paymentRoutes = require("./routes/paymentRoutes");

const app = express();

// Connect Database
connectDB();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ensure upload directories exist
const uploadsDir = path.join(__dirname, "uploads");
const certificatesDir = path.join(uploadsDir, "certificates");
const profilePicsDir = path.join(uploadsDir, "profile-pics");

[uploadsDir, certificatesDir, profilePicsDir].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Serve uploaded files statically (from root uploads, certificates, and profile-pics subdirectories)
app.use("/uploads", express.static(uploadsDir));
app.use("/uploads", express.static(certificatesDir));
app.use("/uploads", express.static(profilePicsDir));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/teachers", teacherRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api/administrator", administratorRoutes);
app.use("/api/payment", paymentRoutes);

// Test Route
app.get("/", (req, res) => {
  res.send("EduSphere Backend Running...");
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT} (accessible via 0.0.0.0)`);
});