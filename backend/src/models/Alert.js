const mongoose = require('mongoose');

/**
 * Alert Model Schema
 * Represents system alerts and notifications
 */
const alertSchema = new mongoose.Schema({
  // Alert identification
  alertId: {
    type: String,
    unique: true,
    required: true,
    index: true
  },

  // Alert type and classification
  type: {
    type: String,
    required: true,
    enum: ['Security', 'System', 'Compliance', 'Performance', 'User Activity', 'Data Protection'],
    index: true
  },

  subType: {
    type: String,
    enum: [
      // Security subtypes
      'Threat Detected', 'Breach Attempt', 'Unauthorized Access', 'Malware Alert',
      'Suspicious Activity', 'Failed Authentication', 'Privilege Escalation',
      
      // System subtypes
      'System Down', 'High Resource Usage', 'Service Failure', 'Configuration Change',
      'Backup Failure', 'Update Required', 'License Expiring',
      
      // Compliance subtypes
      'Policy Violation', 'Audit Required', 'Regulation Change', 'Data Retention',
      'Access Review', 'Certification Expiring',
      
      // Performance subtypes
      'Slow Response', 'High Latency', 'Resource Threshold', 'Capacity Planning',
      
      // User Activity subtypes
      'New User', 'User Locked', 'Permission Change', 'Unusual Behavior',
      
      // Data Protection subtypes
      'Data Access', 'Data Export', 'Data Deletion', 'Data Classification'
    ]
  },

  // Alert severity
  severity: {
    type: String,
    required: true,
    enum: ['Low', 'Medium', 'High', 'Critical'],
    index: true
  },

  // Alert status
  status: {
    type: String,
    required: true,
    enum: ['Active', 'Acknowledged', 'In Progress', 'Resolved', 'Dismissed', 'Escalated'],
    default: 'Active',
    index: true
  },

  // Alert content
  title: {
    type: String,
    required: true
  },

  message: {
    type: String,
    required: true
  },

  description: String,

  // Source and context
  source: {
    system: String,
    component: String,
    service: String,
    endpoint: String
  },

  // Related entities
  relatedEntities: {
    threatId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Threat',
      sparse: true
    },
    logId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Log',
      sparse: true
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      sparse: true
    },
    reportId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Report',
      sparse: true
    }
  },

  // Target recipients
  targetUsers: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    role: String,
    acknowledged: {
      type: Boolean,
      default: false
    },
    acknowledgedAt: Date,
    notificationStatus: {
      email: { sent: Boolean, sentAt: Date, delivered: Boolean },
      sms: { sent: Boolean, sentAt: Date, delivered: Boolean },
      push: { sent: Boolean, sentAt: Date, delivered: Boolean },
      webhook: { sent: Boolean, sentAt: Date, delivered: Boolean }
    }
  }],

  // Notification channels
  channels: [{
    type: String,
    enum: ['email', 'sms', 'push', 'webhook', 'slack', 'teams'],
    required: true
  }],

  // Delivery tracking
  delivery: {
    email: {
      sent: { type: Boolean, default: false },
      sentAt: Date,
      delivered: { type: Boolean, default: false },
      deliveredAt: Date,
      failed: { type: Boolean, default: false },
      failureReason: String,
      recipients: [String]
    },
    sms: {
      sent: { type: Boolean, default: false },
      sentAt: Date,
      delivered: { type: Boolean, default: false },
      deliveredAt: Date,
      failed: { type: Boolean, default: false },
      failureReason: String,
      recipients: [String]
    },
    push: {
      sent: { type: Boolean, default: false },
      sentAt: Date,
      delivered: { type: Boolean, default: false },
      deliveredAt: Date,
      failed: { type: Boolean, default: false },
      failureReason: String,
      devices: [String]
    },
    webhook: {
      sent: { type: Boolean, default: false },
      sentAt: Date,
      delivered: { type: Boolean, default: false },
      deliveredAt: Date,
      failed: { type: Boolean, default: false },
      failureReason: String,
      endpoints: [String],
      retryCount: { type: Number, default: 0 }
    }
  },

  // Alert timing
  triggerTime: {
    type: Date,
    default: Date.now,
    required: true
  },

  acknowledgedAt: Date,
  resolvedAt: Date,
  dismissedAt: Date,

  // Escalation settings
  escalation: {
    enabled: { type: Boolean, default: false },
    levels: [{
      level: Number,
      timeoutMinutes: Number,
      targetUsers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }],
      channels: [String],
      triggered: { type: Boolean, default: false },
      triggeredAt: Date
    }],
    currentLevel: { type: Number, default: 0 }
  },

  // Auto-resolution settings
  autoResolve: {
    enabled: { type: Boolean, default: false },
    timeoutMinutes: Number,
    conditions: [String],
    resolved: { type: Boolean, default: false }
  },

  // Alert metadata
  metadata: {
    priority: {
      type: Number,
      min: 1,
      max: 10,
      default: 5
    },
    tags: [String],
    category: String,
    environment: {
      type: String,
      enum: ['Production', 'Staging', 'Development', 'Testing']
    },
    affectedSystems: [String],
    impactAssessment: {
      users: Number,
      systems: Number,
      estimatedDowntime: Number,
      businessImpact: {
        type: String,
        enum: ['None', 'Low', 'Medium', 'High', 'Critical']
      }
    }
  },

  // Actions taken
  actions: [{
    timestamp: {
      type: Date,
      default: Date.now
    },
    action: {
      type: String,
      enum: [
        'Created', 'Acknowledged', 'Assigned', 'Escalated', 'Resolved',
        'Dismissed', 'Reopened', 'Updated', 'Note Added', 'Attachment Added'
      ]
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    details: String,
    attachments: [String]
  }],

  // Response playbook
  playbook: {
    id: String,
    name: String,
    steps: [{
      stepNumber: Number,
      description: String,
      completed: { type: Boolean, default: false },
      completedAt: Date,
      completedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      notes: String
    }],
    automatedSteps: [String]
  },

  // External integrations
  integrations: {
    ticketingSystem: {
      enabled: Boolean,
      ticketId: String,
      ticketUrl: String,
      status: String,
      createdAt: Date,
      updatedAt: Date
    },
    siem: {
      enabled: Boolean,
      eventId: String,
      correlationId: String,
      ruleName: String
    },
    soar: {
      enabled: Boolean,
      playbookId: String,
      workflowId: String,
      status: String
    }
  },

  // Recurrence settings (for scheduled alerts)
  recurrence: {
    enabled: { type: Boolean, default: false },
    pattern: {
      type: String,
      enum: ['Daily', 'Weekly', 'Monthly', 'Yearly', 'Custom']
    },
    interval: Number,
    endDate: Date,
    lastTriggered: Date,
    nextTrigger: Date
  }
}, {
  timestamps: true
});

