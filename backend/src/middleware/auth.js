const jwt = require('jsonwebtoken');
const { User } = require('../models');
const config = require('../config');
const { logger } = require('../utils/logger');

/**
 * Authentication middleware for JWT tokens
 */
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token required'
      });
    }

    // Verify JWT token
    const decoded = jwt.verify(token, config.JWT_SECRET);
    
    // Find user and check if account is active
    const user = await User.findById(decoded.userId).select('-passwordHash');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token - user not found'
      });
    }

    if (user.status !== 'Active') {
      return res.status(401).json({
        success: false,
        message: 'Account is not active'
      });
    }

    if (user.isLocked) {
      return res.status(401).json({
        success: false,
        message: 'Account is locked'
      });
    }

    // Attach user to request
    req.user = user;
    req.token = token;

    // Update last activity
    await user.updateLastActivity();

    next();
  } catch (error) {
    logger.error('Authentication error:', error.message);

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired'
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Authentication error'
    });
  }
};

/**
 * Optional authentication middleware
 * Attaches user if token is provided, but doesn't require it
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const decoded = jwt.verify(token, config.JWT_SECRET);
      const user = await User.findById(decoded.userId).select('-passwordHash');
      
      if (user && user.status === 'Active' && !user.isLocked) {
        req.user = user;
        req.token = token;
        await user.updateLastActivity();
      }
    }

    next();
  } catch (error) {
    // Continue without authentication for optional auth
    next();
  }
};

/**
 * Role-based authorization middleware
 * @param {string|Array} roles - Required role(s)
 */
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const allowedRoles = Array.isArray(roles) ? roles : [roles];
    
    if (!allowedRoles.includes(req.user.role)) {
      logger.warn(`Access denied for user ${req.user.email} - insufficient role (${req.user.role})`);
      
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions'
      });
    }

    next();
  };
};

/**
 * Permission-based authorization middleware
 * @param {string|Array} permissions - Required permission(s)
 */
const requirePermission = (permissions) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const requiredPermissions = Array.isArray(permissions) ? permissions : [permissions];
    
    const hasPermission = requiredPermissions.some(permission => 
      req.user.hasPermission(permission)
    );

    if (!hasPermission) {
      logger.warn(`Access denied for user ${req.user.email} - missing permissions: ${requiredPermissions.join(', ')}`);
      
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions'
      });
    }

    next();
  };
};

/**
 * Admin-only middleware
 */
const requireAdmin = requireRole('Admin');

/**
 * API key authentication middleware
 */
const authenticateApiKey = async (req, res, next) => {
  try {
    const apiKey = req.headers['x-api-key'];
    
    if (!apiKey) {
      return res.status(401).json({
        success: false,
        message: 'API key required'
      });
    }

    // Hash the provided API key for comparison
    const crypto = require('crypto');
    const hashedKey = crypto.createHash('sha256').update(apiKey).digest('hex');

    // Find API key in database
    const { APIKey } = require('../models');
    const keyDoc = await APIKey.findByHashedKey(hashedKey);

    if (!keyDoc) {
      return res.status(401).json({
        success: false,
        message: 'Invalid API key'
      });
    }

    // Check if key is expired
    if (keyDoc.isExpired()) {
      return res.status(401).json({
        success: false,
        message: 'API key expired'
      });
    }

    // Check IP restrictions
    const clientIP = req.ip || req.connection.remoteAddress;
    if (!keyDoc.isIPAllowed(clientIP)) {
      logger.warn(`API key access denied from IP: ${clientIP}`);
      return res.status(403).json({
        success: false,
        message: 'IP address not allowed'
      });
    }

    // Check rate limits
    const rateLimitStatus = keyDoc.checkRateLimits();
    if (rateLimitStatus.hourlyLimitReached || rateLimitStatus.dailyLimitReached) {
      return res.status(429).json({
        success: false,
        message: 'Rate limit exceeded',
        rateLimits: rateLimitStatus
      });
    }

    // Check endpoint access
    if (!keyDoc.canAccess(req.path, req.method)) {
      return res.status(403).json({
        success: false,
        message: 'Endpoint access denied'
      });
    }

    // Attach API key info to request
    req.apiKey = keyDoc;
    req.user = keyDoc.userId; // API key user
    req.isApiKeyAuth = true;

    // Record usage (don't await to avoid blocking)
    keyDoc.recordUsage({
      endpoint: req.path,
      ipAddress: clientIP,
      userAgent: req.get('User-Agent')
    }).catch(err => {
      logger.error('Error recording API key usage:', err);
    });

    next();
  } catch (error) {
    logger.error('API key authentication error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Authentication error'
    });
  }
};

/**
 * API key permission middleware
 * @param {string|Array} permissions - Required permission(s)
 */
const requireApiPermission = (permissions) => {
  return (req, res, next) => {
    if (!req.apiKey) {
      return res.status(401).json({
        success: false,
        message: 'API key authentication required'
      });
    }

    const requiredPermissions = Array.isArray(permissions) ? permissions : [permissions];
    
    const hasPermission = requiredPermissions.some(permission => 
      req.apiKey.hasPermission(permission)
    );

    if (!hasPermission) {
      logger.warn(`API key access denied - missing permissions: ${requiredPermissions.join(', ')}`);
      
      return res.status(403).json({
        success: false,
        message: 'Insufficient API permissions'
      });
    }

    next();
  };
};

/**
 * Dual authentication middleware (JWT or API key)
 */
const authenticateAny = async (req, res, next) => {
  // Try API key first
  const apiKey = req.headers['x-api-key'];
  if (apiKey) {
    return authenticateApiKey(req, res, next);
  }

  // Fall back to JWT authentication
  return authenticateToken(req, res, next);
};

/**
 * Self-or-admin middleware
 * Allows access if user is accessing their own data or is an admin
 * @param {string} userIdParam - Parameter name containing user ID
 */
const requireSelfOrAdmin = (userIdParam = 'userId') => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const targetUserId = req.params[userIdParam];
    const currentUserId = req.user._id.toString();

    // Allow if admin or accessing own data
    if (req.user.role === 'Admin' || currentUserId === targetUserId) {
      return next();
    }

    return res.status(403).json({
      success: false,
      message: 'Access denied'
    });
  };
};

/**
 * Threat assignment middleware
 * Allows access if user is assigned to threat or has admin/analyst role
 */
const requireThreatAccess = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Admins can access all threats
    if (req.user.role === 'Admin') {
      return next();
    }

    const threatId = req.params.threatId || req.params.id;
    if (!threatId) {
      return res.status(400).json({
        success: false,
        message: 'Threat ID required'
      });
    }

    const { Threat } = require('../models');
    const threat = await Threat.findById(threatId);

    if (!threat) {
      return res.status(404).json({
        success: false,
        message: 'Threat not found'
      });
    }

    // Analysts can access threats assigned to them or unassigned threats
    if (req.user.role === 'Analyst') {
      if (!threat.assignedTo || threat.assignedTo.toString() === req.user._id.toString()) {
        return next();
      }
    }

    // Auditors can only view (not modify) threats
    if (req.user.role === 'Auditor' && req.method === 'GET') {
      return next();
    }

    return res.status(403).json({
      success: false,
      message: 'Insufficient permissions to access this threat'
    });
  } catch (error) {
    logger.error('Threat access check error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Error checking threat access'
    });
  }
};

module.exports = {
  authenticateToken,
  optionalAuth,
  requireRole,
  requirePermission,
  requireAdmin,
  authenticateApiKey,
  requireApiPermission,
  authenticateAny,
  requireSelfOrAdmin,
  requireThreatAccess
};
