const User = require('../models/User');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { sendOTP } = require('../utils/mailer');
const { logActivity } = require('../utils/logger');
const { 
  validateNewPassword, 
  hashPassword, 
  comparePassword, 
  checkPasswordExpiry,
  updateUserPassword 
} = require('../utils/passwordValidator');
const { 
  PASSWORD, 
  ACCOUNT_LOCKOUT, 
  MFA, 
  JWT, 
  MESSAGES, 
  HTTP_STATUS 
} = require('../config/constants');

/**
 * User Registration Controller
 * Handles new user registration with comprehensive security validation
 */
exports.register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Input validation
    if (!name || !email || !password || !role) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ 
        msg: 'All fields are required' 
      });
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ 
        msg: 'Please provide a valid email address' 
      });
    }

    // Password validation using centralized utility
    const passwordError = await validateNewPassword(null, password);
    if (passwordError) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ msg: passwordError });
    }

    // Check if user already exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ 
        msg: MESSAGES.EMAIL_ALREADY_EXISTS 
      });
    }

    // Hash password securely
    const hashedPassword = await hashPassword(password);

    // Create new user with security defaults
    const user = new User({
      name: name.trim(),
      email: email.toLowerCase(), // Will be encrypted by pre-save middleware
      password: hashedPassword,
      role,
      passwordHistory: [hashedPassword],
      passwordChangedAt: new Date(),
      passwordExpiry: new Date(Date.now() + PASSWORD.EXPIRY_DAYS * 24 * 60 * 60 * 1000),
      loginCountSincePasswordChange: 0,
      failedLoginAttempts: 0,
    });

    await user.save();

    // Log successful registration
    logActivity(user._id, 'user_registration', { email: user.email, role: user.role });

    res.status(HTTP_STATUS.CREATED).json({ 
      msg: MESSAGES.REGISTRATION_SUCCESS 
    });

  } catch (err) {
    console.error('Registration error:', err);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ 
      msg: 'Registration failed. Please try again.' 
    });
  }
};

/**
 * User Login Controller
 * Handles user authentication with comprehensive security checks
 */
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Input validation
    if (!email || !password) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ 
        msg: 'Email and password are required' 
      });
    }

    // Find user by email (using hash for security)
    const user = await User.findByEmail(email);
    if (!user) {
      // Log failed login attempt
      logActivity(null, 'failed_login_attempt', { email, reason: 'user_not_found' });
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ 
        msg: MESSAGES.INVALID_CREDENTIALS 
      });
    }

    // Check if account is locked
    if (user.accountLockedUntil && user.accountLockedUntil > new Date()) {
      logActivity(user._id, 'blocked_login_attempt', { reason: 'account_locked' });
      return res.status(HTTP_STATUS.FORBIDDEN).json({ 
        msg: MESSAGES.ACCOUNT_LOCKED 
      });
    }

    // Verify password
    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      // Increment failed attempts
      user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
      
      // Lock account if max attempts reached
      if (user.failedLoginAttempts >= ACCOUNT_LOCKOUT.MAX_FAILED_ATTEMPTS) {
        user.accountLockedUntil = new Date(
          Date.now() + ACCOUNT_LOCKOUT.LOCKOUT_DURATION_MINUTES * 60 * 1000
        );
        user.failedLoginAttempts = 0;
        logActivity(user._id, 'account_locked', { 
          reason: 'max_failed_attempts',
          lockoutUntil: user.accountLockedUntil 
        });
        
        await user.save();
        logActivity(user._id, 'failed_login_attempt', { 
          reason: 'invalid_password',
          failedAttempts: user.failedLoginAttempts 
        });
        
        return res.status(HTTP_STATUS.FORBIDDEN).json({ 
          msg: `Account locked due to too many failed attempts. Please try again in ${ACCOUNT_LOCKOUT.LOCKOUT_DURATION_MINUTES} minutes.`,
          accountLocked: true,
          lockoutDuration: ACCOUNT_LOCKOUT.LOCKOUT_DURATION_MINUTES
        });
      }
      
      await user.save();
      logActivity(user._id, 'failed_login_attempt', { 
        reason: 'invalid_password',
        failedAttempts: user.failedLoginAttempts 
      });
      
      // Show remaining attempts before lockout
      const remainingAttempts = ACCOUNT_LOCKOUT.MAX_FAILED_ATTEMPTS - user.failedLoginAttempts;
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ 
        msg: `Invalid email or password. ${remainingAttempts} attempt${remainingAttempts !== 1 ? 's' : ''} remaining before account lockout.`,
        remainingAttempts
      });
    }

    // Check password expiry
    const expiryCheck = checkPasswordExpiry(user);
    if (expiryCheck.expired) {
      logActivity(user._id, 'password_expiry_detected', { reason: expiryCheck.reason });
      return res.status(HTTP_STATUS.OK).json({
        msg: expiryCheck.message,
        passwordExpired: true,
        passwordReuseLimit: expiryCheck.reason === 'usage',
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          mfaEnabled: user.mfaEnabled,
        }
      });
    }

    // Reset failed attempts and update login count
    user.failedLoginAttempts = 0;
    user.loginCountSincePasswordChange = (user.loginCountSincePasswordChange || 0) + 1;
    await user.save();

    // Check if there's already a valid OTP
    if (user.mfaSecret && user.otpExpiry > Date.now()) {
      // Don't generate new OTP if one is still valid
      logActivity(user._id, 'mfa_otp_reuse_existing', { 
        remainingTime: Math.floor((user.otpExpiry - Date.now()) / 1000) 
      });
      return res.json({ 
        mfaRequired: true, 
        email: user.email,
        msg: 'A verification code was already sent. Please check your email or wait for it to expire.'
      });
    }

    // Generate and send MFA OTP
    const otp = Math.floor(
      Math.pow(10, MFA.OTP_LENGTH - 1) + 
      Math.random() * (Math.pow(10, MFA.OTP_LENGTH) - Math.pow(10, MFA.OTP_LENGTH - 1))
    ).toString();
    
    const otpHash = crypto.createHash('sha256').update(otp).digest('hex');
    user.mfaSecret = otpHash;
    user.otpExpiry = Date.now() + MFA.OTP_EXPIRY_MINUTES * 60 * 1000;
    await user.save();

    // Get decrypted email for sending
    const decryptedEmail = user.getDecryptedEmail();
    
    // Send OTP via email
    await sendOTP(decryptedEmail, otp);
    
    // Log successful password verification
    logActivity(user._id, 'login_password_verified', { mfaRequired: true });

    return res.json({ 
      mfaRequired: true, 
      email: user.email,
      msg: 'Please check your email for the verification code'
    });

  } catch (err) {
    console.error('Login error:', err);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ 
      msg: 'Login failed. Please try again.' 
    });
  }
};

