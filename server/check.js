const mongoose = require('mongoose');
mongoose.connect('mongodb://127.0.0.1:27017/edusphere').then(async () => {
  const quizzes = await mongoose.connection.db.collection('quizzes').find().toArray();
  console.log('--- QUIZZES ---');
  quizzes.forEach(q => console.log(`ID: ${q._id} | Title: ${q.title} | Batch: "${q.batch}" | Status: ${q.status} | Course: "${q.course}" | Start: ${q.startDate} ${q.startTime}`));
  
  const students = await mongoose.connection.db.collection('students').find().toArray();
  console.log('\n--- STUDENTS ---');
  students.forEach(s => console.log(`Name: ${s.fullName} | Batch: "${s.batch}" | Course: "${s.course}"`));
  
  process.exit();
}).catch(console.error);
