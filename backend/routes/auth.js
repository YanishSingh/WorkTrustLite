const express = require('express');
const router = express.Router();
const { register, login } = require('../controllers/authController');
const { requestMfa, verifyMfa } = require('../controllers/authController');
const { loginLimiter, apiLimiter } = require('../middleware/rateLimiter');

// Apply rate limiting to sensitive endpoints
router.post('/register', apiLimiter, register);
router.post('/login', loginLimiter, login);
router.post('/request-mfa', loginLimiter, requestMfa);
router.post('/verify-mfa', loginLimiter, verifyMfa);

// (other routes, e.g., logout, password reset, etc.)

module.exports = router;
