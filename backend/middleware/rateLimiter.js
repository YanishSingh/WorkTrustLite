const rateLimit = require('express-rate-limit');

// 5 login attempts per 10 min per IP
exports.loginLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 5,
  message: 'Too many login attempts from this IP. Please wait 10 minutes before trying again.',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      msg: 'Too many login attempts from this IP. Please wait 10 minutes before trying again.',
      retryAfter: Math.ceil(10 * 60), // 10 minutes in seconds
      rateLimited: true
    });
  }
});

// 30 requests per minute per IP for public APIs
exports.apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: 'Too many requests, please slow down.',
  standardHeaders: true,
  legacyHeaders: false,
});
