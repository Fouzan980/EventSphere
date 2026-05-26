const jwt  = require('jsonwebtoken');
const User = require('../models/User');

// ── protect ───────────────────────────────────────────────────────────────────
// Validates Bearer JWT, attaches full Mongoose user doc to req.user.
// Uses DB lookup so name/role are always fresh (no stale JWT data).
const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization?.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }
  if (!token) {
    return res.status(401).json({ message: 'Not authorized — no token provided.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // JWT payload was signed as { id, role } — support both id and _id
    const userId  = decoded._id || decoded.id;
    if (!userId) return res.status(401).json({ message: 'Invalid token payload.' });

    const user = await User.findById(userId).select('-password -loginAttempts -lockUntil -lockCount -resetPasswordToken -resetPasswordExpire -verificationDocument');
    if (!user) {
      return res.status(401).json({ message: 'Account not found. Please log in again.' });
    }

    req.user = user; // full Mongoose doc → .id (virtual) and ._id both work
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Session expired. Please log in again.' });
    }
    return res.status(401).json({ message: 'Not authorized — invalid token.' });
  }
};

// ── authorize ─────────────────────────────────────────────────────────────────
// Role-based access control middleware.
const authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user?.role)) {
    return res.status(403).json({ message: `Access denied. Required role: ${roles.join(' or ')}.` });
  }
  next();
};

module.exports = { protect, authorize };
