const Joi = require('joi');

/**
 * Validation schemas for API requests
 */
const ValidationSchemas = {
  // User validation schemas
  userRegistration: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(8).pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*])')).required()
      .messages({
        'string.pattern.base': 'Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character'
      }),
    walletAddress: Joi.string().pattern(new RegExp('^0x[a-fA-F0-9]{40}$')).optional(),
    role: Joi.string().valid('Admin', 'Analyst', 'Auditor').default('Analyst')
  }),

  userLogin: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
  }),

  walletLogin: Joi.object({
    walletAddress: Joi.string().pattern(new RegExp('^0x[a-fA-F0-9]{40}$')).required(),
    signature: Joi.string().required(),
    nonce: Joi.string().required()
  }),

  userUpdate: Joi.object({
    email: Joi.string().email().optional(),
    walletAddress: Joi.string().pattern(new RegExp('^0x[a-fA-F0-9]{40}$')).optional(),
    role: Joi.string().valid('Admin', 'Analyst', 'Auditor').optional(),
    status: Joi.string().valid('Active', 'Inactive', 'Banned').optional(),
    permissions: Joi.array().items(Joi.string()).optional()
  }),

  // Log validation schemas
  logCreation: Joi.object({
    eventType: Joi.string().valid(
      'user_login', 'user_logout', 'user_registration', 'api_access', 
      'firewall_alert', 'intrusion_attempt', 'data_access', 'config_change',
      'threat_detected', 'threat_resolved', 'report_generated'
    ).required(),
    userId: Joi.string().optional(),
    walletAddress: Joi.string().pattern(new RegExp('^0x[a-fA-F0-9]{40}$')).optional(),
    details: Joi.object().required(),
    severity: Joi.string().valid('Low', 'Medium', 'High', 'Critical').default('Medium'),
    source: Joi.string().required(),
    ipAddress: Joi.string().ip().optional(),
    userAgent: Joi.string().optional()
  }),

  // Threat validation schemas
  threatCreation: Joi.object({
    type: Joi.string().valid(
      'Brute Force Attack', 'SQL Injection', 'XSS Attack', 'DDoS Attack',
      'Malware Detection', 'Unauthorized Access', 'Data Breach', 'Anomalous Behavior',
      'Phishing Attempt', 'Insider Threat'
    ).required(),
    severity: Joi.string().valid('Low', 'Medium', 'High', 'Critical').required(),
    logRefs: Joi.array().items(Joi.string().hex().length(24)).required(),
    description: Joi.string().required(),
    affectedAssets: Joi.array().items(Joi.string()).optional(),
    assignedTo: Joi.string().hex().length(24).optional()
  }),

  threatUpdate: Joi.object({
    status: Joi.string().valid('Active', 'Investigating', 'Resolved', 'False Positive').optional(),
    assignedTo: Joi.string().hex().length(24).optional(),
    comments: Joi.string().optional(),
    resolution: Joi.string().optional(),
    severity: Joi.string().valid('Low', 'Medium', 'High', 'Critical').optional()
  }),

  // Alert validation schemas
  alertCreation: Joi.object({
    type: Joi.string().valid('Security', 'System', 'Compliance', 'Performance').required(),
    severity: Joi.string().valid('Low', 'Medium', 'High', 'Critical').required(),
    message: Joi.string().required(),
    relatedThreatId: Joi.string().hex().length(24).optional(),
    targetUsers: Joi.array().items(Joi.string().hex().length(24)).optional(),
    channels: Joi.array().items(Joi.string().valid('email', 'sms', 'push', 'webhook')).default(['push'])
  }),

  // Report validation schemas
  reportGeneration: Joi.object({
    reportType: Joi.string().valid('Security Summary', 'Threat Analysis', 'Compliance Report', 'Audit Trail', 'Custom').required(),
    dateRange: Joi.object({
      startDate: Joi.date().required(),
      endDate: Joi.date().min(Joi.ref('startDate')).required()
    }).required(),
    filters: Joi.object({
      severity: Joi.array().items(Joi.string().valid('Low', 'Medium', 'High', 'Critical')).optional(),
      eventTypes: Joi.array().items(Joi.string()).optional(),
      userIds: Joi.array().items(Joi.string().hex().length(24)).optional(),
      threatTypes: Joi.array().items(Joi.string()).optional()
    }).optional(),
    format: Joi.string().valid('PDF', 'CSV', 'JSON').default('PDF')
  }),

  // API Key validation schemas
  apiKeyCreation: Joi.object({
    name: Joi.string().required(),
    permissions: Joi.array().items(Joi.string().valid(
      'read:logs', 'write:logs', 'read:threats', 'write:threats',
      'read:users', 'write:users', 'read:reports', 'generate:reports',
      'read:alerts', 'write:alerts'
    )).required(),
    expiresAt: Joi.date().min('now').optional()
  }),

  // Settings validation schemas
  userSettings: Joi.object({
    notifications: Joi.object({
      email: Joi.boolean().default(true),
      sms: Joi.boolean().default(false),
      push: Joi.boolean().default(true),
      webhook: Joi.boolean().default(false)
    }).optional(),
    alertPreferences: Joi.object({
      minimumSeverity: Joi.string().valid('Low', 'Medium', 'High', 'Critical').default('Medium'),
      threatTypes: Joi.array().items(Joi.string()).optional(),
      scheduleReports: Joi.boolean().default(false),
      reportFrequency: Joi.string().valid('Daily', 'Weekly', 'Monthly').optional()
    }).optional(),
    webhookUrl: Joi.string().uri().optional(),
    slackWebhook: Joi.string().uri().optional()
  }),

  // Common validation schemas
  pagination: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    sortBy: Joi.string().optional(),
    sortOrder: Joi.string().valid('asc', 'desc').default('desc')
  }),

  dateRange: Joi.object({
    startDate: Joi.date().required(),
    endDate: Joi.date().min(Joi.ref('startDate')).required()
  }),

  mongoId: Joi.string().hex().length(24),

  // File upload validation
  fileUpload: Joi.object({
    fieldname: Joi.string().required(),
    originalname: Joi.string().required(),
    encoding: Joi.string().required(),
    mimetype: Joi.string().valid(
      'text/csv', 'application/json', 'text/plain',
      'application/pdf', 'image/jpeg', 'image/png'
    ).required(),
    size: Joi.number().max(10 * 1024 * 1024).required() // 10MB max
  })
};