// Indexes for performance
alertSchema.index({ type: 1, triggerTime: -1 });
alertSchema.index({ severity: 1, status: 1 });
alertSchema.index({ status: 1, triggerTime: -1 });
alertSchema.index({ 'targetUsers.userId': 1 });
alertSchema.index({ 'relatedEntities.threatId': 1 });
alertSchema.index({ 'metadata.tags': 1 });

// Text search index
alertSchema.index({
  title: 'text',
  message: 'text',
  description: 'text',
  'metadata.tags': 'text'
});

// TTL index for auto-cleanup of old resolved alerts (optional)
alertSchema.index({ 
  resolvedAt: 1 
}, { 
  expireAfterSeconds: 365 * 24 * 60 * 60, // 1 year
  partialFilterExpression: { status: 'Resolved' }
});

// Pre-save middleware to generate alertId
alertSchema.pre('save', function(next) {
  if (this.isNew && !this.alertId) {
    const date = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    this.alertId = `ALT-${date}-${random}`;
  }
  next();
});

// Pre-save middleware to track actions
alertSchema.pre('save', function(next) {
  if (this.isModified('status') && !this.isNew) {
    this.actions.push({
      action: this.status === 'Acknowledged' ? 'Acknowledged' :
              this.status === 'Resolved' ? 'Resolved' :
              this.status === 'Dismissed' ? 'Dismissed' :
              this.status === 'Escalated' ? 'Escalated' : 'Updated',
      details: `Status changed to ${this.status}`
    });

    // Set timestamps
    if (this.status === 'Acknowledged' && !this.acknowledgedAt) {
      this.acknowledgedAt = new Date();
    } else if (this.status === 'Resolved' && !this.resolvedAt) {
      this.resolvedAt = new Date();
    } else if (this.status === 'Dismissed' && !this.dismissedAt) {
      this.dismissedAt = new Date();
    }
  }
  next();
});

