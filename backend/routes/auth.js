const express = require('express');
const router = express.Router();
const { 
  register, 
  login, 
  requestMfa, 
  verifyMfa, 
  forgotPassword, 
  resetPassword 
} = require('../controllers/authController');
const { loginLimiter, apiLimiter } = require('../middleware/rateLimiter');

// Apply rate limiting to sensitive endpoints
router.post('/register', apiLimiter, register);
router.post('/login', loginLimiter, login);
router.post('/request-mfa', loginLimiter, requestMfa);
router.post('/verify-mfa', loginLimiter, verifyMfa);

// Password reset routes
router.post('/forgot-password', loginLimiter, forgotPassword);
router.post('/reset-password', loginLimiter, resetPassword);

module.exports = router;
