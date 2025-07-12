const jwt = require('jsonwebtoken');

exports.protect = (req, res, next) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer ')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) return res.status(401).json({ msg: 'Not authorized, no token.' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ msg: 'Token invalid or expired.' });
  }
};

// Accepts allowed roles (array or ...args)
exports.authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role))
    return res.status(403).json({ msg: 'Forbidden: insufficient role.' });
  next();
};
