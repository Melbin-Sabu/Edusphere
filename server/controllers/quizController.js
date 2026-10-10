const Quiz = require("../models/Quiz");
const Question = require("../models/Question");
const QuizAttempt = require("../models/QuizAttempt");
const Teacher = require("../models/Teacher");
const Student = require("../models/Student");
const fs = require("fs");
const pdfParse = require("pdf-parse");
const mammoth = require("mammoth");
const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });


// =======================
// TEACHER CONTROLLERS
// =======================

const createQuiz = async (req, res) => {
  try {
    const {
      title,
      description,
      course,
      batch,
      subject,
      durationMinutes,
      negativeMarkingEnabled,
      defaultPositiveMark,
      defaultNegativeMark,
      startDate,
      startTime,
      endDate,
      endTime,
      attemptLimit,
    } = req.body;

    // Verify teacher assignment
    const teacher = await Teacher.findOne({ user: req.user._id });
    if (!teacher) {
      return res.status(403).json({ message: "Only assigned teachers can create quizzes." });
    }

    // Verify batch
    const allTeacherBatches = [...(teacher.assignedBatches || []), ...(teacher.subjectBatches || [])];
    if (!allTeacherBatches.includes(batch)) {
      return res.status(403).json({ message: "You are not assigned to this batch." });
    }

    // Verify subject (either primary subject or in subjectBatches array)
    const isPrimarySubject = teacher.subject === subject;
    const isSubjectBatch = teacher.subjectBatches && teacher.subjectBatches.includes(subject);

    if (!isPrimarySubject && !isSubjectBatch) {
      return res.status(403).json({ message: "You are not assigned to this subject." });
    }

    const quiz = new Quiz({
      title,
      description,
      course,
      batch,
      subject,
      teacherId: teacher._id,
      durationMinutes,
      negativeMarkingEnabled,
      defaultPositiveMark,
      defaultNegativeMark,
      startDate,
      startTime,
      endDate,
      endTime,
      attemptLimit,
      createdBy: req.user._id,
      status: "DRAFT"
    });

    await quiz.save();

    // Generate questions if document uploaded
    if (req.file) {
      let textContent = "";
      const filePath = req.file.path;
      const mimeType = req.file.mimetype;
      const { docQuestionCount } = req.body;
      const numQuestions = parseInt(docQuestionCount) || 5;

      try {
        if (mimeType === "application/pdf") {
          const dataBuffer = fs.readFileSync(filePath);
          const pdfData = await pdfParse(dataBuffer);
          textContent = pdfData.text;
        } else if (
          mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" || 
          mimeType === "application/msword"
        ) {
          const result = await mammoth.extractRawText({ path: filePath });
          textContent = result.value;
        } else if (mimeType === "text/plain") {
          textContent = fs.readFileSync(filePath, "utf-8");
        }
      } catch (err) {
        console.error("Extraction error", err);
      } finally {
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      }

      if (textContent && textContent.trim() !== "") {
        const truncatedText = textContent.slice(0, 20000);
        const prompt = `Generate exactly ${numQuestions} multiple-choice questions based on the following text. 
        Respond ONLY with a JSON array where each object has:
        - "questionText" (string)
        - "options" (array of exactly 4 strings)
        - "correctAnswer" (string, must exactly match one of the options)
        
        Text:
        ${truncatedText}`;

        try {
          const response = await ai.models.generateContent({
            model: "gemini-3.8-flash",
            contents: prompt,
            config: { responseMimeType: "application/json" },
          });

          let generatedData = response.text.replace(/```json/g, "").replace(/```/g, "").trim();
          const newQuestions = JSON.parse(generatedData);
          
          let currentOrder = 1;
          for (let q of newQuestions) {
            if (q.options && q.options.length === 4 && q.options.includes(q.correctAnswer)) {
              const question = new Question({
                quizId: quiz._id,
                questionText: q.questionText,
                options: q.options,
                correctAnswer: q.correctAnswer,
                positiveMark: quiz.defaultPositiveMark || 4,
                negativeMark: quiz.negativeMarkingEnabled ? (quiz.defaultNegativeMark || 1) : 0,
                order: currentOrder++
              });
              await question.save();
            }
          }
        } catch (aiErr) {
          console.error("AI Generation failed:", aiErr);
        }
      }
    }

    res.status(201).json(quiz);
  } catch (error) {
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    res.status(500).json({ message: "Error creating quiz", error: error.message });
  }
};

