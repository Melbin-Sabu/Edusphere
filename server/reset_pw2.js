const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
mongoose.connect('mongodb://127.0.0.1:27017/edusphere').then(async () => {
    const db = mongoose.connection.db;
    const hashedPassword = await bcrypt.hash('123456', 10);
    await db.collection('users').updateOne({email: 'divinbabu2027@mca.ajce.in'}, {'$set': {password: hashedPassword}});
    console.log('Password reset to 123456');
    process.exit(0);
});
