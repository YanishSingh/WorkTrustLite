const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const zxcvbn = require('zxcvbn');
const { sendOTP } = require('../utils/mailer');
const crypto = require('crypto');


exports.register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Password length & strength check
    if (!password || password.length < 8 || password.length > 32)
      return res.status(400).json({ msg: 'Password must be 8-32 characters.' });

    const result = zxcvbn(password);
    if (result.score < 3) // 0-4, require "strong" or better
      return res.status(400).json({ msg: 'Password too weak. Use upper, lower, numbers, symbols.' });

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ msg: 'Email already registered.' });

    // Check for minimum 1 uppercase, 1 lowercase, 1 number, 1 special character
    const pattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).+$/;
    if (!pattern.test(password)) return res.status(400).json({ msg: 'Password must have upper, lower, number, symbol.' });

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Prevent using recent passwords (could check against previous users if updating)
    // For new reg, just start passwordHistory with current hash

    // Create user
    const user = new User({
      name,
      email,
      password: hashedPassword,
      role,
      passwordHistory: [hashedPassword],
      passwordChangedAt: new Date()
    });
    await user.save();

    res.status(201).json({ msg: 'Registration successful!' });
  } catch (err) {
    res.status(500).json({ msg: 'Registration failed', error: err.message });
  }
};

// Generate and send OTP
exports.requestMfa = async (req, res) => {
  try {
    const { email } = req.body;
    // Find user
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ msg: 'User not found.' });

    // Generate 6-digit OTP, store hash + expiry
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = crypto.createHash('sha256').update(otp).digest('hex');
    user.mfaSecret = otpHash;
    user.otpExpiry = Date.now() + 5 * 60 * 1000; // 5 min
    await user.save();

    // Send OTP
    await sendOTP(email, otp);
    res.json({ msg: 'OTP sent to email.' });
  } catch (err) {
    res.status(500).json({ msg: 'Failed to send OTP', error: err.message });
  }
};

// Verify OTP
exports.verifyMfa = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const user = await User.findOne({ email });
    if (!user || !user.mfaSecret) return res.status(400).json({ msg: 'No MFA requested.' });

    // Hash submitted OTP and compare
    const otpHash = crypto.createHash('sha256').update(otp).digest('hex');
    if (user.otpExpiry < Date.now()) return res.status(400).json({ msg: 'OTP expired.' });

    if (user.mfaSecret !== otpHash) return res.status(400).json({ msg: 'Invalid OTP.' });

    // Clear MFA secret on success
    user.mfaSecret = undefined;
    user.otpExpiry = undefined;
    await user.save();

    // Issue JWT (could issue a longer-lived token here)
    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '2h' });
    res.json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    res.status(500).json({ msg: 'OTP verification failed', error: err.message });
  }
};

// Login controller
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ msg: 'Invalid credentials.' });

    // Check lockout
    if (user.accountLockedUntil && user.accountLockedUntil > new Date()) {
      return res.status(403).json({ msg: 'Account locked. Try again later.' });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      user.failedLoginAttempts += 1;
      // Lock account after 5 failures
      if (user.failedLoginAttempts >= 5) {
        user.accountLockedUntil = new Date(Date.now() + 10 * 60 * 1000); // 10 min lock
        user.failedLoginAttempts = 0;
      }
      await user.save();
      return res.status(400).json({ msg: 'Invalid credentials.' });
    }

    user.failedLoginAttempts = 0; // reset on success
    await user.save();

    // Issue JWT (to be improved with MFA/refresh token etc)
    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '2h' });
    res.json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    res.status(500).json({ msg: 'Login failed', error: err.message });
  }
};
