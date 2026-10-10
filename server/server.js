const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const rateLimit = require("express-rate-limit");
require("dotenv").config();

const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const studentRoutes = require("./routes/studentRoutes");
const teacherRoutes = require("./routes/teacherRoutes");
const uploadRoutes = require("./routes/uploadRoutes");
const applicationRoutes = require("./routes/applicationRoutes");
const administratorRoutes = require("./routes/administratorRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const noteRoutes = require("./routes/noteRoutes");
const aiRoutes = require("./routes/aiRoutes");
const feeRoutes = require("./routes/feeRoutes");
const quizRoutes = require("./routes/quizRoutes");
const attendanceRoutes = require("./routes/attendanceRoutes");
const reportRoutes = require("./routes/reportRoutes");
const leaveRoutes = require("./routes/leaveRoutes");

const app = express();

// Connect Database
connectDB();

// Middleware
// CORS Configuration
const corsOptions = {
  origin: process.env.NODE_ENV === "production" ? process.env.FRONTEND_URL : (process.env.FRONTEND_URL || "*"),
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  credentials: true,
};
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Trust proxy for rate limiting (Render/Vercel)
app.set("trust proxy", 1);

// Global Rate Limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // Limit each IP to 200 requests per `window` (here, per 15 minutes)
  message: "Too many requests from this IP, please try again after 15 minutes",
  standardHeaders: true, 
  legacyHeaders: false, 
});
app.use("/api/", apiLimiter);

// Ensure upload directories exist
const uploadsDir = path.join(__dirname, "uploads");
const certificatesDir = path.join(uploadsDir, "certificates");
const profilePicsDir = path.join(uploadsDir, "profile-pics");
const notesDir = path.join(uploadsDir, "notes");

[uploadsDir, certificatesDir, profilePicsDir, notesDir].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Serve uploaded files statically (from root uploads, certificates, and profile-pics subdirectories)
app.use("/uploads", express.static(uploadsDir));
app.use("/uploads", express.static(certificatesDir));
app.use("/uploads", express.static(profilePicsDir));
app.use("/uploads", express.static(notesDir));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/teachers", teacherRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api/administrator", administratorRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/notes", noteRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/fees", feeRoutes);
app.use("/api/quizzes", quizRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/leaves", leaveRoutes);

// Health Check Route
app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "OK", message: "EduSphere Backend is healthy" });
});

// Test Route
app.get("/", (req, res) => {
  res.send("EduSphere Backend Running...");
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    message: "Something went wrong on the server", 
    error: process.env.NODE_ENV === "production" ? undefined : err.message 
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT} (accessible via 0.0.0.0)`);
});
