/**
 * Error Handler Middleware
 * Centralized error handling for the application
 */

// Handle 404 errors for routes not found
const notFound = (req, res, next) => {
  const error = new Error(`Route not found - ${req.originalUrl}`);
  error.status = 404;
  next(error);
};

// Global error handler
const errorHandler = (err, req, res, next) => {
  // Default to 500 server error
  let statusCode = err.status || err.statusCode || 500;
  let message = err.message || 'Internal Server Error';

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    statusCode = 400;
    message = 'Invalid resource ID format';
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    statusCode = 400;
    const field = Object.keys(err.keyValue)[0];
    message = `Duplicate value for field: ${field}`;
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    statusCode = 400;
    const errors = Object.values(err.errors).map(error => error.message);
    message = `Validation Error: ${errors.join(', ')}`;
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
  }

  // Log error in development
  if (process.env.NODE_ENV === 'development') {
    console.error('Error Details:', {
      message: err.message,
      stack: err.stack,
      statusCode,
      path: req.path,
      method: req.method,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });
  }

  // Send error response
  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && {
      stack: err.stack,
      error: err
    }),
    timestamp: new Date().toISOString(),
    path: req.path,
    method: req.method
  });
};

// Async error handler wrapper
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

module.exports = {
  notFound,
  errorHandler,
  asyncHandler
};
