const express = require("express");
const router = express.Router();
const { protect, authorizeRoles } = require("../middleware/authMiddleware");
const multer = require("multer");
const upload = multer({ dest: 'uploads/' });

const {
  createQuiz,
  getTeacherQuizzes,
  getQuizById,
  updateQuiz,
  deleteQuiz,
  publishQuiz,
  addQuestion,
  updateQuestion,
  deleteQuestion,
  getQuizResultsTeacher,
  getStudentQuizzes,
  getStudentQuizDetails,
  startQuiz,
  getAttempt,
  submitQuiz,
  getStudentQuizResult
} = require("../controllers/quizController");

// ==============================
// TEACHER ROUTES
// ==============================

// Apply to all teacher routes
const teacherAuth = [protect, authorizeRoles("TEACHER")];

router.post("/", teacherAuth, upload.single("document"), createQuiz);
router.get("/teacher", teacherAuth, getTeacherQuizzes);
router.get("/:id/teacher", teacherAuth, getQuizById);
router.put("/:id", teacherAuth, updateQuiz);
router.delete("/:id", teacherAuth, deleteQuiz);

router.post("/:id/publish", teacherAuth, publishQuiz);
router.get("/:id/results", teacherAuth, getQuizResultsTeacher);

// Question Management
router.post("/:id/questions", teacherAuth, addQuestion);
router.put("/:id/questions/:questionId", teacherAuth, updateQuestion);
router.delete("/:id/questions/:questionId", teacherAuth, deleteQuestion);


// ==============================
// STUDENT ROUTES
// ==============================

// Apply to all student routes
const studentAuth = [protect, authorizeRoles("STUDENT")];

router.get("/student", studentAuth, getStudentQuizzes);
router.get("/:id/student", studentAuth, getStudentQuizDetails);
router.post("/:id/start", studentAuth, startQuiz);
router.get("/attempt/:attemptId", studentAuth, getAttempt);
router.post("/:id/submit", studentAuth, submitQuiz);
router.get("/:id/result", studentAuth, getStudentQuizResult);

module.exports = router;