/**
 * MFA OTP Request Controller
 * Generates and sends OTP for multi-factor authentication
 */
exports.requestMfa = async (req, res) => {
  try {
    const { email } = req.body;

    // Input validation
    if (!email) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ 
        msg: 'Email is required' 
      });
    }

    // Find user
    const user = await User.findByEmail(email);
    if (!user) {
      // Don't reveal if user exists for security
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ 
        msg: MESSAGES.USER_NOT_FOUND 
      });
    }

    // Generate secure OTP
    const otp = Math.floor(
      Math.pow(10, MFA.OTP_LENGTH - 1) + 
      Math.random() * (Math.pow(10, MFA.OTP_LENGTH) - Math.pow(10, MFA.OTP_LENGTH - 1))
    ).toString();
    
    const otpHash = crypto.createHash('sha256').update(otp).digest('hex');
    user.mfaSecret = otpHash;
    user.otpExpiry = Date.now() + MFA.OTP_EXPIRY_MINUTES * 60 * 1000;
    await user.save();

    // Get decrypted email for sending
    const decryptedEmail = user.getDecryptedEmail();
    
    // Send OTP via email
    await sendOTP(decryptedEmail, otp);
    
    // Log OTP request
    logActivity(user._id, 'mfa_otp_requested', { email: decryptedEmail });

    res.json({ msg: 'Verification code sent to your email' });

  } catch (err) {
    console.error('MFA request error:', err);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ 
      msg: 'Failed to send verification code. Please try again.' 
    });
  }
};

/**
 * MFA OTP Verification Controller
 * Verifies OTP and completes authentication process
 */
