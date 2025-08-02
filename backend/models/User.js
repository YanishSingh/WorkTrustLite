const mongoose = require('mongoose');
const { encryptEmail, decryptEmail, hashEmail } = require('../utils/encrypt');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, trim: true }, // Will store encrypted email
  emailHash: { type: String, required: true, unique: true }, // For searching without decryption
  password: { type: String, required: true },
  role: { type: String, enum: ['client', 'freelancer'], required: true },
  avatar: String,
  bio: String,
  otpExpiry: Date,

  // MFA fields
  mfaEnabled: { type: Boolean, default: false },
  mfaSecret: String,

  // Password security
  passwordHistory: [{ type: String }], // Store previous password hashes
  passwordChangedAt: { type: Date, default: Date.now },
  passwordExpiry: { type: Date, default: () => Date.now() + 90*24*60*60*1000 }, // 90 days
  loginCountSincePasswordChange: { type: Number, default: 0 }, // <--- NEW FIELD

  // Account lockout
  accountLockedUntil: Date,
  failedLoginAttempts: { type: Number, default: 0 }
}, { timestamps: true });

// Pre-save middleware to encrypt email and create hash
userSchema.pre('save', function(next) {
  if (this.isModified('email')) {
    try {
      // Store original email for hashing
      const originalEmail = this.email;
      
      // Create hash for searching (from original plaintext)
      this.emailHash = hashEmail(originalEmail);
      
      // Encrypt the email
      this.email = encryptEmail(originalEmail);
    } catch (error) {
      return next(error);
    }
  }
  next();
});

// Instance method to decrypt email
userSchema.methods.getDecryptedEmail = function() {
  try {
    return decryptEmail(this.email);
  } catch (error) {
    console.error('Failed to decrypt email:', error);
    return null;
  }
};

// Static method to find user by email (using hash)
userSchema.statics.findByEmail = function(email) {
  const emailHash = hashEmail(email);
  return this.findOne({ emailHash });
};

// Static method to find user by encrypted email
userSchema.statics.findByEncryptedEmail = function(encryptedEmail) {
  return this.findOne({ email: encryptedEmail });
};

module.exports = mongoose.model('User', userSchema);
