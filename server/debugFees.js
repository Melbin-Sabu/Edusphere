const mongoose = require("mongoose");
require("dotenv").config();
const connectDB = require("./config/db");
const Student = require("./models/Student");
const FeeStructure = require("./models/FeeStructure");
const StudentFee = require("./models/StudentFee");

const run = async () => {
  await connectDB();
  
  console.log("--- STUDENTS ---");
  const students = await Student.find({}, "fullName course batch status");
  console.log(students);
  
  console.log("\n--- FEE STRUCTURES ---");
  const structures = await FeeStructure.find({}, "courseId batchId totalAmount");
  console.log(structures);
  
  console.log("\n--- STUDENT FEES ---");
  const studentFees = await StudentFee.find({}, "studentId feeStructureId pendingAmount").populate("studentId", "fullName").populate("feeStructureId", "courseId batchId");
  console.log(studentFees);
  
  // Try assigning any unassigned fees
  for (const structure of structures) {
    const matchingStudents = await Student.find({
      course: new RegExp(structure.courseId, "i"),
      batch: new RegExp(structure.batchId, "i"),
      status: "Active"
    });
    
    for (const student of matchingStudents) {
      const exists = await StudentFee.findOne({ studentId: student._id, feeStructureId: structure._id });
      if (!exists) {
        console.log(`Assigning missing fee structure ${structure.courseId} / ${structure.batchId} to student ${student.fullName}`);
        await StudentFee.create({
          studentId: student._id,
          feeStructureId: structure._id,
          totalAmount: structure.totalAmount,
          paidAmount: 0,
          pendingAmount: structure.totalAmount,
          dueDate: new Date(),
          status: "PENDING"
        });
      }
    }
  }
  
  console.log("\nDone!");
  process.exit(0);
};

run();