// Instance methods
alertSchema.methods = {
  /**
   * Acknowledge the alert
   * @param {string} userId - User acknowledging the alert
   * @param {string} notes - Acknowledgment notes
   * @returns {Promise<void>}
   */
  async acknowledge(userId, notes = '') {
    this.status = 'Acknowledged';
    this.acknowledgedAt = new Date();
    
    // Update user-specific acknowledgment
    const targetUser = this.targetUsers.find(user => user.userId.toString() === userId);
    if (targetUser) {
      targetUser.acknowledged = true;
      targetUser.acknowledgedAt = new Date();
    }

    this.actions.push({
      action: 'Acknowledged',
      performedBy: userId,
      details: notes
    });

    return this.save();
  },

  /**
   * Resolve the alert
   * @param {string} userId - User resolving the alert
   * @param {string} resolution - Resolution details
   * @returns {Promise<void>}
   */
  async resolve(userId, resolution = '') {
    this.status = 'Resolved';
    this.resolvedAt = new Date();
    
    this.actions.push({
      action: 'Resolved',
      performedBy: userId,
      details: resolution
    });

    return this.save();
  },

  /**
   * Dismiss the alert
   * @param {string} userId - User dismissing the alert
   * @param {string} reason - Dismissal reason
   * @returns {Promise<void>}
   */
  async dismiss(userId, reason = '') {
    this.status = 'Dismissed';
    this.dismissedAt = new Date();
    
    this.actions.push({
      action: 'Dismissed',
      performedBy: userId,
      details: reason
    });

    return this.save();
  },

  /**
   * Escalate the alert
   * @param {string} userId - User escalating the alert
   * @param {string} reason - Escalation reason
   * @returns {Promise<void>}
   */
  async escalate(userId, reason = '') {
    this.status = 'Escalated';
    
    if (this.escalation.enabled && this.escalation.levels.length > 0) {
      const currentLevel = this.escalation.currentLevel;
      if (currentLevel < this.escalation.levels.length - 1) {
        this.escalation.currentLevel = currentLevel + 1;
        const level = this.escalation.levels[this.escalation.currentLevel];
        level.triggered = true;
        level.triggeredAt = new Date();
      }
    }

    this.actions.push({
      action: 'Escalated',
      performedBy: userId,
      details: reason
    });

    return this.save();
  },

  /**
   * Mark delivery status for a channel
   * @param {string} channel - Delivery channel
   * @param {boolean} delivered - Delivery status
   * @param {string} failureReason - Reason for failure (if applicable)
   * @returns {Promise<void>}
   */
  async markDeliveryStatus(channel, delivered, failureReason = '') {
    if (this.delivery[channel]) {
      this.delivery[channel].delivered = delivered;
      this.delivery[channel].deliveredAt = delivered ? new Date() : undefined;
      this.delivery[channel].failed = !delivered;
      this.delivery[channel].failureReason = failureReason;
    }
    return this.save();
  },

  /**
   * Add action to alert history
   * @param {string} action - Action performed
   * @param {string} userId - User performing action
   * @param {string} details - Action details
   * @returns {Promise<void>}
   */
  async addAction(action, userId, details = '') {
    this.actions.push({
      action,
      performedBy: userId,
      details
    });
    return this.save();
  },

  /**
   * Check if alert should be auto-resolved
   * @returns {boolean} Should auto-resolve
   */
  shouldAutoResolve() {
    if (!this.autoResolve.enabled || this.autoResolve.resolved) {
      return false;
    }

    const timeoutMs = this.autoResolve.timeoutMinutes * 60 * 1000;
    const elapsed = Date.now() - this.triggerTime.getTime();
    
    return elapsed >= timeoutMs;
  },

  /**
   * Check if alert should be escalated
   * @returns {boolean} Should escalate
   */
  shouldEscalate() {
    if (!this.escalation.enabled || this.status !== 'Active') {
      return false;
    }

    const currentLevel = this.escalation.currentLevel;
    if (currentLevel >= this.escalation.levels.length) {
      return false;
    }

    const level = this.escalation.levels[currentLevel];
    if (level.triggered) {
      return false;
    }

    const timeoutMs = level.timeoutMinutes * 60 * 1000;
    const elapsed = Date.now() - this.triggerTime.getTime();
    
    return elapsed >= timeoutMs;
  },

  /**
   * Calculate alert priority score
   * @returns {number} Priority score (0-100)
   */
  calculatePriorityScore() {
    let score = 0;

    // Severity weight (40%)
    const severityWeights = { Low: 10, Medium: 25, High: 35, Critical: 40 };
    score += severityWeights[this.severity] || 0;

    // Type weight (20%)
    const typeWeights = { Security: 20, System: 15, Compliance: 10, Performance: 8 };
    score += typeWeights[this.type] || 5;

    // Age weight (20%)
    const ageInMinutes = (Date.now() - this.triggerTime.getTime()) / (1000 * 60);
    score += Math.min(ageInMinutes * 0.1, 20);

    // Escalation weight (10%)
    if (this.escalation.enabled && this.escalation.currentLevel > 0) {
      score += this.escalation.currentLevel * 3;
    }

    // Impact weight (10%)
    if (this.metadata.impactAssessment) {
      const impactWeights = { None: 0, Low: 2, Medium: 5, High: 8, Critical: 10 };
      score += impactWeights[this.metadata.impactAssessment.businessImpact] || 0;
    }

    return Math.min(Math.round(score), 100);
  }
};

