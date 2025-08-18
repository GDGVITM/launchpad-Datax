const mongoose = require('mongoose');

/**
 * Threat Model Schema
 * Represents detected security threats and incidents
 */
const threatSchema = new mongoose.Schema({
  // Threat identification
  threatId: {
    type: String,
    unique: true,
    required: true,
    index: true
  },

  // Detection information
  detectedAt: {
    type: Date,
    default: Date.now,
    required: true,
    index: true
  },

  // Threat classification
  type: {
    type: String,
    required: true,
    enum: [
      'Brute Force Attack',
      'SQL Injection',
      'XSS Attack',
      'CSRF Attack',
      'DDoS Attack',
      'Malware Detection',
      'Ransomware',
      'Unauthorized Access',
      'Data Breach',
      'Data Exfiltration',
      'Anomalous Behavior',
      'Phishing Attempt',
      'Social Engineering',
      'Insider Threat',
      'Privilege Escalation',
      'Command Injection',
      'Directory Traversal',
      'Authentication Bypass',
      'Session Hijacking',
      'Man-in-the-Middle',
      'Zero-Day Exploit',
      'Advanced Persistent Threat',
      'Cryptocurrency Mining',
      'Botnet Activity',
      'Suspicious File Activity'
    ],
    index: true
  },

  // Threat severity
  severity: {
    type: String,
    required: true,
    enum: ['Low', 'Medium', 'High', 'Critical'],
    index: true
  },

  // Threat status
  status: {
    type: String,
    required: true,
    enum: ['Active', 'Investigating', 'Contained', 'Resolved', 'False Positive'],
    default: 'Active',
    index: true
  },

  // Description and summary
  title: {
    type: String,
    required: true
  },

  description: {
    type: String,
    required: true
  },

  // Related logs and evidence
  logRefs: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Log',
    required: true
  }],

  // Affected resources
  affectedAssets: [{
    assetType: {
      type: String,
      enum: ['Server', 'Database', 'Application', 'Network', 'Endpoint', 'User Account', 'API', 'File System']
    },
    assetId: String,
    assetName: String,
    impact: {
      type: String,
      enum: ['None', 'Low', 'Medium', 'High', 'Critical']
    }
  }],

  // Threat intelligence
  indicators: {
    ipAddresses: [String],
    domains: [String],
    urls: [String],
    fileHashes: [String],
    emailAddresses: [String],
    userAgents: [String],
    attackSignatures: [String]
  },

  // Attack details
  attackVector: {
    type: String,
    enum: [
      'Network', 'Web Application', 'Email', 'Social Engineering',
      'Physical', 'Supply Chain', 'Insider', 'Cloud', 'Mobile', 'IoT'
    ]
  },

  attackPhase: {
    type: String,
    enum: [
      'Reconnaissance', 'Initial Access', 'Execution', 'Persistence',
      'Privilege Escalation', 'Defense Evasion', 'Credential Access',
      'Discovery', 'Lateral Movement', 'Collection', 'Exfiltration',
      'Command and Control', 'Impact'
    ]
  },

  // Geographic and network information
  sourceInfo: {
    ipAddress: String,
    country: String,
    region: String,
    organization: String,
    isp: String,
    isKnownThreat: Boolean,
    reputation: {
      type: Number,
      min: 0,
      max: 100
    }
  },

  // Assignment and workflow
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true
  },

  assignedAt: Date,

  // Timeline and resolution
  timeline: [{
    timestamp: {
      type: Date,
      default: Date.now
    },
    action: {
      type: String,
      enum: [
        'Detected', 'Assigned', 'Investigation Started', 'Escalated',
        'Contained', 'Evidence Collected', 'Resolved', 'Verified',
        'Closed', 'Reopened', 'False Positive Confirmed'
      ]
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    notes: String,
    attachments: [String]
  }],

  // Resolution information
  resolution: {
    resolvedAt: Date,
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    resolutionType: {
      type: String,
      enum: [
        'Mitigated', 'Blocked', 'Patched', 'User Educated',
        'Policy Updated', 'System Updated', 'False Positive',
        'Unable to Reproduce', 'Accepted Risk'
      ]
    },
    resolutionNotes: String,
    preventiveMeasures: [String],
    lessonsLearned: String
  },

  // Impact assessment
  impact: {
    confidentiality: {
      type: String,
      enum: ['None', 'Low', 'Medium', 'High']
    },
    integrity: {
      type: String,
      enum: ['None', 'Low', 'Medium', 'High']
    },
    availability: {
      type: String,
      enum: ['None', 'Low', 'Medium', 'High']
    },
    financialLoss: Number,
    affectedUsers: Number,
    dataCompromised: Boolean,
    complianceImpact: Boolean
  },

  // AI/ML analysis
  aiAnalysis: {
    confidence: {
      type: Number,
      min: 0,
      max: 1
    },
    falseProbability: {
      type: Number,
      min: 0,
      max: 1
    },
    similarThreats: [{
      threatId: String,
      similarity: Number
    }],
    recommendedActions: [String],
    automatedResponse: {
      enabled: Boolean,
      actions: [String]
    },
    modelVersion: String,
    analyzedAt: Date
  },

  // Compliance and reporting
  compliance: {
    regulations: [String], // GDPR, HIPAA, SOX, etc.
    reportingRequired: Boolean,
    reportingDeadline: Date,
    regulatoryReports: [{
      regulation: String,
      reportedAt: Date,
      reportId: String
    }]
  },

  // Tags and categorization
  tags: [String],

  // Related threats and campaigns
  relatedThreats: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Threat'
  }],

  campaign: {
    name: String,
    description: String,
    startDate: Date,
    endDate: Date
  },

  // Communication and escalation
  communications: [{
    timestamp: {
      type: Date,
      default: Date.now
    },
    channel: {
      type: String,
      enum: ['Email', 'Slack', 'Teams', 'Phone', 'In-Person', 'Ticketing System']
    },
    participants: [String],
    summary: String,
    escalated: Boolean
  }],

  // External references
  references: [{
    type: {
      type: String,
      enum: ['CVE', 'MITRE ATT&CK', 'IOC', 'Blog Post', 'Research Paper', 'Vendor Advisory']
    },
    identifier: String,
    url: String,
    description: String
  }]
}, {
  timestamps: true
});

