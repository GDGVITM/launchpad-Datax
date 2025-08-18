const mongoose = require('mongoose');

/**
 * Report Model Schema
 * Represents generated compliance and security reports
 */
const reportSchema = new mongoose.Schema({
  // Report identification
  reportId: {
    type: String,
    unique: true,
    required: true,
    index: true
  },

  // Report metadata
  title: {
    type: String,
    required: true
  },

  description: String,

  reportType: {
    type: String,
    required: true,
    enum: [
      'Security Summary',
      'Threat Analysis', 
      'Compliance Report',
      'Audit Trail',
      'User Activity Report',
      'System Performance',
      'Incident Response',
      'Risk Assessment',
      'Vulnerability Report',
      'Custom Report'
    ],
    index: true
  },

  // Report generation
  generatedAt: {
    type: Date,
    default: Date.now,
    required: true,
    index: true
  },

  generatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // Report period
  dateRange: {
    startDate: {
      type: Date,
      required: true
    },
    endDate: {
      type: Date,
      required: true
    }
  },

  // Report filters and parameters
  filters: {
    severity: [String],
    eventTypes: [String],
    userIds: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    threatTypes: [String],
    departments: [String],
    systems: [String],
    tags: [String],
    customFilters: mongoose.Schema.Types.Mixed
  },

  // Report format and output
  format: {
    type: String,
    enum: ['PDF', 'CSV', 'JSON', 'XML', 'HTML'],
    default: 'PDF'
  },

  // File information
  file: {
    filename: String,
    originalName: String,
    path: String,
    size: Number,
    mimeType: String,
    url: String,
    downloadCount: {
      type: Number,
      default: 0
    },
    lastDownloaded: Date
  },

  // Report status
  status: {
    type: String,
    enum: ['Generating', 'Completed', 'Failed', 'Archived', 'Expired'],
    default: 'Generating',
    index: true
  },

  // Progress tracking
  progress: {
    percentage: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    currentStep: String,
    totalSteps: Number,
    startedAt: Date,
    completedAt: Date,
    estimatedCompletion: Date
  },

  // Error handling
  error: {
    message: String,
    stack: String,
    code: String,
    occurredAt: Date
  },

  // Data summary
  dataSummary: {
    totalRecords: Number,
    recordsProcessed: Number,
    dataSourcesUsed: [String],
    queryExecutionTime: Number,
    cacheHit: Boolean
  },

  // Blockchain verification
  blockchain: {
    hash: String,
    transactionId: String,
    blockNumber: Number,
    network: {
      type: String,
      default: 'polygon-mumbai'
    },
    verified: {
      type: Boolean,
      default: false
    },
    verifiedAt: Date
  },

  // Access control
  access: {
    visibility: {
      type: String,
      enum: ['Private', 'Team', 'Organization', 'Public'],
      default: 'Private'
    },
    allowedUsers: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    allowedRoles: [String],
    downloadPermissions: {
      type: String,
      enum: ['Owner Only', 'Allowed Users', 'Role Based', 'Anyone'],
      default: 'Owner Only'
    }
  },

  // Retention and archival
  retention: {
    expiresAt: Date,
    autoArchive: {
      type: Boolean,
      default: true
    },
    archiveAfterDays: {
      type: Number,
      default: 365
    },
    deleteAfterDays: {
      type: Number,
      default: 2555 // 7 years
    }
  },

  // Report content structure
  sections: [{
    name: String,
    title: String,
    order: Number,
    content: mongoose.Schema.Types.Mixed,
    charts: [{
      type: String,
      data: mongoose.Schema.Types.Mixed,
      config: mongoose.Schema.Types.Mixed
    }],
    tables: [{
      headers: [String],
      rows: [mongoose.Schema.Types.Mixed]
    }]
  }],

  // Executive summary
  executiveSummary: {
    keyFindings: [String],
    recommendations: [String],
    riskLevel: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Critical']
    },
    complianceStatus: {
      type: String,
      enum: ['Compliant', 'Minor Issues', 'Major Issues', 'Non-Compliant']
    },
    trends: [String]
  },

  // Compliance mapping
  compliance: {
    frameworks: [String], // GDPR, HIPAA, SOX, ISO27001, etc.
    requirements: [{
      framework: String,
      requirement: String,
      status: {
        type: String,
        enum: ['Met', 'Partially Met', 'Not Met', 'Not Applicable']
      },
      evidence: [String],
      gaps: [String],
      recommendations: [String]
    }],
    overallScore: Number,
    lastAssessment: Date
  },

  // Report metrics
  metrics: {
    threats: {
      total: Number,
      byType: mongoose.Schema.Types.Mixed,
      bySeverity: mongoose.Schema.Types.Mixed,
      resolved: Number,
      avgResolutionTime: Number
    },
    alerts: {
      total: Number,
      byType: mongoose.Schema.Types.Mixed,
      acknowledged: Number,
      avgResponseTime: Number
    },
    users: {
      total: Number,
      active: Number,
      loginFailures: Number,
      newUsers: Number
    },
    systems: {
      uptime: Number,
      incidents: Number,
      performance: mongoose.Schema.Types.Mixed
    }
  },

  // Attachments and supporting documents
  attachments: [{
    name: String,
    filename: String,
    path: String,
    size: Number,
    type: String,
    uploadedAt: Date,
    description: String
  }],

  // Distribution and sharing
  distribution: {
    shared: {
      type: Boolean,
      default: false
    },
    sharedWith: [{
      email: String,
      name: String,
      role: String,
      sharedAt: Date,
      accessLevel: {
        type: String,
        enum: ['View', 'Download', 'Full']
      }
    }],
    publicLink: String,
    publicLinkExpires: Date,
    downloadHistory: [{
      downloadedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      downloadedAt: Date,
      ipAddress: String,
      userAgent: String
    }]
  },

  // Scheduling and automation
  schedule: {
    isScheduled: {
      type: Boolean,
      default: false
    },
    frequency: {
      type: String,
      enum: ['Daily', 'Weekly', 'Monthly', 'Quarterly', 'Yearly']
    },
    nextRun: Date,
    lastRun: Date,
    timezone: String,
    enabled: {
      type: Boolean,
      default: true
    },
    recipients: [String]
  },

  // Tags and categorization
  tags: [String],
  category: String,
  businessUnit: String,
  department: String,

  // Version control
  version: {
    number: {
      type: String,
      default: '1.0'
    },
    changelog: [String],
    basedOn: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Report'
    }
  }
}, {
  timestamps: true
});