/**
 * Validation middleware factory
 * @param {Object} schema - Joi validation schema
 * @param {string} source - Request source ('body', 'query', 'params')
 * @returns {Function} Express middleware
 */
const validate = (schema, source = 'body') => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[source], {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors
      });
    }

    req[source] = value;
    next();
  };
};

/**
 * Custom validation functions
 */
const customValidations = {
  /**
   * Validate Ethereum signature
   * @param {string} message - Original message
   * @param {string} signature - Signature to validate
   * @param {string} address - Ethereum address
   * @returns {boolean} Validation result
   */
  validateEthereumSignature: (message, signature, address) => {
    // This would integrate with ethers.js in a real implementation
    // For now, return true for demo purposes
    return true;
  },

  /**
   * Validate IP address
   * @param {string} ip - IP address to validate
   * @returns {boolean} Validation result
   */
  validateIP: (ip) => {
    const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    const ipv6Regex = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
    return ipv4Regex.test(ip) || ipv6Regex.test(ip);
  },

  /**
   * Validate API key format
   * @param {string} apiKey - API key to validate
   * @returns {boolean} Validation result
   */
  validateApiKey: (apiKey) => {
    return /^cs_[a-fA-F0-9]{64}$/.test(apiKey);
  }
};

module.exports = {
  ValidationSchemas,
  validate,
  customValidations
};
