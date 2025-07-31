/**
 * Password Validation Utility
 * Centralized password validation logic for consistency across the application
 */
const bcrypt = require('bcryptjs');
const zxcvbn = require('zxcvbn');
const { PASSWORD, MESSAGES } = require('../config/constants');

/**
 * Validates password according to security policy
 * @param {Object} user - User object with password history
 * @param {string} newPassword - Password to validate
 * @returns {Promise<string|null>} Error message or null if valid
 */
async function validateNewPassword(user, newPassword) {
  // Check password length
  if (!newPassword || newPassword.length < PASSWORD.MIN_LENGTH) {
    return MESSAGES.PASSWORD_TOO_SHORT;
  }
  
  if (newPassword.length > PASSWORD.MAX_LENGTH) {
    return MESSAGES.PASSWORD_TOO_LONG;
  }

  // Check password strength using zxcvbn
  const strengthResult = zxcvbn(newPassword);
  if (strengthResult.score < PASSWORD.MIN_STRENGTH_SCORE) {
    return MESSAGES.PASSWORD_TOO_WEAK;
  }

  // Check password pattern (complexity requirements)
  if (!PASSWORD.REGEX.test(newPassword)) {
    return MESSAGES.PASSWORD_PATTERN_INVALID;
  }

  // Check password history (prevent reuse)
  if (user && user.passwordHistory) {
    const recentPasswords = user.passwordHistory.slice(-PASSWORD.HISTORY_LENGTH);
    for (const previousPassword of recentPasswords) {
      if (await bcrypt.compare(newPassword, previousPassword)) {
        return MESSAGES.PASSWORD_REUSE_ERROR;
      }
    }
  }

  return null; // Password is valid
}

/**
 * Hashes a password with secure salt rounds
 * @param {string} password - Plain text password
 * @returns {Promise<string>} Hashed password
 */
async function hashPassword(password) {
  return await bcrypt.hash(password, PASSWORD.SALT_ROUNDS);
}

/**
 * Compares a plain text password with a hashed password
 * @param {string} plainPassword - Plain text password
 * @param {string} hashedPassword - Hashed password
 * @returns {Promise<boolean>} True if passwords match
 */
async function comparePassword(plainPassword, hashedPassword) {
  return await bcrypt.compare(plainPassword, hashedPassword);
}

/**
 * Updates user password and related security fields
 * @param {Object} user - User document
 * @param {string} newPassword - New password (plain text)
 * @returns {Promise<void>}
 */
async function updateUserPassword(user, newPassword) {
  const hashedPassword = await hashPassword(newPassword);
  
  // Update password history (keep only the last N passwords)
  const currentPasswordHistory = user.passwordHistory || [];
  user.passwordHistory = [
    ...currentPasswordHistory.slice(-(PASSWORD.HISTORY_LENGTH - 1)),
    user.password
  ];

  // Update password and related fields
  user.password = hashedPassword;
  user.passwordChangedAt = new Date();
  user.passwordExpiry = new Date(Date.now() + PASSWORD.EXPIRY_DAYS * 24 * 60 * 60 * 1000);
  user.loginCountSincePasswordChange = 0;
}

/**
 * Checks if password has expired
 * @param {Object} user - User object
 * @returns {Object} Object containing expiry status and reason
 */
function checkPasswordExpiry(user) {
  // Check date-based expiry
  if (user.passwordExpiry && user.passwordExpiry < new Date()) {
    return {
      expired: true,
      reason: 'date',
      message: MESSAGES.PASSWORD_EXPIRED
    };
  }

  // Check login-count-based expiry
  if (
    typeof user.loginCountSincePasswordChange === 'number' &&
    user.loginCountSincePasswordChange >= PASSWORD.MAX_LOGIN_BEFORE_EXPIRY
  ) {
    return {
      expired: true,
      reason: 'usage',
      message: 'Password expired after maximum logins. Please change your password.'
    };
  }

  return { expired: false };
}

module.exports = {
  validateNewPassword,
  hashPassword,
  comparePassword,
  updateUserPassword,
  checkPasswordExpiry
};