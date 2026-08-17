const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const {
  submitApplication,
  getApplicationById,
  processPayment,
} = require("../controllers/applicationController");

// Ensure upload directory exists for certificates
const certificatesDir = path.join(__dirname, "../uploads/certificates");
if (!fs.existsSync(certificatesDir)) {
  fs.mkdirSync(certificatesDir, { recursive: true });
}

// Multer Storage Configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, certificatesDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  },
});

// File Filter (PDF, JPG, JPEG, PNG, max 5 MB)
const fileFilter = (req, file, cb) => {
  const allowedExts = /pdf|jpg|jpeg|png/;
  const extValid = allowedExts.test(path.extname(file.originalname).toLowerCase());
  const mimeValid = /pdf|jpeg|jpg|png/.test(file.mimetype);

  if (extValid || mimeValid) {
    cb(null, true);
  } else {
    cb(new Error("Only PDF, JPG, JPEG, and PNG files under 5MB are allowed!"));
  }
};

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB Limit
  fileFilter,
});

// Multer middleware for certificate uploads
const uploadCertificates = upload.fields([
  { name: "tenthCertificate", maxCount: 1 },
  { name: "twelfthCertificate", maxCount: 1 },
]);

// Public Routes
router.post("/", uploadCertificates, submitApplication);
router.get("/:id", getApplicationById);
router.post("/:id/payment", processPayment);

module.exports = router;