// Indexes for performance
threatSchema.index({ type: 1, detectedAt: -1 });
threatSchema.index({ severity: 1, status: 1 });
threatSchema.index({ assignedTo: 1, status: 1 });
threatSchema.index({ status: 1, detectedAt: -1 });
threatSchema.index({ 'sourceInfo.ipAddress': 1 });
threatSchema.index({ tags: 1 });

// Text search index
threatSchema.index({
  title: 'text',
  description: 'text',
  'resolution.resolutionNotes': 'text',
  tags: 'text'
});

// Pre-save middleware to generate threatId
threatSchema.pre('save', function(next) {
  if (this.isNew && !this.threatId) {
    const date = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    this.threatId = `THR-${date}-${random}`;
  }
  next();
});

// Pre-save middleware to update timeline
threatSchema.pre('save', function(next) {
  if (this.isModified('status') && !this.isNew) {
    this.timeline.push({
      action: this.status === 'Resolved' ? 'Resolved' : 
              this.status === 'Investigating' ? 'Investigation Started' :
              this.status === 'Contained' ? 'Contained' : 'Status Changed',
      notes: `Status changed to ${this.status}`
    });
  }

  if (this.isModified('assignedTo') && this.assignedTo) {
    this.assignedAt = new Date();
    this.timeline.push({
      action: 'Assigned',
      notes: `Threat assigned to analyst`
    });
  }

  next();
});

// Instance methods
threatSchema.methods = {
  /**
   * Assign threat to an analyst
   * @param {string} userId - User ID to assign to
   * @param {string} notes - Assignment notes
   * @returns {Promise<void>}
   */
  async assignTo(userId, notes = '') {
    this.assignedTo = userId;
    this.assignedAt = new Date();
    this.addTimelineEntry('Assigned', userId, notes);
    return this.save();
  },

  /**
   * Add timeline entry
   * @param {string} action - Action performed
   * @param {string} performedBy - User who performed the action
   * @param {string} notes - Additional notes
   * @returns {void}
   */
  addTimelineEntry(action, performedBy, notes = '') {
    this.timeline.push({
      timestamp: new Date(),
      action,
      performedBy,
      notes
    });
  },

  /**
   * Resolve the threat
   * @param {Object} resolutionData - Resolution information
   * @returns {Promise<void>}
   */
  async resolve(resolutionData) {
    this.status = 'Resolved';
    this.resolution = {
      ...resolutionData,
      resolvedAt: new Date()
    };
    this.addTimelineEntry('Resolved', resolutionData.resolvedBy, resolutionData.resolutionNotes);
    return this.save();
  },

  /**
   * Mark as false positive
   * @param {string} userId - User marking as false positive
   * @param {string} reason - Reason for false positive
   * @returns {Promise<void>}
   */
  async markAsFalsePositive(userId, reason) {
    this.status = 'False Positive';
    this.resolution = {
      resolvedAt: new Date(),
      resolvedBy: userId,
      resolutionType: 'False Positive',
      resolutionNotes: reason
    };
    this.addTimelineEntry('False Positive Confirmed', userId, reason);
    return this.save();
  },

  /**
   * Escalate the threat
   * @param {string} userId - User escalating
   * @param {string} reason - Escalation reason
   * @returns {Promise<void>}
   */
  async escalate(userId, reason) {
    if (this.severity === 'Critical') {
      throw new Error('Threat is already at maximum severity');
    }

    const severityOrder = ['Low', 'Medium', 'High', 'Critical'];
    const currentIndex = severityOrder.indexOf(this.severity);
    this.severity = severityOrder[Math.min(currentIndex + 1, severityOrder.length - 1)];
    
    this.addTimelineEntry('Escalated', userId, reason);
    return this.save();
  },

  /**
   * Get related logs
   * @returns {Promise<Log[]>}
   */
  async getRelatedLogs() {
    return mongoose.model('Log').find({ _id: { $in: this.logRefs } });
  },

  /**
   * Calculate threat score based on various factors
   * @returns {number} Threat score (0-100)
   */
  calculateThreatScore() {
    let score = 0;

    // Severity weight (40%)
    const severityWeights = { Low: 10, Medium: 25, High: 35, Critical: 40 };
    score += severityWeights[this.severity] || 0;

    // AI confidence weight (20%)
    if (this.aiAnalysis && this.aiAnalysis.confidence) {
      score += this.aiAnalysis.confidence * 20;
    }

    // Affected assets weight (20%)
    if (this.affectedAssets && this.affectedAssets.length > 0) {
      const highImpactAssets = this.affectedAssets.filter(asset => 
        asset.impact === 'High' || asset.impact === 'Critical'
      ).length;
      score += Math.min(highImpactAssets * 5, 20);
    }

    // Source reputation weight (10%)
    if (this.sourceInfo && this.sourceInfo.reputation !== undefined) {
      score += (100 - this.sourceInfo.reputation) * 0.1;
    }

    // Time factor weight (10%) - older unresolved threats score higher
    const ageInDays = (Date.now() - this.detectedAt.getTime()) / (1000 * 60 * 60 * 24);
    if (this.status === 'Active' || this.status === 'Investigating') {
      score += Math.min(ageInDays * 2, 10);
    }

    return Math.min(Math.round(score), 100);
  }
};

