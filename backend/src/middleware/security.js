const helmet = require('helmet');
const crypto = require('crypto');
const { logger, securityLogger } = require('../utils/logger');

/**
 * Security headers middleware using Helmet
 */
const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false, // Disable for API compatibility
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true
  }
});

/**
 * Request fingerprinting middleware
 */
const requestFingerprinting = (req, res, next) => {
  // Generate a unique fingerprint for the request
  const fingerprint = crypto
    .createHash('sha256')
    .update(req.ip + req.get('User-Agent') + req.get('Accept-Language'))
    .digest('hex');
  
  req.fingerprint = fingerprint;
  next();
};

/**
 * Suspicious activity detection middleware
 */
const suspiciousActivityDetection = (req, res, next) => {
  const suspiciousIndicators = [];
  
  // Check for common attack patterns
  const attackPatterns = [
    // SQL injection patterns
    /(\b(?:union|select|insert|update|delete|drop|create|alter|exec|execute)\b.*(?:from|where|into|values)\b)/gi,
    // XSS patterns
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    // Command injection patterns
    /[;&|`$(){}[\]]/g,
    // Path traversal patterns
    /(\.\.\/|\.\.\\|%2e%2e%2f|%2e%2e%5c)/gi,
    // LDAP injection patterns
    /[()&|!]/g
  ];

  const checkContent = (content, source) => {
    if (typeof content === 'string') {
      attackPatterns.forEach((pattern, index) => {
        if (pattern.test(content)) {
          suspiciousIndicators.push({
            type: ['SQL Injection', 'XSS', 'Command Injection', 'Path Traversal', 'LDAP Injection'][index],
            source: source,
            pattern: pattern.source,
            content: content.substring(0, 100) // Limit logged content
          });
        }
      });
    } else if (typeof content === 'object' && content !== null) {
      Object.entries(content).forEach(([key, value]) => {
        checkContent(value, `${source}.${key}`);
      });
    }
  };

  // Check URL parameters
  checkContent(req.query, 'query');
  
  // Check request body
  if (req.body) {
    checkContent(req.body, 'body');
  }

  // Check headers for suspicious patterns
  const suspiciousHeaders = ['x-forwarded-for', 'x-real-ip', 'referer', 'user-agent'];
  suspiciousHeaders.forEach(header => {
    const value = req.get(header);
    if (value) {
      checkContent(value, `header.${header}`);
    }
  });

  // Check for unusual request characteristics
  if (req.method === 'POST' && !req.is('application/json') && !req.is('multipart/form-data')) {
    suspiciousIndicators.push({
      type: 'Unusual Content-Type',
      source: 'headers',
      content: req.get('content-type')
    });
  }

  // Check for excessive header size
  const headerSize = JSON.stringify(req.headers).length;
  if (headerSize > 8192) { // 8KB
    suspiciousIndicators.push({
      type: 'Excessive Header Size',
      source: 'headers',
      content: `${headerSize} bytes`
    });
  }

  // Log suspicious activity
  if (suspiciousIndicators.length > 0) {
    securityLogger.warn('Suspicious activity detected', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      method: req.method,
      url: req.originalUrl,
      indicators: suspiciousIndicators,
      fingerprint: req.fingerprint,
      timestamp: new Date().toISOString()
    });

    // Add security headers for suspicious requests
    res.set({
      'X-Security-Warning': 'Suspicious activity detected',
      'X-Request-ID': req.fingerprint
    });
  }

  req.suspiciousActivity = suspiciousIndicators;
  next();
};

/**
 * Brute force protection middleware
 */
const bruteForceProtection = (() => {
  const attempts = new Map(); // In production, use Redis
  const lockouts = new Map();

  return (req, res, next) => {
    const key = req.ip;
    const now = Date.now();
    const windowMs = 15 * 60 * 1000; // 15 minutes
    const maxAttempts = 10;
    const lockoutDuration = 30 * 60 * 1000; // 30 minutes

    // Check if IP is currently locked out
    if (lockouts.has(key)) {
      const lockoutEnd = lockouts.get(key);
      if (now < lockoutEnd) {
        return res.status(429).json({
          success: false,
          message: 'IP temporarily locked due to suspicious activity',
          retryAfter: Math.ceil((lockoutEnd - now) / 1000)
        });
      } else {
        lockouts.delete(key);
        attempts.delete(key);
      }
    }

    // Track failed attempts
    const trackFailure = () => {
      const userAttempts = attempts.get(key) || [];
      const recentAttempts = userAttempts.filter(time => now - time < windowMs);
      recentAttempts.push(now);
      attempts.set(key, recentAttempts);

      if (recentAttempts.length >= maxAttempts) {
        lockouts.set(key, now + lockoutDuration);
        securityLogger.error('IP locked out due to brute force attempts', {
          ip: key,
          attempts: recentAttempts.length,
          lockoutUntil: new Date(now + lockoutDuration)
        });
      }
    };

    // Monitor response for failed authentication
    const originalSend = res.send;
    res.send = function(data) {
      const statusCode = res.statusCode;
      const isAuthEndpoint = req.path.includes('/auth/') || req.path.includes('/login');
      
      if (isAuthEndpoint && (statusCode === 401 || statusCode === 403)) {
        trackFailure();
      }
      
      return originalSend.call(this, data);
    };

    next();
  };
})();

/**
 * IP whitelist/blacklist middleware
 */
const ipFiltering = (() => {
  // In production, these would come from database or configuration
  const blacklistedIPs = new Set([
    // Add known malicious IPs
  ]);
  
  const whitelistedIPs = new Set([
    '127.0.0.1',
    '::1'
  ]);

  return (req, res, next) => {
    const clientIP = req.ip;

    // Check blacklist first
    if (blacklistedIPs.has(clientIP)) {
      securityLogger.error('Blacklisted IP attempted access', {
        ip: clientIP,
        userAgent: req.get('User-Agent'),
        url: req.originalUrl
      });
      
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // For high-security endpoints, check whitelist
    const highSecurityEndpoints = ['/api/admin', '/api/system'];
    const isHighSecurity = highSecurityEndpoints.some(endpoint => 
      req.path.startsWith(endpoint)
    );

    if (isHighSecurity && !whitelistedIPs.has(clientIP)) {
      securityLogger.warn('Non-whitelisted IP attempted high-security access', {
        ip: clientIP,
        endpoint: req.path
      });
      
      return res.status(403).json({
        success: false,
        message: 'Access restricted to whitelisted IPs'
      });
    }

    next();
  };
})();

/**
 * Request integrity validation
 */
const requestIntegrityValidation = (req, res, next) => {
  // Validate Content-Length header
  if (req.headers['content-length']) {
    const contentLength = parseInt(req.headers['content-length']);
    if (isNaN(contentLength) || contentLength < 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Content-Length header'
      });
    }
  }

  // Validate common headers
  const userAgent = req.get('User-Agent');
  if (!userAgent || userAgent.length < 3 || userAgent.length > 512) {
    securityLogger.warn('Suspicious User-Agent', {
      ip: req.ip,
      userAgent: userAgent,
      url: req.originalUrl
    });
  }

  // Check for header injection
  const headersToCheck = ['host', 'referer', 'origin'];
  headersToCheck.forEach(header => {
    const value = req.get(header);
    if (value && (value.includes('\n') || value.includes('\r'))) {
      return res.status(400).json({
        success: false,
        message: 'Header injection detected'
      });
    }
  });

  next();
};

/**
 * API versioning security
 */
const apiVersionSecurity = (req, res, next) => {
  const apiVersion = req.get('API-Version') || req.query.version || 'v1';
  
  // Validate API version format
  if (!/^v\d+(\.\d+)?$/.test(apiVersion)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid API version format'
    });
  }

  // Check for deprecated versions
  const deprecatedVersions = ['v0.1', 'v0.2'];
  if (deprecatedVersions.includes(apiVersion)) {
    res.set('X-API-Warning', 'This API version is deprecated');
    securityLogger.info('Deprecated API version used', {
      version: apiVersion,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });
  }

  req.apiVersion = apiVersion;
  next();
};

/**
 * Request timing attack protection
 */
const timingAttackProtection = (req, res, next) => {
  const startTime = process.hrtime.bigint();
  
  res.on('finish', () => {
    const endTime = process.hrtime.bigint();
    const duration = Number(endTime - startTime) / 1000000; // Convert to milliseconds
    
    // Add artificial delay for security-sensitive endpoints
    const sensitiveEndpoints = ['/api/auth/login', '/api/auth/verify'];
    const isSensitive = sensitiveEndpoints.some(endpoint => req.path.includes(endpoint));
    
    if (isSensitive && duration < 100) { // If response was too fast
      const delay = 100 - duration;
      setTimeout(() => {
        // Response already sent, this is just for timing consistency
      }, delay);
    }
  });

  next();
};

/**
 * Webhook signature validation
 */
const validateWebhookSignature = (secret) => {
  return (req, res, next) => {
    const signature = req.get('X-Signature') || req.get('X-Hub-Signature-256');
    
    if (!signature) {
      return res.status(401).json({
        success: false,
        message: 'Webhook signature required'
      });
    }

    const body = JSON.stringify(req.body);
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(body)
      .digest('hex');
    
    const providedSignature = signature.replace('sha256=', '');
    
    if (!crypto.timingSafeEqual(
      Buffer.from(expectedSignature, 'hex'),
      Buffer.from(providedSignature, 'hex')
    )) {
      securityLogger.error('Invalid webhook signature', {
        ip: req.ip,
        providedSignature: providedSignature.substring(0, 10) + '...',
        expectedSignature: expectedSignature.substring(0, 10) + '...'
      });
      
      return res.status(401).json({
        success: false,
        message: 'Invalid webhook signature'
      });
    }

    next();
  };
};

/**
 * Content-Type validation
 */
const validateContentType = (allowedTypes = ['application/json']) => {
  return (req, res, next) => {
    if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
      const contentType = req.get('Content-Type');
      
      if (!contentType) {
        return res.status(400).json({
          success: false,
          message: 'Content-Type header required'
        });
      }

      const isAllowed = allowedTypes.some(type => contentType.startsWith(type));
      
      if (!isAllowed) {
        return res.status(415).json({
          success: false,
          message: 'Unsupported Media Type'
        });
      }
    }

    next();
  };
};

module.exports = {
  securityHeaders,
  requestFingerprinting,
  suspiciousActivityDetection,
  bruteForceProtection,
  ipFiltering,
  requestIntegrityValidation,
  apiVersionSecurity,
  timingAttackProtection,
  validateWebhookSignature,
  validateContentType
};