exports.verifyMfa = async (req, res) => {
  try {
    const { email, otp } = req.body;

    // Input validation
    if (!email || !otp) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ 
        msg: 'Email and verification code are required' 
      });
    }

    // Find user
    const user = await User.findByEmail(email);
    if (!user || !user.mfaSecret) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ 
        msg: 'No verification process found. Please request a new code.' 
      });
    }

    // Check OTP expiry
    if (user.otpExpiry < Date.now()) {
      // Clean up expired OTP
      user.mfaSecret = undefined;
      user.otpExpiry = undefined;
      await user.save();
      
      logActivity(user._id, 'mfa_otp_expired', {});
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ 
        msg: MESSAGES.OTP_EXPIRED 
      });
    }

    // Verify OTP
    const otpHash = crypto.createHash('sha256').update(otp.toString()).digest('hex');
    if (user.mfaSecret !== otpHash) {
      // Enhanced logging for debugging
      logActivity(user._id, 'mfa_otp_invalid', { 
        otp: otp.substring(0, 2) + '***',
        expectedHashStart: user.mfaSecret.substring(0, 8),
        actualHashStart: otpHash.substring(0, 8),
        otpExpiry: user.otpExpiry,
        currentTime: Date.now()
      });
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ 
        msg: MESSAGES.OTP_INVALID 
      });
    }

    // Clean up MFA data
    user.mfaSecret = undefined;
    user.otpExpiry = undefined;
    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: JWT.EXPIRY }
    );

    // Log successful login
    logActivity(user._id, 'login_successful', { 
      loginMethod: 'email_password_mfa',
      userAgent: req.headers['user-agent']
    });

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        mfaEnabled: user.mfaEnabled,
      },
      msg: MESSAGES.LOGIN_SUCCESS
    });

  } catch (err) {
    console.error('MFA verification error:', err);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ 
      msg: 'Verification failed. Please try again.' 
    });
  }
};

/**
 * Forgot Password Controller
 * Generates and sends OTP for password reset
 */
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    // Input validation
    if (!email) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ 
        msg: 'Email is required' 
      });
    }

    // Find user by email
    const user = await User.findByEmail(email);
    if (!user) {
      // Don't reveal if user exists for security
      return res.status(HTTP_STATUS.OK).json({ 
        msg: 'If an account with this email exists, you will receive a password reset code.' 
      });
    }

    // Generate secure OTP for password reset
    const otp = Math.floor(
      Math.pow(10, MFA.OTP_LENGTH - 1) + 
      Math.random() * (Math.pow(10, MFA.OTP_LENGTH) - Math.pow(10, MFA.OTP_LENGTH - 1))
    ).toString();
    
    const otpHash = crypto.createHash('sha256').update(otp).digest('hex');
    user.mfaSecret = otpHash; // Reuse existing field for password reset OTP
    user.otpExpiry = Date.now() + MFA.OTP_EXPIRY_MINUTES * 60 * 1000;
    await user.save();

    // Get decrypted email for sending
    const decryptedEmail = user.getDecryptedEmail();
    
    // Send OTP via email
    await sendOTP(decryptedEmail, otp, 'Password Reset');
    
    // Log password reset request
    logActivity(user._id, 'password_reset_requested', { email: decryptedEmail });

    res.json({ 
      msg: 'If an account with this email exists, you will receive a password reset code.',
      email: user.email // Include for frontend flow
    });

  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ 
      msg: 'Password reset request failed. Please try again.' 
    });
  }
};

/**
 * Reset Password Controller
 * Verifies OTP and updates user password
 */
exports.resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    // Input validation
    if (!email || !otp || !newPassword) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ 
        msg: 'Email, OTP, and new password are required' 
      });
    }

    // Find user
    const user = await User.findByEmail(email);
    if (!user || !user.mfaSecret) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ 
        msg: 'Invalid or expired reset request. Please request a new password reset.' 
      });
    }

    // Check OTP expiry
    if (user.otpExpiry < Date.now()) {
      // Clean up expired OTP
      user.mfaSecret = undefined;
      user.otpExpiry = undefined;
      await user.save();
      
      logActivity(user._id, 'password_reset_otp_expired', {});
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ 
        msg: 'Reset code has expired. Please request a new password reset.' 
      });
    }

    // Verify OTP
    const otpHash = crypto.createHash('sha256').update(otp.toString()).digest('hex');
    if (user.mfaSecret !== otpHash) {
      logActivity(user._id, 'password_reset_otp_invalid', { otp: otp.substring(0, 2) + '***' });
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ 
        msg: 'Invalid reset code' 
      });
    }

    // Validate new password using existing utility
    const passwordError = await validateNewPassword(user, newPassword);
    if (passwordError) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ msg: passwordError });
    }

    // Update password using existing utility (handles history, expiry, etc.)
    await updateUserPassword(user, newPassword);

    // Clean up OTP data
    user.mfaSecret = undefined;
    user.otpExpiry = undefined;
    user.failedLoginAttempts = 0; // Reset failed attempts
    user.accountLockedUntil = undefined; // Unlock account if locked
    
    await user.save();

    // Log successful password reset
    logActivity(user._id, 'password_reset_successful', { 
      email: user.email,
      resetMethod: 'otp_verification'
    });

    res.json({
      success: true,
      msg: 'Password reset successful! Please log in with your new password.'
    });

  } catch (err) {
    console.error('Password reset error:', err);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ 
      msg: 'Password reset failed. Please try again.' 
    });
  }
};
