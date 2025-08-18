const rateLimit = require('express-rate-limit');
const config = require('../config');
const { logger } = require('../utils/logger');

/**
 * General API rate limiter
 */
const generalLimiter = rateLimit({
  windowMs: config.RATE_LIMIT_WINDOW_MS, // 15 minutes
  max: config.RATE_LIMIT_MAX_REQUESTS, // 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later',
    retryAfter: Math.ceil(config.RATE_LIMIT_WINDOW_MS / 1000)
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  keyGenerator: (req) => {
    // Use API key if available, otherwise IP address
    return req.headers['x-api-key'] || req.ip;
  },
  onLimitReached: (req, res) => {
    logger.warn(`Rate limit exceeded for ${req.ip} - ${req.method} ${req.path}`);
  }
});

/**
 * Strict rate limiter for authentication endpoints
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 attempts per windowMs
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later',
    retryAfter: 900 // 15 minutes
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful requests
  onLimitReached: (req, res) => {
    logger.warn(`Auth rate limit exceeded for ${req.ip} - ${req.method} ${req.path}`);
  }
});

/**
 * Password reset rate limiter
 */
const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 attempts per hour
  message: {
    success: false,
    message: 'Too many password reset attempts, please try again later',
    retryAfter: 3600 // 1 hour
  },
  standardHeaders: true,
  legacyHeaders: false,
  onLimitReached: (req, res) => {
    logger.warn(`Password reset rate limit exceeded for ${req.ip}`);
  }
});

/**
 * File upload rate limiter
 */
const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // 20 uploads per windowMs
  message: {
    success: false,
    message: 'Too many upload attempts, please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false,
  onLimitReached: (req, res) => {
    logger.warn(`Upload rate limit exceeded for ${req.ip}`);
  }
});

/**
 * Report generation rate limiter
 */
const reportGenerationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 reports per hour
  message: {
    success: false,
    message: 'Too many report generation requests, please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Use user ID for authenticated requests
    return req.user ? req.user._id.toString() : req.ip;
  },
  onLimitReached: (req, res) => {
    const identifier = req.user ? req.user.email : req.ip;
    logger.warn(`Report generation rate limit exceeded for ${identifier}`);
  }
});

/**
 * API key creation rate limiter
 */
const apiKeyCreationLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: 5, // 5 API keys per day
  message: {
    success: false,
    message: 'Too many API key creation attempts, please try again tomorrow'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.user ? req.user._id.toString() : req.ip;
  },
  onLimitReached: (req, res) => {
    const identifier = req.user ? req.user.email : req.ip;
    logger.warn(`API key creation rate limit exceeded for ${identifier}`);
  }
});

/**
 * Search and query rate limiter
 */
const searchLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 searches per minute
  message: {
    success: false,
    message: 'Too many search requests, please slow down'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.user ? req.user._id.toString() : req.ip;
  },
  onLimitReached: (req, res) => {
    const identifier = req.user ? req.user.email : req.ip;
    logger.warn(`Search rate limit exceeded for ${identifier}`);
  }
});

/**
 * Webhook endpoint rate limiter
 */
const webhookLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 webhooks per minute
  message: {
    success: false,
    message: 'Webhook rate limit exceeded'
  },
  standardHeaders: true,
  legacyHeaders: false,
  onLimitReached: (req, res) => {
    logger.warn(`Webhook rate limit exceeded for ${req.ip}`);
  }
});

/**
 * Dynamic rate limiter based on user role
 */
