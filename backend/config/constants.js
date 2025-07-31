/**
 * Application Constants
 * Centralized configuration for security policies and application settings
 */

module.exports = {
  // Password Security Configuration
  PASSWORD: {
    MIN_LENGTH: 8,
    MAX_LENGTH: 32,
    MIN_STRENGTH_SCORE: 3, // Zxcvbn score (0-4)
    HISTORY_LENGTH: 5, // Number of previous passwords to remember
    EXPIRY_DAYS: 90, // Password expiry in days
    MAX_LOGIN_BEFORE_EXPIRY: 5, // Force password change after N logins
    REGEX: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).+$/, // Must contain upper, lower, number, symbol
    SALT_ROUNDS: 12 // Bcrypt salt rounds
  },

  // Account Security Configuration
  ACCOUNT_LOCKOUT: {
    MAX_FAILED_ATTEMPTS: 5,
    LOCKOUT_DURATION_MINUTES: 10
  },

  // MFA Configuration
  MFA: {
    OTP_EXPIRY_MINUTES: 5,
    OTP_LENGTH: 6
  },

  // Rate Limiting Configuration
  RATE_LIMIT: {
    LOGIN: {
      WINDOW_MINUTES: 10,
      MAX_ATTEMPTS: 5
    },
    API: {
      WINDOW_MINUTES: 1,
      MAX_REQUESTS: 30
    }
  },

  // JWT Configuration
  JWT: {
    EXPIRY: '2h'
  },

  // User Roles
  USER_ROLES: {
    CLIENT: 'client',
    FREELANCER: 'freelancer'
  },

  // Invoice Status
  INVOICE_STATUS: {
    PENDING: 'pending',
    PAID: 'paid',
    CANCELLED: 'cancelled'
  },

  // HTTP Status Codes (for consistency)
  HTTP_STATUS: {
    OK: 200,
    CREATED: 201,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    INTERNAL_SERVER_ERROR: 500
  },

  // Validation Messages
  MESSAGES: {
    PASSWORD_TOO_SHORT: 'Password must be at least 8 characters long',
    PASSWORD_TOO_LONG: 'Password must not exceed 32 characters',
    PASSWORD_TOO_WEAK: 'Password is too weak. Use a mix of upper, lower, numbers, and symbols',
    PASSWORD_PATTERN_INVALID: 'Password must contain uppercase, lowercase, number, and special character',
    PASSWORD_REUSE_ERROR: 'Cannot reuse any of your last 5 passwords',
    CURRENT_PASSWORD_REQUIRED: 'Current password is required',
    CURRENT_PASSWORD_INCORRECT: 'Current password is incorrect',
    INVALID_CREDENTIALS: 'Invalid email or password',
    ACCOUNT_LOCKED: 'Account is locked due to too many failed attempts. Please try again later',
    EMAIL_ALREADY_EXISTS: 'An account with this email already exists',
    USER_NOT_FOUND: 'User not found',
    PASSWORD_EXPIRED: 'Your password has expired. Please set a new password',
    OTP_EXPIRED: 'OTP has expired. Please request a new one',
    OTP_INVALID: 'Invalid OTP code',
    REGISTRATION_SUCCESS: 'Registration successful! Please log in',
    LOGIN_SUCCESS: 'Login successful',
    PROFILE_UPDATED: 'Profile updated successfully',
    PASSWORD_CHANGED: 'Password changed successfully. Please log in again'
  }
};