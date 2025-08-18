const mongoose = require('mongoose');

/**
 * Log Model Schema
 * Stores system and security event logs with blockchain anchoring
 */
const logSchema = new mongoose.Schema({
  // Event identification
  eventType: {
    type: String,
    required: true,
    enum: [
      'user_login', 'user_logout', 'user_registration', 'user_update',
      'api_access', 'api_key_created', 'api_key_revoked',
      'firewall_alert', 'intrusion_attempt', 'malware_detected',
      'data_access', 'data_modification', 'data_export',
      'config_change', 'system_update', 'backup_created',
      'threat_detected', 'threat_resolved', 'threat_escalated',
      'report_generated', 'report_downloaded', 'alert_triggered',
      'audit_trail_access', 'permission_change', 'role_change',
      'file_upload', 'file_download', 'database_query',
      'authentication_failure', 'session_expired', 'account_locked'
    ],
    index: true
  },

  // Event timestamp
  timestamp: {
    type: Date,
    default: Date.now,
    required: true,
    index: true
  },

  // User identification (optional for system events)
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    sparse: true,
    index: true
  },

  walletAddress: {
    type: String,
    sparse: true,
    uppercase: true,
    validate: {
      validator: function(address) {
        return !address || /^0x[a-fA-F0-9]{40}$/.test(address);
      },
      message: 'Invalid Ethereum wallet address format'
    },
    index: true
  },

  // Event details
  severity: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Critical'],
    default: 'Medium',
    required: true,
    index: true
  },

  source: {
    type: String,
    required: true,
    enum: [
      'web_app', 'mobile_app', 'api', 'system', 'firewall', 
      'ids', 'antivirus', 'database', 'file_system', 
      'authentication_service', 'blockchain_service'
    ]
  },

  // Detailed event information
  details: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },

  // Network and device information
  metadata: {
    ipAddress: {
      type: String,
      validate: {
        validator: function(ip) {
          if (!ip) return true;
          // Basic IP validation
          const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
          const ipv6Regex = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
          return ipv4Regex.test(ip) || ipv6Regex.test(ip);
        },
        message: 'Invalid IP address format'
      }
    },
    userAgent: String,
    deviceFingerprint: String,
    geolocation: {
      country: String,
      region: String,
      city: String,
      coordinates: {
        latitude: Number,
        longitude: Number
      }
    },
    sessionId: String,
    requestId: String
  },

  // Blockchain anchoring
  blockchain: {
    hash: {
      type: String,
      index: true
    },
    transactionId: {
      type: String,
      sparse: true,
      index: true
    },
    blockNumber: Number,
    network: {
      type: String,
      default: 'polygon-mumbai'
    },
    verified: {
      type: Boolean,
      default: false,
      index: true
    },
    verifiedAt: Date,
    batchId: String // For batch processing of logs
  },

  // Status and processing
  status: {
    type: String,
    enum: ['Pending', 'Processed', 'Verified', 'Failed', 'Archived'],
    default: 'Pending',
    index: true
  },

  // Tags for categorization
  tags: [String],

  // Related entities
  relatedEntities: {
    threatId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Threat',
      sparse: true
    },
    alertId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Alert',
      sparse: true
    },
    reportId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Report',
      sparse: true
    }
  },

  // AI/ML analysis results
  aiAnalysis: {
    anomalyScore: {
      type: Number,
      min: 0,
      max: 1
    },
    riskLevel: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Critical']
    },
    patterns: [String],
    predictions: mongoose.Schema.Types.Mixed,
    confidence: {
      type: Number,
      min: 0,
      max: 1
    },
    analyzedAt: Date,
    modelVersion: String
  },

  // Retention and archival
  retention: {
    archiveAfter: Date,
    deleteAfter: Date,
    archived: {
      type: Boolean,
      default: false,
      index: true
    },
    archivedAt: Date
  }
}, {
  timestamps: true,
  // Automatic archival after 2 years
  expires: '2y'
});

// Compound indexes for efficient querying
logSchema.index({ eventType: 1, timestamp: -1 });
logSchema.index({ severity: 1, timestamp: -1 });
logSchema.index({ userId: 1, timestamp: -1 });
logSchema.index({ walletAddress: 1, timestamp: -1 });
logSchema.index({ 'blockchain.verified': 1, timestamp: -1 });
logSchema.index({ status: 1, timestamp: -1 });
logSchema.index({ 'aiAnalysis.riskLevel': 1, timestamp: -1 });
logSchema.index({ tags: 1 });

// Text search index
logSchema.index({
  eventType: 'text',
  'details.description': 'text',
  'details.message': 'text',
  tags: 'text'
});

// Pre-save middleware to generate blockchain hash
logSchema.pre('save', function(next) {
  if (this.isNew || this.isModified('details')) {
    // Generate a hash of the log data for blockchain anchoring
    const crypto = require('crypto');
    const logData = {
      eventType: this.eventType,
      timestamp: this.timestamp,
      userId: this.userId,
      walletAddress: this.walletAddress,
      details: this.details,
      metadata: this.metadata
    };
    
    this.blockchain.hash = crypto
      .createHash('sha256')
      .update(JSON.stringify(logData))
      .digest('hex');
  }
  next();
});