const getTeacherQuizzes = async (req, res) => {
  try {
    const teacher = await Teacher.findOne({ user: req.user._id });
    if (!teacher) return res.status(403).json({ message: "Not authorized" });

    const quizzes = await Quiz.find({ teacherId: teacher._id }).sort({ createdAt: -1 });
    res.json(quizzes);
  } catch (error) {
    res.status(500).json({ message: "Error fetching quizzes", error: error.message });
  }
};

const getQuizById = async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) return res.status(404).json({ message: "Quiz not found" });

    const teacher = await Teacher.findOne({ user: req.user._id });
    if (quiz.teacherId.toString() !== teacher._id.toString()) {
      return res.status(403).json({ message: "Not authorized to view this quiz" });
    }

    const questions = await Question.find({ quizId: quiz._id }).sort({ order: 1 });
    res.json({ quiz, questions });
  } catch (error) {
    res.status(500).json({ message: "Error fetching quiz", error: error.message });
  }
};

const updateQuiz = async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) return res.status(404).json({ message: "Quiz not found" });

    const teacher = await Teacher.findOne({ user: req.user._id });
    if (quiz.teacherId.toString() !== teacher._id.toString()) {
      return res.status(403).json({ message: "Not authorized to edit this quiz" });
    }

    if (quiz.status !== "DRAFT") {
      return res.status(400).json({ message: "Cannot edit a quiz after it has been published" });
    }

    // if batch or subject changed, verify again
    if (req.body.batch && req.body.batch !== quiz.batch) {
      const allTeacherBatches = [...(teacher.assignedBatches || []), ...(teacher.subjectBatches || [])];
      if (!allTeacherBatches.includes(req.body.batch)) {
        return res.status(403).json({ message: "You are not assigned to this batch." });
      }
    }
    if (req.body.subject && req.body.subject !== quiz.subject) {
      const isPrimarySubject = teacher.subject === req.body.subject;
      const isSubjectBatch = teacher.subjectBatches && teacher.subjectBatches.includes(req.body.subject);
      if (!isPrimarySubject && !isSubjectBatch) {
        return res.status(403).json({ message: "You are not assigned to this subject." });
      }
    }

    Object.assign(quiz, req.body);
    await quiz.save();
    res.json(quiz);
  } catch (error) {
    res.status(500).json({ message: "Error updating quiz", error: error.message });
  }
};

const deleteQuiz = async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) return res.status(404).json({ message: "Quiz not found" });

    const teacher = await Teacher.findOne({ user: req.user._id });
    if (quiz.teacherId.toString() !== teacher._id.toString()) {
      return res.status(403).json({ message: "Not authorized to delete this quiz" });
    }

    if (quiz.status !== "DRAFT") {
      return res.status(400).json({ message: "Cannot delete a quiz after it has been published" });
    }

    await Question.deleteMany({ quizId: quiz._id });
    await Quiz.findByIdAndDelete(req.params.id);
    res.json({ message: "Quiz deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting quiz", error: error.message });
  }
};

const publishQuiz = async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) return res.status(404).json({ message: "Quiz not found" });

    const teacher = await Teacher.findOne({ user: req.user._id });
    if (quiz.teacherId.toString() !== teacher._id.toString()) {
      return res.status(403).json({ message: "Not authorized to publish this quiz" });
    }

    const questionCount = await Question.countDocuments({ quizId: quiz._id });
    if (questionCount === 0) {
      return res.status(400).json({ message: "Cannot publish a quiz with no questions." });
    }

    quiz.status = "PUBLISHED";
    quiz.totalQuestions = questionCount;
    // Calculate total marks
    const questions = await Question.find({ quizId: quiz._id });
    quiz.totalMarks = questions.reduce((sum, q) => sum + q.positiveMark, 0);

    await quiz.save();
    res.json(quiz);
  } catch (error) {
    res.status(500).json({ message: "Error publishing quiz", error: error.message });
  }
};

