const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const zxcvbn = require('zxcvbn');
const { sendOTP } = require('../utils/mailer');
const crypto = require('crypto');

const PASSWORD_EXPIRY_DAYS = 90;
const PASSWORD_HISTORY_LENGTH = 5;
const MAX_LOGIN_BEFORE_EXPIRY = 5;

// REGISTER
exports.register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Password policy
    if (!password || password.length < 8 || password.length > 32)
      return res.status(400).json({ msg: 'Password must be 8-32 characters.' });

    const result = zxcvbn(password);
    if (result.score < 3)
      return res.status(400).json({ msg: 'Password too weak. Use upper, lower, numbers, symbols.' });

    const pattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).+$/;
    if (!pattern.test(password))
      return res.status(400).json({ msg: 'Password must have upper, lower, number, symbol.' });

    // Existing user
    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).json({ msg: 'Email already registered.' });

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Set expiry and login count
    const expiryDate = new Date(Date.now() + PASSWORD_EXPIRY_DAYS * 24 * 60 * 60 * 1000);

    const user = new User({
      name,
      email,
      password: hashedPassword,
      role,
      passwordHistory: [hashedPassword],
      passwordChangedAt: new Date(),
      passwordExpiry: expiryDate,
      loginCountSincePasswordChange: 0,
      failedLoginAttempts: 0,
    });
    await user.save();

    res.status(201).json({ msg: 'Registration successful!' });
  } catch (err) {
    res.status(500).json({ msg: 'Registration failed', error: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ msg: 'Invalid credentials.' });

    // Lockout check
    if (user.accountLockedUntil && user.accountLockedUntil > new Date()) {
      return res.status(403).json({ msg: 'Account locked. Try again later.' });
    }

    // Password check (must happen before increment)
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
      if (user.failedLoginAttempts >= 5) {
        user.accountLockedUntil = new Date(Date.now() + 10 * 60 * 1000);
        user.failedLoginAttempts = 0;
      }
      await user.save();
      return res.status(400).json({ msg: 'Invalid credentials.' });
    }

    // Password expiry by date
    if (user.passwordExpiry && user.passwordExpiry < new Date()) {
      // Return 200 OK so frontend can redirect
      return res.status(200).json({
        msg: 'Password expired. Please change your password.',
        passwordExpired: true,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          mfaEnabled: user.mfaEnabled,
        }
      });
    }

    // Password expiry by login count (5 logins)
    if (
      typeof user.loginCountSincePasswordChange === 'number' &&
      user.loginCountSincePasswordChange >= MAX_LOGIN_BEFORE_EXPIRY
    ) {
      // Return 200 OK so frontend can redirect
      return res.status(200).json({
        msg: 'Password expired after 5 logins. Please change your password.',
        passwordExpired: true,
        passwordReuseLimit: true,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          mfaEnabled: user.mfaEnabled,
        }
      });
    }

    // Reset failed attempts and increment login count (after passing expiry checks)
    user.failedLoginAttempts = 0;
    user.loginCountSincePasswordChange = (user.loginCountSincePasswordChange || 0) + 1;
    await user.save();

    // Always require MFA after password check
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = crypto.createHash('sha256').update(otp).digest('hex');
    user.mfaSecret = otpHash;
    user.otpExpiry = Date.now() + 5 * 60 * 1000;
    await user.save();
    await sendOTP(user.email, otp);
    return res.json({ mfaRequired: true, email: user.email });

  } catch (err) {
    res.status(500).json({ msg: 'Login failed', error: err.message });
  }
};

// MFA: Generate and send OTP
exports.requestMfa = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ msg: 'User not found.' });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = crypto.createHash('sha256').update(otp).digest('hex');
    user.mfaSecret = otpHash;
    user.otpExpiry = Date.now() + 5 * 60 * 1000;
    await user.save();

    await sendOTP(email, otp);
    res.json({ msg: 'OTP sent to email.' });
  } catch (err) {
    res.status(500).json({ msg: 'Failed to send OTP', error: err.message });
  }
};

// MFA: Verify OTP
exports.verifyMfa = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const user = await User.findOne({ email });
    if (!user || !user.mfaSecret) return res.status(400).json({ msg: 'No MFA requested.' });

    const otpHash = crypto.createHash('sha256').update(otp).digest('hex');
    if (user.otpExpiry < Date.now()) return res.status(400).json({ msg: 'OTP expired.' });

    if (user.mfaSecret !== otpHash) return res.status(400).json({ msg: 'Invalid OTP.' });

    user.mfaSecret = undefined;
    user.otpExpiry = undefined;
    await user.save();

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '2h' }
    );
    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        mfaEnabled: user.mfaEnabled,
      },
    });
  } catch (err) {
    res.status(500).json({ msg: 'OTP verification failed', error: err.message });
  }
};
