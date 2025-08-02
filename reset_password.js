const mongoose = require('mongoose');
const User = require('./models/User');
const { hashPassword } = require('./utils/passwordValidator');
require('dotenv').config();

async function resetPassword() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/worktrust');
    console.log('Connected to MongoDB');
    
    const email = 'edubridge.yanish@gmail.com';
    const newPassword = 'TempPass123!'; // Temporary password
    
    const user = await User.findOne({ email });
    if (!user) {
      console.log('❌ User not found');
      return;
    }
    
    console.log(`Found user: ${user.name} (${user.email})`);
    console.log(`Current failed attempts: ${user.failedLoginAttempts}`);
    
    // Reset password and clear failed attempts
    const hashedPassword = await hashPassword(newPassword);
    user.password = hashedPassword;
    user.failedLoginAttempts = 0;
    user.accountLockedUntil = undefined;
    user.passwordChangedAt = new Date();
    user.passwordExpiry = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000); // 90 days
    user.loginCountSincePasswordChange = 0;
    
    await user.save();
    
    console.log('\n✅ Password Reset Successful!');
    console.log(`📧 Email: ${email}`);
    console.log(`🔑 Temporary Password: ${newPassword}`);
    console.log('🚨 Please change this password after logging in!');
    
  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

resetPassword();