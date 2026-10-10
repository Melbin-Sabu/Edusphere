const path = require("path");
const fs = require("fs");
const { createClient } = require("@supabase/supabase-js");
const Note = require("../models/Note");
const NoteView = require("../models/NoteView");
const Teacher = require("../models/Teacher");
const Student = require("../models/Student");

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;
const BUCKET_NAME = "edusphere-materials";

// Helper to get playable/downloadable URL
const resolveFileUrl = async (fileUrl) => {
  if (fileUrl.startsWith("/uploads/")) {
    return fileUrl; // Legacy local file
  }
  if (supabase) {
    const { data, error } = await supabase.storage.from(BUCKET_NAME).createSignedUrl(fileUrl, 3600);
    if (!error && data) {
      return data.signedUrl;
    }
  }
  return fileUrl;
};

// =======================
// Upload Note (Teacher)
// =======================
const uploadNote = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file provided" });
    }

    const { title, description } = req.body;

    if (!title) {
      return res.status(400).json({ message: "Title is required" });
    }

    const teacher = await Teacher.findOne({ user: req.user._id }) || await Teacher.findOne({ user_id: req.user._id });
    if (!teacher) {
      return res.status(404).json({ message: "Teacher profile not found" });
    }

    const hasSubject = teacher.subjectBatches && teacher.subjectBatches.length > 0;

    if (!hasSubject) {
      return res.status(403).json({ message: "Only Subject Teachers can upload notes." });
    }

    const defaultBatch = teacher.subjectBatches[0];
    const batchId = req.body.batchId || defaultBatch;

    const isSubjectTeacher = teacher.subjectBatches && teacher.subjectBatches.includes(batchId);

    if (!isSubjectTeacher) {
      return res.status(403).json({ message: "You can only upload notes to batches where you are assigned as a Subject Teacher." });
    }

    const subjectId = req.body.subjectId || teacher.subject || "General";

    let fileRef = "";
    if (supabase) {
      const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      const ext = path.extname(req.file.originalname);
      const filePath = `notes/note-${uniqueSuffix}${ext}`;

      const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(filePath, req.file.buffer, {
          contentType: req.file.mimetype,
          upsert: false
        });

      if (error) {
        throw new Error("Failed to upload to cloud storage: " + error.message);
      }
      fileRef = filePath; // Store Supabase path
    } else {
      return res.status(500).json({ message: "Supabase cloud storage is not configured." });
    }

    const note = new Note({
      title,
      description: description || "",
      batchId,
      subjectId,
      teacherId: teacher._id,
      fileName: req.file.originalname,
      fileUrl: fileRef,
      fileType: req.file.mimetype,
      fileSize: req.file.size,
    });

    await note.save();

    res.status(201).json({
      message: "Note uploaded successfully",
      note,
    });
  } catch (error) {
    console.error("Error uploading note:", error);
    res.status(500).json({ message: error.message || "Failed to upload note" });
  }
};

// =======================
// Get Teacher Notes
// =======================
const getTeacherNotes = async (req, res) => {
  try {
    const teacher = await Teacher.findOne({ user: req.user._id }) || await Teacher.findOne({ user_id: req.user._id });
    if (!teacher) {
      return res.status(404).json({ message: "Teacher profile not found" });
    }

    const notes = await Note.find({ teacherId: teacher._id }).sort({ createdAt: -1 });

    // Get view counts for each note
    const notesWithStats = await Promise.all(notes.map(async (note) => {
      const views = await NoteView.countDocuments({ noteId: note._id });

      // Calculate course/batch parts since note.batchId is like "JEE Evening Batch"
      // but student model has course="JEE", batch="Evening Batch"
      let coursePart = "";
      let batchPart = note.batchId;

      if (note.batchId.startsWith("JEE ")) {
        coursePart = "JEE";
        batchPart = note.batchId.substring(4);
      } else if (note.batchId.startsWith("NEET ")) {
        coursePart = "NEET";
        batchPart = note.batchId.substring(5);
      }

      const totalStudents = await Student.countDocuments({
        $or: [
          { batch: note.batchId },
          ...(coursePart ? [{ course: coursePart, batch: batchPart }] : [])
        ]
      });

      const resolvedUrl = await resolveFileUrl(note.fileUrl);

      return {
        ...note.toObject(),
        fileUrl: resolvedUrl, // Use resolved signed URL
        viewCount: views,
        totalStudents,
      };
    }));

    res.status(200).json({ notes: notesWithStats });
  } catch (error) {
    res.status(500).json({ message: error.message || "Failed to fetch notes" });
  }
};

// =======================
// Get Student Notes
// =======================
const getStudentNotes = async (req, res) => {
  try {
    const student = await Student.findOne({ user: req.user._id });
    if (!student) {
      return res.status(404).json({ message: "Student profile not found" });
    }

    if (!student.batch) {
      return res.status(200).json({ notes: [] });
    }

    const fullBatchName = student.batch.includes(student.course)
      ? student.batch
      : `${student.course} ${student.batch}`;

    // Get all active notes for this student's batch
    const notes = await Note.find({
      batchId: { $in: [student.batch, fullBatchName] },
      status: "Active"
    })
      .populate("teacherId", "fullName profilePic")
      .sort({ createdAt: -1 });

    // Check which ones are viewed
    const viewedNotes = await NoteView.find({ studentId: student._id });
    const viewedNoteIds = viewedNotes.map(v => v.noteId.toString());

    const notesWithViewStatus = await Promise.all(notes.map(async (note) => {
      const resolvedUrl = await resolveFileUrl(note.fileUrl);
      return {
        ...note.toObject(),
        fileUrl: resolvedUrl, // Use resolved signed URL
        isViewed: viewedNoteIds.includes(note._id.toString())
      };
    }));

    res.status(200).json({ notes: notesWithViewStatus });
  } catch (error) {
    res.status(500).json({ message: error.message || "Failed to fetch student notes" });
  }
};

