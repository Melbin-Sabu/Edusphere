const Timetable = require("../models/Timetable");

const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const getSlotsForBatch = (batchType) => {
  if (batchType === "Morning") {
    return [
      "08:00 AM - 09:00 AM",
      "09:00 AM - 10:00 AM",
      "10:15 AM - 11:15 AM",
      "11:15 AM - 12:15 PM",
    ];
  }
  return [
    "04:00 PM - 05:00 PM",
    "05:00 PM - 06:00 PM",
    "06:15 PM - 07:15 PM",
    "07:15 PM - 08:15 PM",
  ];
};

// Generate standard default timetable schedule
const generateStandardSchedule = (course, batch, additionalSubjects = "") => {
  const schedule = {};
  const slots = getSlotsForBatch(batch);

  const neetSubjects = ["Physics", "Chemistry", "Botany", "Zoology"];
  const jeeSubjects = ["Physics", "Chemistry", "Mathematics"];

  const extraSubjects = (additionalSubjects || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const allSubjects =
    course === "NEET"
      ? [...neetSubjects, ...extraSubjects]
      : [...jeeSubjects, ...extraSubjects];

  let subjectIndex = 0;

  days.forEach((day) => {
    schedule[day] = [];

    for (let i = 0; i < 4; i++) {
      // Tuesday and Thursday Mock Tests in Periods 3 & 4
      if ((day === "Tuesday" || day === "Thursday") && (i === 2 || i === 3)) {
        schedule[day].push({
          subject: "Mock Test",
          type: "Test",
          color: "bg-rose-100 text-rose-700 border-rose-200",
        });
        continue;
      }

      // Regular Classes
      const subject = allSubjects[subjectIndex % allSubjects.length];
      subjectIndex++;

      let color = "bg-slate-100 text-slate-700 border-slate-200";
      if (subject === "Physics") color = "bg-blue-100 text-blue-700 border-blue-200";
      else if (subject === "Chemistry") color = "bg-emerald-100 text-emerald-700 border-emerald-200";
      else if (subject === "Botany") color = "bg-teal-100 text-teal-700 border-teal-200";
      else if (subject === "Zoology") color = "bg-amber-100 text-amber-700 border-amber-200";
      else if (subject === "Mathematics") color = "bg-orange-100 text-orange-700 border-orange-200";
      else color = "bg-indigo-100 text-indigo-700 border-indigo-200";

      schedule[day].push({
        subject,
        type: "Class",
        color,
      });
    }
  });

  return { slots, schedule };
};

// =======================
// Save or Update Timetable (Admin / Administrator)
// =======================
const saveTimetable = async (req, res) => {
  try {
    const { course, batch, slots, schedule, additionalSubjects, status } = req.body;

    if (!course || !batch || !schedule) {
      return res.status(400).json({
        message: "Course, batch, and schedule data are required",
      });
    }

    const resolvedSlots = slots && slots.length > 0 ? slots : getSlotsForBatch(batch);

    const updated = await Timetable.findOneAndUpdate(
      { course, batch },
      {
        course,
        batch,
        slots: resolvedSlots,
        schedule,
        additionalSubjects: additionalSubjects || "",
        status: status || "Published",
        generatedBy: req.user?._id,
      },
      { new: true, upsert: true }
    );

    res.status(200).json({
      message: "Timetable saved and published successfully",
      timetable: updated,
    });
  } catch (error) {
    console.error("Error saving timetable:", error);
    res.status(500).json({
      message: error.message || "Failed to save timetable",
    });
  }
};

// =======================
// Get Timetable (by Course & Batch)
// =======================
const getTimetable = async (req, res) => {
  try {
    const { course = "NEET", batch = "Morning" } = req.query;

    let timetable = await Timetable.findOne({ course, batch }).populate(
      "generatedBy",
      "name email role"
    );

    if (!timetable) {
      // Generate default and persist so subsequent queries find it
      const { slots, schedule } = generateStandardSchedule(course, batch);
      timetable = await Timetable.create({
        course,
        batch,
        slots,
        schedule,
        status: "Published",
      });
    }

    res.status(200).json({
      success: true,
      timetable,
    });
  } catch (error) {
    console.error("Error fetching timetable:", error);
    res.status(500).json({
      message: error.message || "Failed to fetch timetable",
    });
  }
};

// =======================
// Get All Timetables
// =======================
const getAllTimetables = async (req, res) => {
  try {
    const timetables = await Timetable.find().sort({ course: 1, batch: 1 });
    res.status(200).json({
      success: true,
      timetables,
    });
  } catch (error) {
    console.error("Error fetching all timetables:", error);
    res.status(500).json({
      message: error.message || "Failed to fetch all timetables",
    });
  }
};

module.exports = {
  saveTimetable,
  getTimetable,
  getAllTimetables,
};
