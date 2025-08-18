const mongoose = require('mongoose');

/**
 * API Key Model Schema
 * Manages API keys for external access
 */
const apiKeySchema = new mongoose.Schema({
  // API Key identification
  keyId: {
    type: String,
    unique: true,
    required: true,
    index: true
  },

  // Hashed API key (never store raw keys)
  hashedKey: {
    type: String,
    required: true,
    unique: true
  },

  // Key metadata
  name: {
    type: String,
    required: true,
    trim: true
  },

  description: String,

  // Owner information
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },

  // Permissions and scopes
  permissions: [{
    type: String,
    enum: [
      'read:logs', 'write:logs', 'delete:logs',
      'read:threats', 'write:threats', 'resolve:threats',
      'read:users', 'write:users', 'delete:users',
      'read:reports', 'generate:reports', 'delete:reports',
      'read:alerts', 'write:alerts', 'delete:alerts',
      'read:settings', 'write:settings',
      'webhook:receive', 'webhook:send',
      'admin:all'
    ]
  }],

  scopes: [{
    resource: String,
    actions: [String],
    filters: mongoose.Schema.Types.Mixed
  }],

  // Access restrictions
  restrictions: {
    ipWhitelist: [String],
    ipBlacklist: [String],
    allowedOrigins: [String],
    maxRequestsPerHour: {
      type: Number,
      default: 1000
    },
    maxRequestsPerDay: {
      type: Number,
      default: 10000
    },
    allowedMethods: {
      type: [String],
      default: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']
    },
    allowedEndpoints: [String],
    deniedEndpoints: [String]
  },

  // Key status and lifecycle
  status: {
    type: String,
    enum: ['Active', 'Inactive', 'Suspended', 'Revoked'],
    default: 'Active',
    index: true
  },

  // Expiration
  expiresAt: {
    type: Date,
    index: true
  },

  // Usage tracking
  usage: {
    totalRequests: {
      type: Number,
      default: 0
    },
    lastUsed: Date,
    lastUsedEndpoint: String,
    lastUsedIP: String,
    lastUsedUserAgent: String,
    requestsToday: {
      type: Number,
      default: 0
    },
    requestsThisHour: {
      type: Number,
      default: 0
    },
    lastResetDaily: {
      type: Date,
      default: Date.now
    },
    lastResetHourly: {
      type: Date,
      default: Date.now
    },
    averageResponseTime: Number,
    errorCount: {
      type: Number,
      default: 0
    },
    successCount: {
      type: Number,
      default: 0
    }
  },

  // Security settings
  security: {
    requireHTTPS: {
      type: Boolean,
      default: true
    },
    requireValidUserAgent: {
      type: Boolean,
      default: false
    },
    rateLimitByKey: {
      type: Boolean,
      default: true
    },
    logAllRequests: {
      type: Boolean,
      default: true
    },
    alertOnSuspiciousActivity: {
      type: Boolean,
      default: true
    },
    autoSuspendOnAbuse: {
      type: Boolean,
      default: true
    },
    maxConcurrentRequests: {
      type: Number,
      default: 10
    }
  },

  // Environment and deployment
  environment: {
    type: String,
    enum: ['Development', 'Staging', 'Production'],
    default: 'Development'
  },

  // Associated services
  services: [{
    name: String,
    version: String,
    endpoint: String,
    enabled: {
      type: Boolean,
      default: true
    }
  }],

  // Webhook configurations
  webhooks: [{
    url: String,
    events: [String],
    secret: String,
    enabled: {
      type: Boolean,
      default: true
    },
    retryCount: {
      type: Number,
      default: 3
    },
    timeout: {
      type: Number,
      default: 30000
    }
  }],

  // Rotation and security
  rotation: {
    lastRotated: Date,
    rotationInterval: {
      type: Number, // days
      default: 90
    },
    autoRotate: {
      type: Boolean,
      default: false
    },
    notifyBeforeExpiry: {
      type: Number, // days
      default: 7
    },
    previousKeys: [{
      hashedKey: String,
      revokedAt: Date,
      reason: String
    }]
  },

  // Tags and metadata
  tags: [String],
  metadata: mongoose.Schema.Types.Mixed,

  // Audit trail
  auditLog: [{
    timestamp: {
      type: Date,
      default: Date.now
    },
    action: {
      type: String,
      enum: ['Created', 'Updated', 'Used', 'Suspended', 'Revoked', 'Rotated', 'Activated']
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    details: String,
    ipAddress: String,
    userAgent: String
  }]
}, {
  timestamps: true
});

// Indexes for performance
apiKeySchema.index({ userId: 1, status: 1 });
apiKeySchema.index({ expiresAt: 1 });
apiKeySchema.index({ 'usage.lastUsed': -1 });
apiKeySchema.index({ environment: 1, status: 1 });
apiKeySchema.index({ tags: 1 });

// TTL index for automatic cleanup of revoked keys
apiKeySchema.index({ 
  'auditLog.timestamp': 1 
}, { 
  expireAfterSeconds: 365 * 24 * 60 * 60, // 1 year
  partialFilterExpression: { status: 'Revoked' }
});