// =======================
// Mark Note Viewed (Student)
// =======================
const markNoteViewed = async (req, res) => {
  try {
    const { noteId } = req.params;

    const student = await Student.findOne({ user: req.user._id });
    if (!student) {
      return res.status(404).json({ message: "Student profile not found" });
    }

    const note = await Note.findById(noteId);
    if (!note) {
      return res.status(404).json({ message: "Note not found" });
    }

    const fullBatchName = student.batch.includes(student.course)
      ? student.batch
      : `${student.course} ${student.batch}`;

    // Security: ensure student is in the same batch as the note
    if (note.batchId !== student.batch && note.batchId !== fullBatchName) {
      return res.status(403).json({ message: "You don't have access to this note" });
    }

    // Check if view already exists
    let noteView = await NoteView.findOne({ noteId, studentId: student._id });

    if (noteView) {
      // Update last viewed
      noteView.lastViewedAt = Date.now();
      noteView.viewCount += 1;
      await noteView.save();
    } else {
      // Create new view
      noteView = new NoteView({
        noteId,
        studentId: student._id,
        batchId: note.batchId,
      });
      await noteView.save();
    }

    res.status(200).json({ message: "Note marked as viewed", view: noteView });
  } catch (error) {
    res.status(500).json({ message: error.message || "Failed to mark note as viewed" });
  }
};

// =======================
// Get Note View Stats (Teacher)
// =======================
const getNoteViewStats = async (req, res) => {
  try {
    const { noteId } = req.params;

    const teacher = await Teacher.findOne({ user: req.user._id });
    if (!teacher) {
      return res.status(404).json({ message: "Teacher profile not found" });
    }

    const note = await Note.findById(noteId);
    if (!note) {
      return res.status(404).json({ message: "Note not found" });
    }

    // Security: Only the teacher who uploaded the note (or an admin) can view stats
    // But requirement says teacher uploaded it. Let's just check if it's in their assigned batch
    const isClassTeacher = teacher.assignedBatches && teacher.assignedBatches.includes(note.batchId);
    const isSubjectTeacher = teacher.subjectBatches && teacher.subjectBatches.includes(note.batchId);

    if (!isClassTeacher && !isSubjectTeacher && note.teacherId.toString() !== teacher._id.toString()) {
      return res.status(403).json({ message: "You don't have access to this note's stats" });
    }

    // Get all students in this batch
    const allStudents = await Student.find({ batch: note.batchId }).select("fullName email admissionNumber profilePic");

    // Get all views for this note
    const views = await NoteView.find({ noteId }).select("studentId firstViewedAt lastViewedAt viewCount");

    const viewedStudentIds = views.map(v => v.studentId.toString());

    // Map students into viewed and not viewed
    const studentStats = allStudents.map(student => {
      const viewRecord = views.find(v => v.studentId.toString() === student._id.toString());

      return {
        _id: student._id,
        fullName: student.fullName,
        email: student.email,
        admissionNumber: student.admissionNumber,
        profilePic: student.profilePic,
        hasViewed: !!viewRecord,
        firstViewedAt: viewRecord ? viewRecord.firstViewedAt : null,
        lastViewedAt: viewRecord ? viewRecord.lastViewedAt : null,
        viewCount: viewRecord ? viewRecord.viewCount : 0
      };
    });

    res.status(200).json({
      note: {
        title: note.title,
        batchId: note.batchId,
        subjectId: note.subjectId
      },
      stats: studentStats
    });
  } catch (error) {
    res.status(500).json({ message: error.message || "Failed to fetch stats" });
  }
};

// =======================
// Delete Note
// =======================
const deleteNote = async (req, res) => {
  try {
    const { noteId } = req.params;

    const teacher = await Teacher.findOne({ user: req.user._id });
    if (!teacher) {
      return res.status(404).json({ message: "Teacher profile not found" });
    }

    const note = await Note.findById(noteId);
    if (!note) {
      return res.status(404).json({ message: "Note not found" });
    }

    if (note.teacherId.toString() !== teacher._id.toString()) {
      return res.status(403).json({ message: "You can only delete your own notes" });
    }

    // Delete file
    if (note.fileUrl) {
      if (note.fileUrl.startsWith("/uploads/")) {
        const filePath = path.join(__dirname, "..", note.fileUrl);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      } else if (supabase) {
        // Delete from Supabase
        await supabase.storage.from(BUCKET_NAME).remove([note.fileUrl]);
      }
    }

    // Delete views
    await NoteView.deleteMany({ noteId: note._id });

    // Delete note
    await Note.findByIdAndDelete(note._id);

    res.status(200).json({ message: "Note deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message || "Failed to delete note" });
  }
};

module.exports = {
  uploadNote,
  getTeacherNotes,
  getStudentNotes,
  markNoteViewed,
  getNoteViewStats,
  deleteNote
};