const addQuestion = async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) return res.status(404).json({ message: "Quiz not found" });

    const teacher = await Teacher.findOne({ user: req.user._id });
    if (quiz.teacherId.toString() !== teacher._id.toString()) {
      return res.status(403).json({ message: "Not authorized to modify this quiz" });
    }

    if (quiz.status !== "DRAFT") {
      return res.status(400).json({ message: "Cannot modify questions after publishing" });
    }

    const { questionText, options, correctAnswer, positiveMark, negativeMark, explanation, order } = req.body;

    if (!options || options.length < 2) {
      return res.status(400).json({ message: "At least 2 options are required." });
    }
    if (!options.includes(correctAnswer)) {
      return res.status(400).json({ message: "Correct answer must match one of the options." });
    }

    const question = new Question({
      quizId: quiz._id,
      questionText,
      options,
      correctAnswer,
      positiveMark: positiveMark || quiz.defaultPositiveMark,
      negativeMark: negativeMark !== undefined ? negativeMark : (quiz.negativeMarkingEnabled ? quiz.defaultNegativeMark : 0),
      explanation,
      order: order || 1
    });

    await question.save();
    res.status(201).json(question);
  } catch (error) {
    res.status(500).json({ message: "Error adding question", error: error.message });
  }
};

const updateQuestion = async (req, res) => {
  try {
    const { id, questionId } = req.params;

    const quiz = await Quiz.findById(id);
    if (!quiz) return res.status(404).json({ message: "Quiz not found" });

    const teacher = await Teacher.findOne({ user: req.user._id });
    if (quiz.teacherId.toString() !== teacher._id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    if (quiz.status !== "DRAFT") {
      return res.status(400).json({ message: "Cannot modify questions after publishing" });
    }

    const question = await Question.findById(questionId);
    if (!question || question.quizId.toString() !== id) {
      return res.status(404).json({ message: "Question not found" });
    }

    if (req.body.options && req.body.correctAnswer) {
      if (!req.body.options.includes(req.body.correctAnswer)) {
        return res.status(400).json({ message: "Correct answer must match one of the options." });
      }
    }

    Object.assign(question, req.body);
    await question.save();
    res.json(question);
  } catch (error) {
    res.status(500).json({ message: "Error updating question", error: error.message });
  }
};

const deleteQuestion = async (req, res) => {
  try {
    const { id, questionId } = req.params;

    const quiz = await Quiz.findById(id);
    if (!quiz) return res.status(404).json({ message: "Quiz not found" });

    const teacher = await Teacher.findOne({ user: req.user._id });
    if (quiz.teacherId.toString() !== teacher._id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    if (quiz.status !== "DRAFT") {
      return res.status(400).json({ message: "Cannot modify questions after publishing" });
    }

    await Question.findOneAndDelete({ _id: questionId, quizId: id });
    res.json({ message: "Question deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting question", error: error.message });
  }
};

const getQuizResultsTeacher = async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) return res.status(404).json({ message: "Quiz not found" });

    const teacher = await Teacher.findOne({ user: req.user._id });
    if (quiz.teacherId.toString() !== teacher._id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const allStudents = await Student.find({ status: "Active" }).sort({ fullName: 1 });
    const students = allStudents.filter(s => {
      const sCourse = (s.course || "").toUpperCase();
      const sBatch = (s.batch || "").toLowerCase();
      const bName = quiz.batch.toLowerCase();
      
      return s.batch === quiz.batch || 
             (bName.toUpperCase().includes(sCourse) && bName.includes(sBatch));
    });
    const attempts = await QuizAttempt.find({ quizId: quiz._id });

    const results = students.map(student => {
      const attempt = attempts.find(a => a.studentId.toString() === student._id.toString());
      if (attempt) {
        return {
          ...attempt.toObject(),
          studentId: {
            _id: student._id,
            fullName: student.fullName,
            admissionNumber: student.admissionNumber
          }
        };
      } else {
        return {
          _id: student._id,
          studentId: {
            _id: student._id,
            fullName: student.fullName,
            admissionNumber: student.admissionNumber
          },
          totalScore: "-",
          percentage: 0,
          correctCount: "-",
          wrongCount: "-",
          status: "NOT_STARTED",
          submittedAt: null
        };
      }
    });

    res.json(results);
  } catch (error) {
    res.status(500).json({ message: "Error fetching results", error: error.message });
  }
};


// =======================
// STUDENT CONTROLLERS
// =======================