// Static methods
alertSchema.statics = {
  /**
   * Get active alerts by severity
   * @param {string} severity - Severity level
   * @returns {Promise<Alert[]>}
   */
  async getActiveBySeverity(severity) {
    return this.find({
      severity,
      status: { $in: ['Active', 'Acknowledged'] }
    }).sort({ triggerTime: -1 });
  },

  /**
   * Get alerts for user
   * @param {string} userId - User ID
   * @param {boolean} unacknowledgedOnly - Only unacknowledged alerts
   * @returns {Promise<Alert[]>}
   */
  async getForUser(userId, unacknowledgedOnly = false) {
    const query = {
      'targetUsers.userId': userId,
      status: { $nin: ['Resolved', 'Dismissed'] }
    };

    if (unacknowledgedOnly) {
      query['targetUsers.acknowledged'] = false;
    }

    return this.find(query).sort({ triggerTime: -1 });
  },

  /**
   * Get alerts requiring escalation
   * @returns {Promise<Alert[]>}
   */
  async getAlertsRequiringEscalation() {
    const alerts = await this.find({
      'escalation.enabled': true,
      status: 'Active'
    });

    return alerts.filter(alert => alert.shouldEscalate());
  },

  /**
   * Get alerts for auto-resolution
   * @returns {Promise<Alert[]>}
   */
  async getAlertsForAutoResolution() {
    const alerts = await this.find({
      'autoResolve.enabled': true,
      'autoResolve.resolved': false,
      status: { $in: ['Active', 'Acknowledged'] }
    });

    return alerts.filter(alert => alert.shouldAutoResolve());
  },

  /**
   * Get alert statistics
   * @param {Date} startDate - Start date for statistics
   * @param {Date} endDate - End date for statistics
   * @returns {Promise<Object>} Alert statistics
   */
  async getStatistics(startDate, endDate) {
    const pipeline = [
      {
        $match: {
          triggerTime: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: null,
          totalAlerts: { $sum: 1 },
          severityBreakdown: { $push: '$severity' },
          typeBreakdown: { $push: '$type' },
          statusBreakdown: { $push: '$status' },
          avgResolutionTime: {
            $avg: {
              $cond: [
                { $eq: ['$status', 'Resolved'] },
                { $subtract: ['$resolvedAt', '$triggerTime'] },
                null
              ]
            }
          },
          acknowledgedCount: {
            $sum: { $cond: [{ $eq: ['$status', 'Acknowledged'] }, 1, 0] }
          },
          resolvedCount: {
            $sum: { $cond: [{ $eq: ['$status', 'Resolved'] }, 1, 0] }
          }
        }
      }
    ];

    const result = await this.aggregate(pipeline);
    return result[0] || {};
  },

  /**
   * Search alerts with filters
   * @param {Object} searchCriteria - Search criteria
   * @returns {Promise<Alert[]>}
   */
  async searchAlerts(searchCriteria) {
    const {
      query,
      type,
      severity,
      status,
      startDate,
      endDate,
      userId,
      limit = 50,
      offset = 0
    } = searchCriteria;

    const searchQuery = {};

    // Text search
    if (query) {
      searchQuery.$text = { $search: query };
    }

    // Filters
    if (type && type.length > 0) {
      searchQuery.type = { $in: type };
    }

    if (severity && severity.length > 0) {
      searchQuery.severity = { $in: severity };
    }

    if (status && status.length > 0) {
      searchQuery.status = { $in: status };
    }

    if (userId) {
      searchQuery['targetUsers.userId'] = userId;
    }

    // Date range
    if (startDate && endDate) {
      searchQuery.triggerTime = { $gte: startDate, $lte: endDate };
    }

    return this.find(searchQuery)
      .sort({ triggerTime: -1 })
      .limit(limit)
      .skip(offset)
      .populate('targetUsers.userId', 'email role')
      .populate('relatedEntities.threatId', 'threatId type severity')
      .populate('actions.performedBy', 'email role');
  }
};

const Alert = mongoose.model('Alert', alertSchema);

module.exports = Alert;
