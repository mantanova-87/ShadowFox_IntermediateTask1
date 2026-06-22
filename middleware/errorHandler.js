const { env } = require('../config/env');

/**
 * Global Error Handler Middleware.
 * Must be registered as the LAST middleware in app.js.
 *
 * Operational errors (err.isOperational = true) expose their message to the client.
 * Non-operational errors return a generic 500 message in production.
 */
const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const isOperational = err.isOperational || (statusCode >= 400 && statusCode < 500);
  const message = isOperational ? err.message : 'Internal Server Error';

  // Log stack traces in development
  if (env !== 'production') {
    console.error(`[${statusCode}] ${err.message}`);
    if (err.stack) console.error(err.stack);
  } else {
    // Only log 5xx in production
    if (statusCode >= 500) console.error(err);
  }

  // Mongoose Validation Error
  if (err.name === 'ValidationError') {
    const fields = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({ success: false, error: fields.join('. ') });
  }

  // Mongoose Duplicate Key Error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {}).join(', ');
    return res.status(409).json({
      success: false,
      error: `A record with this ${field || 'value'} already exists.`
    });
  }

  // Respond based on request type
  if (req.accepts('json') || req.xhr || req.path.startsWith('/api')) {
    return res.status(statusCode).json({
      success: false,
      error: message,
      ...(env !== 'production' && { stack: err.stack })
    });
  }

  // EJS page error fallback
  return res.status(statusCode).render('error', {
    title: `Error ${statusCode}`,
    statusCode,
    message,
    layout: 'layouts/layout'
  });
};

module.exports = errorHandler;