const dynamicLimiter = (req, res, next) => {
  let maxRequests = 100; // Default for unauthenticated
  let windowMs = 15 * 60 * 1000; // 15 minutes

  if (req.user) {
    switch (req.user.role) {
      case 'Admin':
        maxRequests = 1000;
        break;
      case 'Analyst':
        maxRequests = 500;
        break;
      case 'Auditor':
        maxRequests = 200;
        break;
      default:
        maxRequests = 100;
    }
  }

  const limiter = rateLimit({
    windowMs,
    max: maxRequests,
    message: {
      success: false,
      message: 'Rate limit exceeded for your user role'
    },
    keyGenerator: (req) => {
      return req.user ? req.user._id.toString() : req.ip;
    },
    onLimitReached: (req, res) => {
      const identifier = req.user ? `${req.user.email} (${req.user.role})` : req.ip;
      logger.warn(`Dynamic rate limit exceeded for ${identifier}`);
    }
  });

  limiter(req, res, next);
};

/**
 * Per-endpoint rate limiters
 */
const endpointLimiters = {
  // Critical security endpoints
  login: authLimiter,
  register: authLimiter,
  'forgot-password': passwordResetLimiter,
  'reset-password': passwordResetLimiter,
  'verify-email': authLimiter,
  
  // Resource-intensive endpoints
  'generate-report': reportGenerationLimiter,
  'create-api-key': apiKeyCreationLimiter,
  'upload': uploadLimiter,
  'search': searchLimiter,
  
  // External-facing endpoints
  'webhook': webhookLimiter,
  
  // General API
  'api': generalLimiter
};

/**
 * Get appropriate rate limiter for endpoint
 * @param {string} endpoint - Endpoint path
 * @returns {Function} Rate limiter middleware
 */
const getLimiterForEndpoint = (endpoint) => {
  // Check for specific endpoint limiters
  for (const [path, limiter] of Object.entries(endpointLimiters)) {
    if (endpoint.includes(path)) {
      return limiter;
    }
  }
  
  // Default to general limiter
  return generalLimiter;
};

/**
 * Middleware to apply rate limiting based on endpoint
 */
const smartRateLimiter = (req, res, next) => {
  const endpoint = req.path.toLowerCase();
  const limiter = getLimiterForEndpoint(endpoint);
  limiter(req, res, next);
};

/**
 * IP-based rate limiter for suspicious activity
 */
const suspiciousActivityLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 50, // 50 requests per 5 minutes
  message: {
    success: false,
    message: 'Suspicious activity detected, access temporarily restricted'
  },
  standardHeaders: true,
  legacyHeaders: false,
  onLimitReached: (req, res) => {
    logger.error(`Suspicious activity detected from ${req.ip} - temporarily restricted`);
  }
});

/**
 * Custom rate limiter for API keys
 */
const apiKeyRateLimiter = async (req, res, next) => {
  if (!req.apiKey) {
    return next();
  }

  try {
    const rateLimitStatus = req.apiKey.checkRateLimits();
    
    if (rateLimitStatus.hourlyLimitReached) {
      return res.status(429).json({
        success: false,
        message: 'Hourly rate limit exceeded for API key',
        rateLimits: rateLimitStatus
      });
    }

    if (rateLimitStatus.dailyLimitReached) {
      return res.status(429).json({
        success: false,
        message: 'Daily rate limit exceeded for API key',
        rateLimits: rateLimitStatus
      });
    }

    // Add rate limit info to response headers
    res.set({
      'X-RateLimit-Limit-Hourly': req.apiKey.restrictions.maxRequestsPerHour,
      'X-RateLimit-Remaining-Hourly': rateLimitStatus.remainingHourly,
      'X-RateLimit-Limit-Daily': req.apiKey.restrictions.maxRequestsPerDay,
      'X-RateLimit-Remaining-Daily': rateLimitStatus.remainingDaily
    });

    next();
  } catch (error) {
    logger.error('API key rate limiting error:', error.message);
    next(); // Continue on error
  }
};

module.exports = {
  generalLimiter,
  authLimiter,
  passwordResetLimiter,
  uploadLimiter,
  reportGenerationLimiter,
  apiKeyCreationLimiter,
  searchLimiter,
  webhookLimiter,
  dynamicLimiter,
  smartRateLimiter,
  suspiciousActivityLimiter,
  apiKeyRateLimiter,
  getLimiterForEndpoint
};
