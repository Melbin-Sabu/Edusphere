const mongoose = require('mongoose');
const Student = require('./models/Student');
mongoose.connect('mongodb://127.0.0.1:27017/edusphere').then(async () => {
  const res = await Student.updateMany({ batch: 'Evening Batch' }, { $set: { batch: 'JEE Evening Batch' } });
  console.log('Updated', res.modifiedCount, 'students.');
  process.exit();
});