// Indexes for performance
reportSchema.index({ reportType: 1, generatedAt: -1 });
reportSchema.index({ generatedBy: 1, generatedAt: -1 });
reportSchema.index({ status: 1, generatedAt: -1 });
reportSchema.index({ 'dateRange.startDate': 1, 'dateRange.endDate': 1 });
reportSchema.index({ 'blockchain.verified': 1 });
reportSchema.index({ tags: 1 });

// Text search index
reportSchema.index({
  title: 'text',
  description: 'text',
  'executiveSummary.keyFindings': 'text',
  tags: 'text'
});

// TTL index for automatic cleanup of expired reports
reportSchema.index({ 
  'retention.expiresAt': 1 
}, { 
  expireAfterSeconds: 0 
});

// Pre-save middleware to generate reportId
reportSchema.pre('save', function(next) {
  if (this.isNew && !this.reportId) {
    const date = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const type = this.reportType.replace(/\s+/g, '').substring(0, 3).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    this.reportId = `RPT-${type}-${date}-${random}`;
  }
  next();
});

// Pre-save middleware to generate blockchain hash
reportSchema.pre('save', function(next) {
  if ((this.isNew || this.isModified('dataSummary')) && this.status === 'Completed') {
    const crypto = require('crypto');
    const reportData = {
      reportId: this.reportId,
      reportType: this.reportType,
      dateRange: this.dateRange,
      dataSummary: this.dataSummary,
      generatedAt: this.generatedAt,
      generatedBy: this.generatedBy
    };
    
    this.blockchain.hash = crypto
      .createHash('sha256')
      .update(JSON.stringify(reportData))
      .digest('hex');
  }
  next();
});

