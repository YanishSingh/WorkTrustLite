const express = require('express');
const router = express.Router();
const { register, login } = require('../controllers/authController');
const { requestMfa, verifyMfa } = require('../controllers/authController');
const { loginLimiter } = require('../middleware/rateLimiter');


router.post('/register', register);
router.post('/login', login);

// routes for MFA, logout, password reset, etc.

router.post('/request-mfa', requestMfa);
router.post('/verify-mfa', verifyMfa);
router.post('/login', loginLimiter, login);

module.exports = router;
