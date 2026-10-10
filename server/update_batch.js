require('mongoose').connect('mongodb://127.0.0.1:27017/edusphere').then(async () => { 
  const Student = require('./models/Student'); 
  await Student.updateOne({ email: 'melbinsabu2027@mca.ajce.in' }, { $set: { batch: 'NEET Morning Batch' } }); 
  console.log('Successfully updated batch!'); 
  process.exit(0); 
});
