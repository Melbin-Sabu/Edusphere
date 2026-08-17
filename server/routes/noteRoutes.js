const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { protect, authorizeRoles } = require("../middleware/authMiddleware");
const {
  uploadNote,
  getTeacherNotes,
  getStudentNotes,
  markNoteViewed,
  getNoteViewStats,
  deleteNote,
} = require("../controllers/noteController");

// Ensure upload directory exists
const uploadDir = path.join(__dirname, "../uploads/notes");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer Storage Config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `note-${uniqueSuffix}${ext}`);
  },
});

// File Filter (Documents & PDFs)
const fileFilter = (req, file, cb) => {
  const allowedTypes = /pdf|doc|docx|ppt|pptx/;
  const extValid = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  
  if (extValid) {
    cb(null, true);
  } else {
    cb(new Error("Only PDF, DOC, DOCX, PPT, and PPTX files are allowed!"));
  }
};

const upload = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB Limit
  fileFilter,
});

// Routes

// POST /api/notes
// Upload a note (Teacher only)
router.post(
  "/",
  protect,
  authorizeRoles("TEACHER"),
  upload.single("file"),
  uploadNote
);

// GET /api/notes/teacher
// Get notes uploaded by the teacher
router.get(
  "/teacher",
  protect,
  authorizeRoles("TEACHER"),
  getTeacherNotes
);

// GET /api/notes/student
// Get notes for the student's assigned batch
router.get(
  "/student",
  protect,
  authorizeRoles("STUDENT"),
  getStudentNotes
);

// POST /api/notes/:noteId/view
// Mark note as viewed (Student only)
router.post(
  "/:noteId/view",
  protect,
  authorizeRoles("STUDENT"),
  markNoteViewed
);

// GET /api/notes/:noteId/views
// Get view stats for a note (Teacher only)
router.get(
  "/:noteId/views",
  protect,
  authorizeRoles("TEACHER"),
  getNoteViewStats
);

// DELETE /api/notes/:noteId
// Delete a note (Teacher only)
router.delete(
  "/:noteId",
  protect,
  authorizeRoles("TEACHER"),
  deleteNote
);

module.exports = router;