// Pre-save middleware to generate keyId
apiKeySchema.pre('save', function(next) {
  if (this.isNew && !this.keyId) {
    const crypto = require('crypto');
    this.keyId = crypto.randomBytes(16).toString('hex');
  }
  next();
});

// Pre-save middleware to track changes
apiKeySchema.pre('save', function(next) {
  if (this.isModified('status') && !this.isNew) {
    this.auditLog.push({
      action: this.status === 'Active' ? 'Activated' :
              this.status === 'Suspended' ? 'Suspended' :
              this.status === 'Revoked' ? 'Revoked' : 'Updated',
      details: `Status changed to ${this.status}`
    });
  }
  next();
});

// Instance methods
apiKeySchema.methods = {
  /**
   * Check if API key has permission
   * @param {string} permission - Permission to check
   * @returns {boolean} Has permission
   */
  hasPermission(permission) {
    return this.permissions.includes(permission) || this.permissions.includes('admin:all');
  },

  /**
   * Check if API key can access endpoint
   * @param {string} endpoint - Endpoint to check
   * @param {string} method - HTTP method
   * @returns {boolean} Can access
   */
  canAccess(endpoint, method) {
    // Check if method is allowed
    if (!this.restrictions.allowedMethods.includes(method)) {
      return false;
    }

    // Check denied endpoints
    if (this.restrictions.deniedEndpoints && 
        this.restrictions.deniedEndpoints.some(denied => endpoint.startsWith(denied))) {
      return false;
    }

    // Check allowed endpoints (if specified)
    if (this.restrictions.allowedEndpoints && this.restrictions.allowedEndpoints.length > 0) {
      return this.restrictions.allowedEndpoints.some(allowed => endpoint.startsWith(allowed));
    }

    return true;
  },

  /**
   * Check if IP is allowed
   * @param {string} ipAddress - IP address to check
   * @returns {boolean} IP allowed
   */
  isIPAllowed(ipAddress) {
    // Check blacklist first
    if (this.restrictions.ipBlacklist && this.restrictions.ipBlacklist.includes(ipAddress)) {
      return false;
    }

    // Check whitelist (if specified)
    if (this.restrictions.ipWhitelist && this.restrictions.ipWhitelist.length > 0) {
      return this.restrictions.ipWhitelist.includes(ipAddress);
    }

    return true;
  },

  /**
   * Check rate limits
   * @returns {Object} Rate limit status
   */
  checkRateLimits() {
    const now = new Date();
    const hourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Reset counters if needed
    if (this.usage.lastResetHourly < hourAgo) {
      this.usage.requestsThisHour = 0;
      this.usage.lastResetHourly = now;
    }

    if (this.usage.lastResetDaily < dayAgo) {
      this.usage.requestsToday = 0;
      this.usage.lastResetDaily = now;
    }

    return {
      hourlyLimitReached: this.usage.requestsThisHour >= this.restrictions.maxRequestsPerHour,
      dailyLimitReached: this.usage.requestsToday >= this.restrictions.maxRequestsPerDay,
      remainingHourly: Math.max(0, this.restrictions.maxRequestsPerHour - this.usage.requestsThisHour),
      remainingDaily: Math.max(0, this.restrictions.maxRequestsPerDay - this.usage.requestsToday)
    };
  },

  /**
   * Record API usage
   * @param {Object} requestInfo - Request information
   * @returns {Promise<void>}
   */
  async recordUsage(requestInfo) {
    const {
      endpoint,
      ipAddress,
      userAgent,
      responseTime,
      success = true
    } = requestInfo;

    // Update usage statistics
    this.usage.totalRequests += 1;
    this.usage.requestsThisHour += 1;
    this.usage.requestsToday += 1;
    this.usage.lastUsed = new Date();
    this.usage.lastUsedEndpoint = endpoint;
    this.usage.lastUsedIP = ipAddress;
    this.usage.lastUsedUserAgent = userAgent;

    if (success) {
      this.usage.successCount += 1;
    } else {
      this.usage.errorCount += 1;
    }

    // Update average response time
    if (responseTime) {
      if (this.usage.averageResponseTime) {
        this.usage.averageResponseTime = 
          (this.usage.averageResponseTime + responseTime) / 2;
      } else {
        this.usage.averageResponseTime = responseTime;
      }
    }

    // Add audit log entry
    this.auditLog.push({
      action: 'Used',
      details: `API called: ${endpoint}`,
      ipAddress,
      userAgent
    });

    // Keep audit log size manageable
    if (this.auditLog.length > 1000) {
      this.auditLog = this.auditLog.slice(-500);
    }

    return this.save();
  },

  /**
   * Suspend the API key
   * @param {string} reason - Suspension reason
   * @param {string} performedBy - User performing action
   * @returns {Promise<void>}
   */
  async suspend(reason, performedBy) {
    this.status = 'Suspended';
    this.auditLog.push({
      action: 'Suspended',
      performedBy,
      details: reason
    });
    return this.save();
  },

  /**
   * Revoke the API key
   * @param {string} reason - Revocation reason
   * @param {string} performedBy - User performing action
   * @returns {Promise<void>}
   */
  async revoke(reason, performedBy) {
    this.status = 'Revoked';
    this.auditLog.push({
      action: 'Revoked',
      performedBy,
      details: reason
    });
    return this.save();
  },

  /**
   * Rotate the API key
   * @param {string} newHashedKey - New hashed key
   * @param {string} performedBy - User performing action
   * @returns {Promise<void>}
   */
  async rotate(newHashedKey, performedBy) {
    // Store old key in history
    this.rotation.previousKeys.push({
      hashedKey: this.hashedKey,
      revokedAt: new Date(),
      reason: 'Key rotation'
    });

    // Update to new key
    this.hashedKey = newHashedKey;
    this.rotation.lastRotated = new Date();
    
    this.auditLog.push({
      action: 'Rotated',
      performedBy,
      details: 'API key rotated'
    });

    return this.save();
  },

  /**
   * Check if key needs rotation
   * @returns {boolean} Needs rotation
   */
  needsRotation() {
    if (!this.rotation.autoRotate) {
      return false;
    }

    const daysSinceRotation = this.rotation.lastRotated
      ? (Date.now() - this.rotation.lastRotated.getTime()) / (1000 * 60 * 60 * 24)
      : (Date.now() - this.createdAt.getTime()) / (1000 * 60 * 60 * 24);

    return daysSinceRotation >= this.rotation.rotationInterval;
  },

  /**
   * Check if key is expired
   * @returns {boolean} Is expired
   */
  isExpired() {
    return this.expiresAt && this.expiresAt <= new Date();
  },

  /**
   * Get usage statistics
   * @returns {Object} Usage statistics
   */
  getUsageStats() {
    const successRate = this.usage.totalRequests > 0
      ? (this.usage.successCount / this.usage.totalRequests) * 100
      : 0;

    return {
      totalRequests: this.usage.totalRequests,
      successRate: Math.round(successRate * 100) / 100,
      averageResponseTime: this.usage.averageResponseTime,
      lastUsed: this.usage.lastUsed,
      requestsToday: this.usage.requestsToday,
      requestsThisHour: this.usage.requestsThisHour
    };
  }
};

