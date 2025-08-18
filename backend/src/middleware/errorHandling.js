const { logger, securityLogger, auditLogger } = require('../utils/logger');
const { Log } = require('../models');

/**
 * Global error handling middleware
 */
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error
  logger.error(err);

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = 'Resource not found';
    error = { message, statusCode: 404 };
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const message = 'Duplicate field value entered';
    error = { message, statusCode: 400 };
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message).join(', ');
    error = { message, statusCode: 400 };
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    const message = 'Invalid token';
    error = { message, statusCode: 401 };
  }

  if (err.name === 'TokenExpiredError') {
    const message = 'Token expired';
    error = { message, statusCode: 401 };
  }

  // File upload errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    const message = 'File too large';
    error = { message, statusCode: 413 };
  }

  if (err.code === 'LIMIT_FILE_COUNT') {
    const message = 'Too many files';
    error = { message, statusCode: 413 };
  }

  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    const message = 'Unexpected file field';
    error = { message, statusCode: 400 };
  }

  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || 'Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

/**
 * 404 Not Found handler
 */
const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

/**
 * Async handler wrapper to catch errors in async route handlers
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * Security logging middleware
 */
const securityLogging = (req, res, next) => {
  // Log security-relevant events
  const securityEvents = [
    '/api/auth',
    '/api/users',
    '/api/api-keys',
    '/api/settings'
  ];

  const isSecurityEvent = securityEvents.some(event => req.path.includes(event));
  
  if (isSecurityEvent) {
    securityLogger.info('Security event', {
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      userId: req.user ? req.user._id : null,
      timestamp: new Date().toISOString()
    });
  }

  next();
};

/**
 * Audit logging middleware
 */
const auditLogging = asyncHandler(async (req, res, next) => {
  // Store original res.json to intercept response
  const originalJson = res.json;
  
  res.json = function(data) {
    // Log the audit event
    auditLogger.info('API Request', {
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      userId: req.user ? req.user._id : null,
      apiKey: req.apiKey ? req.apiKey.keyId : null,
      timestamp: new Date().toISOString(),
      responseSuccess: data?.success !== false
    });

    // Create audit log in database for important actions
    const auditableActions = ['POST', 'PUT', 'PATCH', 'DELETE'];
    const auditablePaths = ['/api/threats', '/api/users', '/api/reports', '/api/settings'];
    
    if (auditableActions.includes(req.method) && 
        auditablePaths.some(path => req.path.includes(path))) {
      
      const auditDetails = {
        action: `${req.method} ${req.path}`,
        userId: req.user ? req.user._id : null,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        requestBody: req.body,
        responseStatus: res.statusCode,
        success: data?.success !== false
      };

      // Create log entry (don't await to avoid blocking response)
      Log.create({
        eventType: 'audit_trail_access',
        severity: 'Medium',
        source: 'api',
        details: auditDetails,
        userId: req.user ? req.user._id : null,
        metadata: {
          ipAddress: req.ip,
          userAgent: req.get('User-Agent')
        }
      }).catch(err => {
        logger.error('Failed to create audit log:', err);
      });
    }

    // Call original json method
    return originalJson.call(this, data);
  };

  next();
});

/**
 * Request validation middleware
 */
const validateRequest = (req, res, next) => {
  // Check for common security issues
  const suspiciousPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, // XSS
    /(\b(?:union|select|insert|update|delete|drop|create|alter|exec|execute)\b)/gi, // SQL injection
    /(\.\.\/|\.\.\\)/g, // Path traversal
    /@[\w.-]+\.[a-zA-Z]{2,}/g // Email patterns in unexpected places
  ];

  const checkForThreats = (obj, path = '') => {
    if (typeof obj === 'string') {
      for (const pattern of suspiciousPatterns) {
        if (pattern.test(obj)) {
          securityLogger.warn('Suspicious request pattern detected', {
            pattern: pattern.source,
            value: obj,
            path: path,
            ip: req.ip,
            userAgent: req.get('User-Agent')
          });
          
          return res.status(400).json({
            success: false,
            message: 'Invalid request content detected'
          });
        }
      }
    } else if (typeof obj === 'object' && obj !== null) {
      for (const [key, value] of Object.entries(obj)) {
        const result = checkForThreats(value, `${path}.${key}`);
        if (result) return result;
      }
    }
  };

  // Check request body
  if (req.body) {
    const threatCheck = checkForThreats(req.body, 'body');
    if (threatCheck) return;
  }

  // Check query parameters
  if (req.query) {
    const threatCheck = checkForThreats(req.query, 'query');
    if (threatCheck) return;
  }

  next();
};