const getStudentQuizzes = async (req, res) => {
  try {
    const student = await Student.findOne({ user: req.user._id });
    if (!student) return res.status(403).json({ message: "Student not found" });

    // Return quizzes for this student's batch
    const quizzes = await Quiz.find({
      batch: student.batch,
      status: { $in: ["PUBLISHED", "ACTIVE"] }
    }).populate("teacherId", "fullName").sort({ startDate: 1 });

    // Fetch attempt status for each quiz
    const quizList = [];
    for (let quiz of quizzes) {
      const attemptCount = await QuizAttempt.countDocuments({ quizId: quiz._id, studentId: student._id });
      const activeAttempt = await QuizAttempt.findOne({ quizId: quiz._id, studentId: student._id, status: "IN_PROGRESS" });

      quizList.push({
        ...quiz.toObject(),
        attemptCount,
        hasActiveAttempt: !!activeAttempt,
        activeAttemptId: activeAttempt ? activeAttempt._id : null
      });
    }

    res.json(quizList);
  } catch (error) {
    res.status(500).json({ message: "Error fetching student quizzes", error: error.message });
  }
};

const getStudentQuizDetails = async (req, res) => {
  try {
    const student = await Student.findOne({ user: req.user._id });
    if (!student) return res.status(403).json({ message: "Student not found" });

    const quiz = await Quiz.findById(req.params.id).populate("teacherId", "fullName");
    if (!quiz) return res.status(404).json({ message: "Quiz not found" });

    if (quiz.batch !== student.batch) {
      return res.status(403).json({ message: "This quiz is not assigned to your batch." });
    }

    if (!["PUBLISHED", "ACTIVE"].includes(quiz.status)) {
      return res.status(403).json({ message: "This quiz is not currently active." });
    }

    res.json(quiz); // Questions not returned here, only on start
  } catch (error) {
    res.status(500).json({ message: "Error fetching quiz details", error: error.message });
  }
}

const startQuiz = async (req, res) => {
  try {
    const student = await Student.findOne({ user: req.user._id });
    if (!student) return res.status(403).json({ message: "Student not found" });

    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) return res.status(404).json({ message: "Quiz not found" });

    // Validate batch
    if (quiz.batch !== student.batch) {
      return res.status(403).json({ message: "This quiz is not assigned to your batch." });
    }

    if (!["PUBLISHED", "ACTIVE"].includes(quiz.status)) {
      return res.status(403).json({ message: "Quiz is not available." });
    }

    // Validate availability window
    const now = new Date();
    const quizStart = new Date(`${quiz.startDate.toISOString().split('T')[0]}T${quiz.startTime}:00.000Z`); // simple parse, adjust if timezone needed
    // The previous implementation is naive. It's better to store dates properly, but assuming they are stored as UTC or local properly...
    // Let's do a simple check:
    const quizStartMs = new Date(quiz.startDate).setHours(parseInt(quiz.startTime.split(':')[0]), parseInt(quiz.startTime.split(':')[1]), 0);
    const quizEndMs = new Date(quiz.endDate).setHours(parseInt(quiz.endTime.split(':')[0]), parseInt(quiz.endTime.split(':')[1]), 0);

    if (now.getTime() < quizStartMs || now.getTime() > quizEndMs) {
      return res.status(403).json({ message: "Quiz is outside of its availability window." });
    }

    // Check attempt limits
    const attemptCount = await QuizAttempt.countDocuments({ quizId: quiz._id, studentId: student._id, status: { $in: ["SUBMITTED", "AUTO_SUBMITTED", "EXPIRED"] } });
    if (attemptCount >= quiz.attemptLimit) {
      return res.status(403).json({ message: "Maximum attempt limit reached." });
    }

    // Check for active attempt
    let activeAttempt = await QuizAttempt.findOne({ quizId: quiz._id, studentId: student._id, status: "IN_PROGRESS" });

    if (!activeAttempt) {
      // Calculate expiresAt
      let expiresAtMs = now.getTime() + quiz.durationMinutes * 60000;
      // Truncate to availability window end if it exceeds it
      if (expiresAtMs > quizEndMs) {
        expiresAtMs = quizEndMs;
      }

      activeAttempt = new QuizAttempt({
        quizId: quiz._id,
        studentId: student._id,
        startedAt: now,
        expiresAt: new Date(expiresAtMs),
        status: "IN_PROGRESS"
      });
      await activeAttempt.save();
    }

    // Return questions WITHOUT correct answers
    const questions = await Question.find({ quizId: quiz._id }).select("-correctAnswer").sort({ order: 1 });

    res.json({
      attemptId: activeAttempt._id,
      quizId: quiz._id,
      startedAt: activeAttempt.startedAt,
      expiresAt: activeAttempt.expiresAt,
      durationMinutes: quiz.durationMinutes,
      questions
    });

  } catch (error) {
    res.status(500).json({ message: "Error starting quiz", error: error.message });
  }
};