// Static methods
apiKeySchema.statics = {
  /**
   * Find API key by hashed key
   * @param {string} hashedKey - Hashed API key
   * @returns {Promise<APIKey>} API key document
   */
  async findByHashedKey(hashedKey) {
    return this.findOne({
      hashedKey,
      status: 'Active',
      $or: [
        { expiresAt: { $exists: false } },
        { expiresAt: { $gt: new Date() } }
      ]
    }).populate('userId', 'email role status');
  },

  /**
   * Get user API keys
   * @param {string} userId - User ID
   * @param {boolean} activeOnly - Only active keys
   * @returns {Promise<APIKey[]>} API key documents
   */
  async getUserKeys(userId, activeOnly = true) {
    const query = { userId };
    if (activeOnly) {
      query.status = 'Active';
    }
    return this.find(query).sort({ createdAt: -1 });
  },

  /**
   * Get keys requiring rotation
   * @returns {Promise<APIKey[]>} API keys needing rotation
   */
  async getKeysRequiringRotation() {
    const keys = await this.find({
      status: 'Active',
      'rotation.autoRotate': true
    });

    return keys.filter(key => key.needsRotation());
  },

  /**
   * Get keys expiring soon
   * @param {number} days - Days until expiration
   * @returns {Promise<APIKey[]>} Expiring API keys
   */
  async getExpiringKeys(days = 7) {
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + days);

    return this.find({
      status: 'Active',
      expiresAt: {
        $exists: true,
        $lte: expirationDate,
        $gt: new Date()
      }
    }).populate('userId', 'email');
  },

  /**
   * Get API key statistics
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @returns {Promise<Object>} Statistics
   */
  async getStatistics(startDate, endDate) {
    const pipeline = [
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: null,
          totalKeys: { $sum: 1 },
          activeKeys: {
            $sum: { $cond: [{ $eq: ['$status', 'Active'] }, 1, 0] }
          },
          totalRequests: { $sum: '$usage.totalRequests' },
          averageRequestsPerKey: { $avg: '$usage.totalRequests' },
          environmentBreakdown: { $push: '$environment' },
          statusBreakdown: { $push: '$status' }
        }
      }
    ];

    const result = await this.aggregate(pipeline);
    return result[0] || {};
  },

  /**
   * Cleanup expired and revoked keys
   * @returns {Promise<number>} Number of keys cleaned up
   */
  async cleanupExpiredKeys() {
    const now = new Date();
    const result = await this.deleteMany({
      $or: [
        { expiresAt: { $lt: now } },
        { 
          status: 'Revoked',
          updatedAt: { $lt: new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000) } // 1 year old
        }
      ]
    });

    return result.deletedCount;
  }
};

const APIKey = mongoose.model('APIKey', apiKeySchema);

module.exports = APIKey;