// Static methods
threatSchema.statics = {
  /**
   * Get active threats by severity
   * @param {string} severity - Severity level
   * @returns {Promise<Threat[]>}
   */
  async getActiveBySeverity(severity) {
    return this.find({
      severity,
      status: { $in: ['Active', 'Investigating'] }
    }).sort({ detectedAt: -1 });
  },

  /**
   * Get threats assigned to user
   * @param {string} userId - User ID
   * @returns {Promise<Threat[]>}
   */
  async getAssignedToUser(userId) {
    return this.find({
      assignedTo: userId,
      status: { $nin: ['Resolved', 'False Positive'] }
    }).sort({ severity: -1, detectedAt: -1 });
  },

  /**
   * Get threat statistics
   * @param {Date} startDate - Start date for statistics
   * @param {Date} endDate - End date for statistics
   * @returns {Promise<Object>} Threat statistics
   */
  async getStatistics(startDate, endDate) {
    const pipeline = [
      {
        $match: {
          detectedAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: null,
          totalThreats: { $sum: 1 },
          severityBreakdown: {
            $push: '$severity'
          },
          statusBreakdown: {
            $push: '$status'
          },
          typeBreakdown: {
            $push: '$type'
          },
          avgResolutionTime: {
            $avg: {
              $cond: [
                { $eq: ['$status', 'Resolved'] },
                { $subtract: ['$resolution.resolvedAt', '$detectedAt'] },
                null
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
   * Search threats with filters
   * @param {Object} searchCriteria - Search criteria
   * @returns {Promise<Threat[]>}
   */
  async searchThreats(searchCriteria) {
    const {
      query,
      severity,
      status,
      type,
      assignedTo,
      startDate,
      endDate,
      limit = 50,
      offset = 0
    } = searchCriteria;

    const searchQuery = {};

    // Text search
    if (query) {
      searchQuery.$text = { $search: query };
    }

    // Filters
    if (severity && severity.length > 0) {
      searchQuery.severity = { $in: severity };
    }

    if (status && status.length > 0) {
      searchQuery.status = { $in: status };
    }

    if (type && type.length > 0) {
      searchQuery.type = { $in: type };
    }

    if (assignedTo) {
      searchQuery.assignedTo = assignedTo;
    }

    // Date range
    if (startDate && endDate) {
      searchQuery.detectedAt = { $gte: startDate, $lte: endDate };
    }

    return this.find(searchQuery)
      .sort({ detectedAt: -1 })
      .limit(limit)
      .skip(offset)
      .populate('assignedTo', 'email role')
      .populate('logRefs', 'eventType timestamp severity');
  },

  /**
   * Get unassigned high-severity threats
   * @returns {Promise<Threat[]>}
   */
  async getUnassignedHighSeverity() {
    return this.find({
      severity: { $in: ['High', 'Critical'] },
      status: 'Active',
      assignedTo: { $exists: false }
    }).sort({ detectedAt: 1 });
  }
};

const Threat = mongoose.model('Threat', threatSchema);

module.exports = Threat;
