const jwt = require('jsonwebtoken');
const { jwtSecret } = require('../config/env');
const { User } = require('../models');

/**
 * Verifies the JWT stored in the HttpOnly cookie.
 * Attaches decoded user document to req.user.
 * Calls next(err) with 401 if missing/invalid.
 */
const auth = async (req, res, next) => {
  try {
    const token = req.cookies && req.cookies.auth_token;
    if (!token) {
      const err = new Error('Authentication required. Please log in.');
      err.statusCode = 401;
      return next(err);
    }

    const decoded = jwt.verify(token, jwtSecret);
    const user = await User.findById(decoded.userId).select('-passwordHash');

    if (!user) {
      const err = new Error('User not found. Please log in again.');
      err.statusCode = 401;
      return next(err);
    }

    if (user.status === 'banned') {
      const err = new Error('Your account has been banned. Please contact support.');
      err.statusCode = 403;
      return next(err);
    }

    if (user.status === 'suspended') {
      const err = new Error('Your account is suspended. Please contact support.');
      err.statusCode = 403;
      return next(err);
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      const authErr = new Error('Session expired. Please log in again.');
      authErr.statusCode = 401;
      return next(authErr);
    }
    if (err.name === 'JsonWebTokenError') {
      const authErr = new Error('Invalid token. Please log in again.');
      authErr.statusCode = 401;
      return next(authErr);
    }
    next(err);
  }
};

/**
 * Optionally load the authenticated user if token present.
 * Never blocks the request — for pages that work for both guests and users.
 */
const optionalAuth = async (req, res, next) => {
  try {
    const token = req.cookies && req.cookies.auth_token;
    if (!token) return next();
    const decoded = jwt.verify(token, jwtSecret);
    const user = await User.findById(decoded.userId).select('-passwordHash');
    if (user && user.status === 'active') req.user = user;
  } catch {
    // Silently ignore auth errors for optional auth
  }
  next();
};

module.exports = { auth, optionalAuth };