/**
 * Request sanitization middleware
 */
const sanitizeRequest = (req, res, next) => {
  const sanitize = (obj) => {
    if (typeof obj === 'string') {
      // Remove null bytes
      obj = obj.replace(/\0/g, '');
      // Trim whitespace
      obj = obj.trim();
      // Limit length
      if (obj.length > 10000) {
        obj = obj.substring(0, 10000);
      }
      return obj;
    } else if (typeof obj === 'object' && obj !== null) {
      const sanitized = {};
      for (const [key, value] of Object.entries(obj)) {
        // Sanitize key names
        const cleanKey = key.replace(/[^\w.-]/g, '').substring(0, 100);
        sanitized[cleanKey] = sanitize(value);
      }
      return sanitized;
    }
    return obj;
  };

  if (req.body) {
    req.body = sanitize(req.body);
  }

  if (req.query) {
    req.query = sanitize(req.query);
  }

  next();
};

/**
 * Response time middleware
 */
const responseTime = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    res.set('X-Response-Time', `${duration}ms`);
    
    // Log slow requests
    if (duration > 5000) { // 5 seconds
      logger.warn('Slow request detected', {
        method: req.method,
        url: req.originalUrl,
        duration: `${duration}ms`,
        ip: req.ip,
        userId: req.user ? req.user._id : null
      });
    }
  });

  next();
};

/**
 * Request size limiter
 */
const requestSizeLimit = (maxSize = 10 * 1024 * 1024) => { // 10MB default
  return (req, res, next) => {
    if (req.headers['content-length'] && 
        parseInt(req.headers['content-length']) > maxSize) {
      return res.status(413).json({
        success: false,
        message: 'Request entity too large'
      });
    }
    next();
  };
};

/**
 * CORS error handler
 */
const corsErrorHandler = (err, req, res, next) => {
  if (err && err.message && err.message.includes('CORS')) {
    return res.status(403).json({
      success: false,
      message: 'CORS policy violation'
    });
  }
  next(err);
};

/**
 * Database connection error handler
 */
const dbErrorHandler = (err, req, res, next) => {
  if (err.name === 'MongooseError' || err.name === 'MongoError') {
    logger.error('Database error:', err);
    return res.status(503).json({
      success: false,
      message: 'Database service temporarily unavailable'
    });
  }
  next(err);
};

/**
 * Graceful shutdown handler
 */
const gracefulShutdown = () => {
  const shutdownHandler = (signal) => {
    logger.info(`Received ${signal}. Starting graceful shutdown...`);
    
    // Close server
    if (global.server) {
      global.server.close(() => {
        logger.info('HTTP server closed');
        
        // Close database connection
        const database = require('../config/database');
        database.disconnect().then(() => {
          logger.info('Database connection closed');
          process.exit(0);
        }).catch((err) => {
          logger.error('Error closing database connection:', err);
          process.exit(1);
        });
      });
    } else {
      process.exit(0);
    }
  };

  process.on('SIGTERM', () => shutdownHandler('SIGTERM'));
  process.on('SIGINT', () => shutdownHandler('SIGINT'));
};

module.exports = {
  errorHandler,
  notFound,
  asyncHandler,
  securityLogging,
  auditLogging,
  validateRequest,
  sanitizeRequest,
  responseTime,
  requestSizeLimit,
  corsErrorHandler,
  dbErrorHandler,
  gracefulShutdown
};