// Instance methods
logSchema.methods = {
  /**
   * Mark log as verified on blockchain
   * @param {string} transactionId - Blockchain transaction ID
   * @param {number} blockNumber - Block number
   * @returns {Promise<void>}
   */
  async markAsVerified(transactionId, blockNumber) {
    this.blockchain.transactionId = transactionId;
    this.blockchain.blockNumber = blockNumber;
    this.blockchain.verified = true;
    this.blockchain.verifiedAt = new Date();
    this.status = 'Verified';
    return this.save();
  },

  /**
   * Add AI analysis results
   * @param {Object} analysis - AI analysis results
   * @returns {Promise<void>}
   */
  async addAIAnalysis(analysis) {
    this.aiAnalysis = {
      ...analysis,
      analyzedAt: new Date()
    };
    
    // Update risk level based on anomaly score if not provided
    if (!analysis.riskLevel && analysis.anomalyScore !== undefined) {
      if (analysis.anomalyScore >= 0.8) this.aiAnalysis.riskLevel = 'Critical';
      else if (analysis.anomalyScore >= 0.6) this.aiAnalysis.riskLevel = 'High';
      else if (analysis.anomalyScore >= 0.4) this.aiAnalysis.riskLevel = 'Medium';
      else this.aiAnalysis.riskLevel = 'Low';
    }

    return this.save();
  },

  /**
   * Archive the log
   * @returns {Promise<void>}
   */
  async archive() {
    this.retention.archived = true;
    this.retention.archivedAt = new Date();
    this.status = 'Archived';
    return this.save();
  },

  /**
   * Get related threat if exists
   * @returns {Promise<Threat>}
   */
  async getRelatedThreat() {
    if (this.relatedEntities.threatId) {
      return mongoose.model('Threat').findById(this.relatedEntities.threatId);
    }
    return null;
  }
};

// Static methods
logSchema.statics = {
  /**
   * Get logs by event type within date range
   * @param {string} eventType - Event type to filter
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @returns {Promise<Log[]>} Log documents
   */
  async getByEventType(eventType, startDate, endDate) {
    const query = { eventType };
    if (startDate && endDate) {
      query.timestamp = { $gte: startDate, $lte: endDate };
    }
    return this.find(query).sort({ timestamp: -1 });
  },

  /**
   * Get unverified logs for blockchain anchoring
   * @param {number} limit - Maximum number of logs to return
   * @returns {Promise<Log[]>} Unverified log documents
   */
  async getUnverifiedLogs(limit = 100) {
    return this.find({
      'blockchain.verified': false,
      status: { $in: ['Pending', 'Processed'] }
    })
    .sort({ timestamp: 1 })
    .limit(limit);
  },

  /**
   * Get high-risk logs
   * @param {Date} since - Date to filter from
   * @returns {Promise<Log[]>} High-risk log documents
   */
  async getHighRiskLogs(since = new Date(Date.now() - 24 * 60 * 60 * 1000)) {
    return this.find({
      timestamp: { $gte: since },
      $or: [
        { severity: { $in: ['High', 'Critical'] } },
        { 'aiAnalysis.riskLevel': { $in: ['High', 'Critical'] } },
        { 'aiAnalysis.anomalyScore': { $gte: 0.7 } }
      ]
    }).sort({ timestamp: -1 });
  },

  /**
   * Get log statistics
   * @param {Date} startDate - Start date for statistics
   * @param {Date} endDate - End date for statistics
   * @returns {Promise<Object>} Log statistics
   */
  async getStatistics(startDate, endDate) {
    const pipeline = [
      {
        $match: {
          timestamp: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: null,
          totalLogs: { $sum: 1 },
          severityBreakdown: {
            $push: '$severity'
          },
          eventTypeBreakdown: {
            $push: '$eventType'
          },
          verifiedLogs: {
            $sum: { $cond: ['$blockchain.verified', 1, 0] }
          },
          highRiskLogs: {
            $sum: { 
              $cond: [
                { $in: ['$severity', ['High', 'Critical']] },
                1, 0
              ]
            }
          }
        }
      }
    ];

    const result = await this.aggregate(pipeline);
    return result[0] || {};
  },

  /**
   * Search logs with text and filters
   * @param {Object} searchCriteria - Search criteria
   * @returns {Promise<Log[]>} Matching log documents
   */
  async searchLogs(searchCriteria) {
    const {
      query,
      eventTypes,
      severity,
      startDate,
      endDate,
      userId,
      verified,
      limit = 50,
      offset = 0
    } = searchCriteria;

    const searchQuery = {};

    // Text search
    if (query) {
      searchQuery.$text = { $search: query };
    }

    // Event type filter
    if (eventTypes && eventTypes.length > 0) {
      searchQuery.eventType = { $in: eventTypes };
    }

    // Severity filter
    if (severity && severity.length > 0) {
      searchQuery.severity = { $in: severity };
    }

    // Date range filter
    if (startDate && endDate) {
      searchQuery.timestamp = { $gte: startDate, $lte: endDate };
    }

    // User filter
    if (userId) {
      searchQuery.userId = userId;
    }

    // Verification filter
    if (verified !== undefined) {
      searchQuery['blockchain.verified'] = verified;
    }

    return this.find(searchQuery)
      .sort({ timestamp: -1 })
      .limit(limit)
      .skip(offset)
      .populate('userId', 'email walletAddress role');
  }
};

const Log = mongoose.model('Log', logSchema);

module.exports = Log;
