const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const {
  registerStudent,
  getStudents,
  deleteStudent,
} = require("../controllers/studentController");
const { protect, authorizeRoles } = require("../middleware/authMiddleware");

// Ensure uploads folder exists
const uploadDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer Storage Configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname)
    );
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /pdf|jpeg|jpg|png/;
    const extName = allowedTypes.test(
      path.extname(file.originalname).toLowerCase()
    );
    const mimeType = allowedTypes.test(file.mimetype);

    if (extName && mimeType) {
      return cb(null, true);
    } else {
      cb(new Error("Only PDF, JPG, and PNG files are allowed!"));
    }
  },
});

const uploadFields = upload.fields([
  { name: "tenthCertificate", maxCount: 1 },
  { name: "twelfthCertificate", maxCount: 1 },
]);

// Student Registration Route (Administrator only)
router.post(
  "/register",
  protect,
  authorizeRoles("Administrator"),
  uploadFields,
  registerStudent
);

// Get All Students Route (Administrator / Admin / Teacher)
router.get(
  "/",
  protect,
  authorizeRoles("Administrator", "Admin", "Teacher"),
  getStudents
);

// Delete Student Route (Administrator only)
router.delete(
  "/:id",
  protect,
  authorizeRoles("Administrator"),
  deleteStudent
);

module.exports = router;
