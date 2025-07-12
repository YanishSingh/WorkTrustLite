const rateLimit = require('express-rate-limit');

// 5 login attempts per 10 min per IP
exports.loginLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 5,
  message: 'Too many login attempts from this IP, try again after 10 minutes.',
  standardHeaders: true,
  legacyHeaders: false,
});

// 30 requests per minute per IP for public APIs
exports.apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: 'Too many requests, please slow down.',
  standardHeaders: true,
  legacyHeaders: false,
});
