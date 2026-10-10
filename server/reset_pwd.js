const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

mongoose.connect('mongodb://127.0.0.1:27017/edusphere').then(async () => {
  const hash = await bcrypt.hash('123456', 10);
  await mongoose.connection.db.collection('users').updateOne(
    {email: 'alen.chemistry@edusphere.com'},
    {$set: {password: hash}}
  );
  console.log('Password reset to 123456');
  process.exit(0);
});
