/**
 * Catches errors thrown/passed to next() anywhere in the app and returns
 * a clean, consistent JSON response. Never leaks stack traces, DB errors,
 * or other internal details to the client.
 */
function errorHandler(err, req, res, next) { // eslint-disable-line no-unused-vars
  // Log full detail server-side only.
  console.error(err);

  // Mongoose duplicate key error (e.g. race condition on unique email)
  if (err.code === 11000) {
    return res.status(409).json({
      success: false,
      message: 'A record with this value already exists.',
    });
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({
      success: false,
      message: messages[0] || 'Invalid input.',
    });
  }

  // Mongoose invalid ObjectId
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: 'Invalid resource identifier.',
    });
  }

  const statusCode = err.statusCode && Number.isInteger(err.statusCode) ? err.statusCode : 500;
  const message = statusCode === 500 ? 'Something went wrong. Please try again later.' : err.message;

  return res.status(statusCode).json({
    success: false,
    message,
  });
}

/**
 * Wraps an async route handler so thrown errors are forwarded to
 * errorHandler instead of crashing the process / hanging the request.
 */
function asyncHandler(fn) {
  return function wrapped(req, res, next) {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

function notFoundHandler(req, res) {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found.`,
  });
}

module.exports = { errorHandler, asyncHandler, notFoundHandler };