// Instance methods
reportSchema.methods = {
  /**
   * Mark report as completed
   * @param {Object} summary - Data summary
   * @returns {Promise<void>}
   */
  async markCompleted(summary) {
    this.status = 'Completed';
    this.progress.percentage = 100;
    this.progress.completedAt = new Date();
    this.dataSummary = summary;
    return this.save();
  },

  /**
   * Mark report as failed
   * @param {Error} error - Error that caused failure
   * @returns {Promise<void>}
   */
  async markFailed(error) {
    this.status = 'Failed';
    this.error = {
      message: error.message,
      stack: error.stack,
      code: error.code,
      occurredAt: new Date()
    };
    return this.save();
  },

  /**
   * Update generation progress
   * @param {number} percentage - Progress percentage
   * @param {string} currentStep - Current step description
   * @returns {Promise<void>}
   */
  async updateProgress(percentage, currentStep) {
    this.progress.percentage = percentage;
    this.progress.currentStep = currentStep;
    return this.save();
  },

  /**
   * Mark as verified on blockchain
   * @param {string} transactionId - Blockchain transaction ID
   * @param {number} blockNumber - Block number
   * @returns {Promise<void>}
   */
  async markAsVerified(transactionId, blockNumber) {
    this.blockchain.transactionId = transactionId;
    this.blockchain.blockNumber = blockNumber;
    this.blockchain.verified = true;
    this.blockchain.verifiedAt = new Date();
    return this.save();
  },

  /**
   * Record download
   * @param {string} userId - User downloading the report
   * @param {string} ipAddress - IP address
   * @param {string} userAgent - User agent
   * @returns {Promise<void>}
   */
  async recordDownload(userId, ipAddress, userAgent) {
    this.file.downloadCount += 1;
    this.file.lastDownloaded = new Date();
    
    this.distribution.downloadHistory.push({
      downloadedBy: userId,
      downloadedAt: new Date(),
      ipAddress,
      userAgent
    });

    // Keep only last 100 download records
    if (this.distribution.downloadHistory.length > 100) {
      this.distribution.downloadHistory = this.distribution.downloadHistory.slice(-100);
    }

    return this.save();
  },

  /**
   * Share report with users
   * @param {Array} recipients - Array of recipient objects
   * @returns {Promise<void>}
   */
  async shareWith(recipients) {
    this.distribution.shared = true;
    recipients.forEach(recipient => {
      this.distribution.sharedWith.push({
        ...recipient,
        sharedAt: new Date()
      });
    });
    return this.save();
  },

  /**
   * Generate public sharing link
   * @param {Date} expiresAt - Link expiration date
   * @returns {Promise<string>} Public link
   */
  async generatePublicLink(expiresAt) {
    const crypto = require('crypto');
    this.distribution.publicLink = crypto.randomBytes(32).toString('hex');
    this.distribution.publicLinkExpires = expiresAt;
    await this.save();
    return this.distribution.publicLink;
  },

  /**
   * Check if user can access report
   * @param {string} userId - User ID
   * @param {string} userRole - User role
   * @returns {boolean} Access granted
   */
  canAccess(userId, userRole) {
    // Owner can always access
    if (this.generatedBy.toString() === userId) {
      return true;
    }

    // Check visibility settings
    if (this.access.visibility === 'Public') {
      return true;
    }

    if (this.access.visibility === 'Team' || this.access.visibility === 'Organization') {
      // Check allowed users
      if (this.access.allowedUsers.some(allowedUserId => allowedUserId.toString() === userId)) {
        return true;
      }

      // Check allowed roles
      if (this.access.allowedRoles.includes(userRole)) {
        return true;
      }
    }

    return false;
  },

  /**
   * Check if user can download report
   * @param {string} userId - User ID
   * @param {string} userRole - User role
   * @returns {boolean} Download permission granted
   */
  canDownload(userId, userRole) {
    if (!this.canAccess(userId, userRole)) {
      return false;
    }

    switch (this.access.downloadPermissions) {
      case 'Owner Only':
        return this.generatedBy.toString() === userId;
      case 'Allowed Users':
        return this.generatedBy.toString() === userId || 
               this.access.allowedUsers.some(allowedUserId => allowedUserId.toString() === userId);
      case 'Role Based':
        return this.access.allowedRoles.includes(userRole) || 
               this.generatedBy.toString() === userId;
      case 'Anyone':
        return true;
      default:
        return false;
    }
  },

  /**
   * Archive the report
   * @returns {Promise<void>}
   */
  async archive() {
    this.status = 'Archived';
    return this.save();
  },

  /**
   * Calculate compliance score
   * @returns {number} Compliance score (0-100)
   */
  calculateComplianceScore() {
    if (!this.compliance.requirements || this.compliance.requirements.length === 0) {
      return 0;
    }

    const totalRequirements = this.compliance.requirements.length;
    const metRequirements = this.compliance.requirements.filter(req => 
      req.status === 'Met'
    ).length;
    const partiallyMetRequirements = this.compliance.requirements.filter(req => 
      req.status === 'Partially Met'
    ).length;

    return Math.round(
      ((metRequirements * 1.0) + (partiallyMetRequirements * 0.5)) / totalRequirements * 100
    );
  }
};