const getAttempt = async (req, res) => {
  try {
    const student = await Student.findOne({ user: req.user._id });
    if (!student) return res.status(403).json({ message: "Student not found" });

    const attempt = await QuizAttempt.findById(req.params.attemptId);
    if (!attempt || attempt.studentId.toString() !== student._id.toString()) {
      return res.status(404).json({ message: "Attempt not found" });
    }

    // Return questions WITHOUT correct answers
    const questions = await Question.find({ quizId: attempt.quizId }).select("-correctAnswer").sort({ order: 1 });

    res.json({
      attemptId: attempt._id,
      quizId: attempt.quizId,
      startedAt: attempt.startedAt,
      expiresAt: attempt.expiresAt,
      answers: attempt.answers,
      status: attempt.status,
      questions
    });
  } catch (error) {
    res.status(500).json({ message: "Error fetching attempt", error: error.message });
  }
};


const submitQuiz = async (req, res) => {
  try {
    const { attemptId, answers } = req.body;

    const student = await Student.findOne({ user: req.user._id });
    if (!student) return res.status(403).json({ message: "Student not found" });

    const attempt = await QuizAttempt.findById(attemptId);
    if (!attempt || attempt.studentId.toString() !== student._id.toString()) {
      return res.status(404).json({ message: "Attempt not found" });
    }

    if (attempt.status !== "IN_PROGRESS") {
      return res.status(400).json({ message: "Attempt already submitted" });
    }

    const quiz = await Quiz.findById(attempt.quizId);
    const questions = await Question.find({ quizId: quiz._id });

    // Validate time
    const now = new Date();
    // Allow a small grace period for network latency (e.g., 30 seconds)
    const gracePeriod = 30000;
    const isLate = now.getTime() > (attempt.expiresAt.getTime() + gracePeriod);

    let correctCount = 0;
    let wrongCount = 0;
    let unansweredCount = 0;
    let totalScore = 0;
    let totalMaxScore = quiz.totalMarks;

    const answerRecord = [];

    // Evaluate answers
    for (let q of questions) {
      const submittedAns = answers.find(a => a.questionId === q._id.toString());

      let finalAnsStr = submittedAns && submittedAns.answer ? submittedAns.answer : null;

      answerRecord.push({
        questionId: q._id,
        answer: finalAnsStr
      });

      if (!finalAnsStr) {
        unansweredCount++;
      } else if (finalAnsStr === q.correctAnswer) {
        correctCount++;
        totalScore += q.positiveMark;
      } else {
        wrongCount++;
        if (quiz.negativeMarkingEnabled) {
          totalScore -= q.negativeMark;
        }
      }
    }

    attempt.answers = answerRecord;
    attempt.correctCount = correctCount;
    attempt.wrongCount = wrongCount;
    attempt.unansweredCount = unansweredCount;
    attempt.totalScore = totalScore;
    attempt.percentage = totalMaxScore > 0 ? (totalScore / totalMaxScore) * 100 : 0;
    attempt.submittedAt = now;
    attempt.status = isLate ? "AUTO_SUBMITTED" : "SUBMITTED";

    await attempt.save();

    res.json({ message: "Quiz submitted successfully", attempt });
  } catch (error) {
    res.status(500).json({ message: "Error submitting quiz", error: error.message });
  }
};

const getStudentQuizResult = async (req, res) => {
  try {
    const student = await Student.findOne({ user: req.user._id });
    if (!student) return res.status(403).json({ message: "Student not found" });

    const attempt = await QuizAttempt.findOne({ quizId: req.params.id, studentId: student._id, status: { $in: ["SUBMITTED", "AUTO_SUBMITTED", "EXPIRED"] } }).sort({ submittedAt: -1 });
    if (!attempt) return res.status(404).json({ message: "Result not found" });

    // Student can see correct answers after submission if needed, so we fetch questions
    const questions = await Question.find({ quizId: attempt.quizId }).sort({ order: 1 });

    res.json({ attempt, questions });
  } catch (error) {
    res.status(500).json({ message: "Error fetching result", error: error.message });
  }
};


module.exports = {
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
};
