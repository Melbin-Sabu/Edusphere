const Attendance = require("../models/Attendance");
const Student = require("../models/Student");
const Teacher = require("../models/Teacher");

const markAttendance = async (req, res) => {
  try {
    const { date, batch, records } = req.body;
    
    // Parse date to start of day
    const attendanceDate = new Date(date);
    attendanceDate.setHours(0, 0, 0, 0);

    const teacher = await Teacher.findOne({ user: req.user._id });
    if (!teacher) {
      return res.status(403).json({ message: "Teacher not found" });
    }

    // Check if attendance already exists for this date and batch
    let attendance = await Attendance.findOne({ date: attendanceDate, batch });

    if (attendance) {
      // Update existing
      attendance.teacherId = teacher._id;
      attendance.records = records;
      await attendance.save();
      return res.json({ message: "Attendance updated successfully", attendance });
    } else {
      // Create new
      attendance = new Attendance({
        date: attendanceDate,
        batch,
        teacherId: teacher._id,
        records
      });
      await attendance.save();
      return res.status(201).json({ message: "Attendance marked successfully", attendance });
    }
  } catch (error) {
    res.status(500).json({ message: "Error marking attendance", error: error.message });
  }
};

const getAttendanceByBatchDate = async (req, res) => {
  try {
    const { batch, date } = req.params;
    const attendanceDate = new Date(date);
    attendanceDate.setHours(0, 0, 0, 0);

    // Fetch all active students in the batch with flexible matching
    const allStudents = await Student.find({ status: "Active" }).sort({ fullName: 1 });
    const students = allStudents.filter(s => {
      const sCourse = (s.course || "").toUpperCase();
      const sBatch = (s.batch || "").toLowerCase();
      const bName = batch.toLowerCase();
      
      return s.batch === batch || 
             (bName.toUpperCase().includes(sCourse) && bName.includes(sBatch));
    });
    
    // Fetch attendance record
    const attendance = await Attendance.findOne({ date: attendanceDate, batch });

    // Merge student list with existing attendance records
    const results = students.map(student => {
      const record = attendance?.records.find(r => r.studentId.toString() === student._id.toString());
      return {
        studentId: student._id,
        fullName: student.fullName,
        admissionNumber: student.admissionNumber,
        status: record ? record.status : "Present" // Default to Present if not marked yet
      };
    });

    res.json({
      hasRecord: !!attendance,
      records: results
    });
  } catch (error) {
    res.status(500).json({ message: "Error fetching attendance", error: error.message });
  }
};

const getStudentAttendance = async (req, res) => {
  try {
    const student = await Student.findOne({ user: req.user._id });
    if (!student) {
      return res.status(403).json({ message: "Student not found" });
    }

    // Find all attendance records for this student's batch
    const attendances = await Attendance.find({ batch: student.batch }).sort({ date: -1 });

    const studentRecords = attendances.map(a => {
      const record = a.records.find(r => r.studentId.toString() === student._id.toString());
      return {
        date: a.date,
        status: record ? record.status : "Unknown"
      };
    }).filter(r => r.status !== "Unknown");

    res.json(studentRecords);
  } catch (error) {
    res.status(500).json({ message: "Error fetching student attendance", error: error.message });
  }
};

module.exports = {
  markAttendance,
  getAttendanceByBatchDate,
  getStudentAttendance
};