// Static methods
reportSchema.statics = {
  /**
   * Get reports by type
   * @param {string} reportType - Report type
   * @param {number} limit - Limit results
   * @returns {Promise<Report[]>}
   */
  async getByType(reportType, limit = 20) {
    return this.find({ reportType })
      .sort({ generatedAt: -1 })
      .limit(limit)
      .populate('generatedBy', 'email role');
  },

  /**
   * Get user reports
   * @param {string} userId - User ID
   * @param {Object} options - Query options
   * @returns {Promise<Report[]>}
   */
  async getUserReports(userId, options = {}) {
    const { status, reportType, limit = 20, offset = 0 } = options;
    
    const query = { generatedBy: userId };
    
    if (status) {
      query.status = status;
    }
    
    if (reportType) {
      query.reportType = reportType;
    }

    return this.find(query)
      .sort({ generatedAt: -1 })
      .limit(limit)
      .skip(offset);
  },

  /**
   * Get scheduled reports for execution
   * @returns {Promise<Report[]>}
   */
  async getScheduledReports() {
    const now = new Date();
    return this.find({
      'schedule.isScheduled': true,
      'schedule.enabled': true,
      'schedule.nextRun': { $lte: now }
    });
  },

  /**
   * Get reports requiring blockchain verification
   * @returns {Promise<Report[]>}
   */
  async getUnverifiedReports() {
    return this.find({
      status: 'Completed',
      'blockchain.verified': false
    }).sort({ generatedAt: 1 });
  },

  /**
   * Get report statistics
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @returns {Promise<Object>} Statistics
   */
  async getStatistics(startDate, endDate) {
    const pipeline = [
      {
        $match: {
          generatedAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: null,
          totalReports: { $sum: 1 },
          typeBreakdown: { $push: '$reportType' },
          statusBreakdown: { $push: '$status' },
          avgGenerationTime: {
            $avg: {
              $subtract: ['$progress.completedAt', '$progress.startedAt']
            }
          },
          totalDownloads: { $sum: '$file.downloadCount' },
          verifiedReports: {
            $sum: { $cond: ['$blockchain.verified', 1, 0] }
          }
        }
      }
    ];

    const result = await this.aggregate(pipeline);
    return result[0] || {};
  },

  /**
   * Search reports
   * @param {Object} searchCriteria - Search criteria
   * @returns {Promise<Report[]>}
   */
  async searchReports(searchCriteria) {
    const {
      query,
      reportType,
      status,
      generatedBy,
      startDate,
      endDate,
      tags,
      limit = 50,
      offset = 0
    } = searchCriteria;

    const searchQuery = {};

    // Text search
    if (query) {
      searchQuery.$text = { $search: query };
    }

    // Filters
    if (reportType && reportType.length > 0) {
      searchQuery.reportType = { $in: reportType };
    }

    if (status && status.length > 0) {
      searchQuery.status = { $in: status };
    }

    if (generatedBy) {
      searchQuery.generatedBy = generatedBy;
    }

    if (tags && tags.length > 0) {
      searchQuery.tags = { $in: tags };
    }

    // Date range
    if (startDate && endDate) {
      searchQuery.generatedAt = { $gte: startDate, $lte: endDate };
    }

    return this.find(searchQuery)
      .sort({ generatedAt: -1 })
      .limit(limit)
      .skip(offset)
      .populate('generatedBy', 'email role')
      .populate('filters.userIds', 'email role');
  },

  /**
   * Cleanup expired reports
   * @returns {Promise<number>} Number of reports cleaned up
   */
  async cleanupExpiredReports() {
    const now = new Date();
    const result = await this.deleteMany({
      'retention.expiresAt': { $lt: now }
    });
    
    return result.deletedCount;
  }
};

const Report = mongoose.model('Report', reportSchema);

module.exports = Report;
