/**
 * Frontend Application Constants
 */

// Password validation constants
export const PASSWORD_CONFIG = {
  MIN_LENGTH: 8,
  MAX_LENGTH: 32,
  PATTERN: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).+$/,
  MIN_STRENGTH_SCORE: 3
} as const;

// User roles
export const USER_ROLES = {
  CLIENT: 'client',
  FREELANCER: 'freelancer'
} as const;

// API endpoints
export const API_ENDPOINTS = {
  AUTH: {
    REGISTER: '/auth/register',
    LOGIN: '/auth/login',
    VERIFY_MFA: '/auth/verify-mfa',
    REQUEST_MFA: '/auth/request-mfa'
  },
  USER: {
    PROFILE: '/user/profile',
    CLIENTS: '/user/clients',
    FREELANCERS: '/user/freelancers',
    RESET_PASSWORD: '/user/reset-expired-password'
  },
  INVOICE: {
    BASE: '/invoice',
    FREELANCER: '/invoice/freelancer',
    CLIENT: '/invoice/client'
  },
  PAYMENT: {
    BASE: '/payment',
    INVOICE: '/payment/invoice'
  }
} as const;

// UI Constants
export const UI_CONFIG = {
  TOAST_DURATION: 1500,
  POLLING_INTERVAL: 10000, // 10 seconds
  REDIRECT_DELAY: 1500
} as const;

// Validation messages
export const VALIDATION_MESSAGES = {
  REQUIRED_FIELD: 'This field is required',
  INVALID_EMAIL: 'Please enter a valid email address',
  PASSWORD_TOO_SHORT: `Password must be at least ${PASSWORD_CONFIG.MIN_LENGTH} characters`,
  PASSWORD_TOO_LONG: `Password must not exceed ${PASSWORD_CONFIG.MAX_LENGTH} characters`,
  PASSWORD_TOO_WEAK: 'Password is too weak. Use a mix of upper, lower, numbers, and symbols',
  PASSWORD_PATTERN_INVALID: 'Password must contain uppercase, lowercase, number, and special character',
  PASSWORDS_NO_MATCH: 'Passwords do not match',
  REGISTRATION_SUCCESS: 'Registration successful! Please login.',
  LOGIN_SUCCESS: 'Login successful! Redirecting...'
} as const;

// Animation classes
export const ANIMATIONS = {
  PULSE: 'animate-pulse',
  SHAKE: 'animate-shake',
  SCALE_98: 'active:scale-98'
} as const;