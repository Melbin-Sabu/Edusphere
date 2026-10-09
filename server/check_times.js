const mongoose = require('mongoose');
mongoose.connect('mongodb://127.0.0.1:27017/edusphere').then(async () => {
  const quizzes = await mongoose.connection.db.collection('quizzes').find().toArray();
  quizzes.forEach(q => {
    console.log(`Title: ${q.title}`);
    console.log(`startDate: ${q.startDate}, startTime: ${q.startTime}`);
    console.log(`endDate: ${q.endDate}, endTime: ${q.endTime}`);
    
    const now = new Date();
    const quizStartMs = new Date(q.startDate).setHours(parseInt(q.startTime.split(':')[0]), parseInt(q.startTime.split(':')[1]), 0);
    const quizEndMs = new Date(q.endDate).setHours(parseInt(q.endTime.split(':')[0]), parseInt(q.endTime.split(':')[1]), 0);
    
    console.log(`now: ${now}`);
    console.log(`quizStart: ${new Date(quizStartMs)}`);
    console.log(`quizEnd: ${new Date(quizEndMs)}`);
    console.log(`valid? ${now.getTime() >= quizStartMs && now.getTime() <= quizEndMs}`);
    console.log('---');
  });
  process.exit();
}).catch(console.error);
