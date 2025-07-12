const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['client', 'freelancer'], required: true },
  avatar: String,
  bio: String,
  otpExpiry: Date,

  // MFA fields
  mfaEnabled: { type: Boolean, default: false },
  mfaSecret: String,

  // Password security
  passwordHistory: [String], // hashes of last N passwords
  passwordChangedAt: Date,

  // Account lockout
  accountLockedUntil: Date,
  failedLoginAttempts: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
