const mongoose = require('mongoose');

/**
 * Settings Model Schema
 * Manages user and system settings
 */
const settingsSchema = new mongoose.Schema({
  // Settings identification
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    unique: true,
    required: true,
    index: true
  },

  // Notification preferences
  notifications: {
    // Channel preferences
    channels: {
      email: {
        enabled: { type: Boolean, default: true },
        address: String, // Override default email
        verified: { type: Boolean, default: false },
        verificationToken: String,
        verificationExpires: Date
      },
      sms: {
        enabled: { type: Boolean, default: false },
        phoneNumber: String,
        verified: { type: Boolean, default: false },
        verificationCode: String,
        verificationExpires: Date
      },
      push: {
        enabled: { type: Boolean, default: true },
        devices: [{
          deviceId: String,
          deviceType: String,
          pushToken: String,
          enabled: { type: Boolean, default: true },
          lastUsed: Date
        }]
      },
      webhook: {
        enabled: { type: Boolean, default: false },
        url: String,
        secret: String,
        verified: { type: Boolean, default: false },
        retryCount: { type: Number, default: 3 },
        timeout: { type: Number, default: 30000 }
      },
      slack: {
        enabled: { type: Boolean, default: false },
        webhookUrl: String,
        channel: String,
        username: String
      },
      teams: {
        enabled: { type: Boolean, default: false },
        webhookUrl: String,
        channel: String
      }
    },

    // Event-specific preferences
    events: {
      threatDetected: {
        enabled: { type: Boolean, default: true },
        minimumSeverity: {
          type: String,
          enum: ['Low', 'Medium', 'High', 'Critical'],
          default: 'Medium'
        },
        channels: [String],
        immediateNotification: { type: Boolean, default: true }
      },
      threatResolved: {
        enabled: { type: Boolean, default: true },
        channels: [String],
        onlyAssignedThreats: { type: Boolean, default: true }
      },
      alertTriggered: {
        enabled: { type: Boolean, default: true },
        minimumSeverity: {
          type: String,
          enum: ['Low', 'Medium', 'High', 'Critical'],
          default: 'Medium'
        },
        channels: [String]
      },
      reportGenerated: {
        enabled: { type: Boolean, default: true },
        channels: [String],
        onlyOwnReports: { type: Boolean, default: true }
      },
      systemMaintenance: {
        enabled: { type: Boolean, default: true },
        channels: [String],
        advanceNotice: { type: Boolean, default: true }
      },
      securityUpdate: {
        enabled: { type: Boolean, default: true },
        channels: [String]
      },
      userActivity: {
        enabled: { type: Boolean, default: false },
        channels: [String],
        onlyFailedLogins: { type: Boolean, default: true }
      },
      complianceDeadline: {
        enabled: { type: Boolean, default: true },
        channels: [String],
        daysBefore: { type: Number, default: 7 }
      }
    },

    // Digest and summary preferences
    digest: {
      enabled: { type: Boolean, default: true },
      frequency: {
        type: String,
        enum: ['Daily', 'Weekly', 'Monthly'],
        default: 'Daily'
      },
      time: { type: String, default: '09:00' }, // HH:MM format
      timezone: { type: String, default: 'UTC' },
      channels: [String],
      includeResolved: { type: Boolean, default: false },
      minimumSeverity: {
        type: String,
        enum: ['Low', 'Medium', 'High', 'Critical'],
        default: 'Low'
      }
    },

    // Quiet hours
    quietHours: {
      enabled: { type: Boolean, default: false },
      startTime: String, // HH:MM format
      endTime: String,   // HH:MM format
      timezone: { type: String, default: 'UTC' },
      excludeCritical: { type: Boolean, default: true },
      weekendsOnly: { type: Boolean, default: false }
    }
  },

  // Dashboard preferences
  dashboard: {
    // Layout and widgets
    layout: {
      type: String,
      enum: ['Grid', 'List', 'Cards'],
      default: 'Grid'
    },
    widgets: [{
      id: String,
      type: String,
      position: { x: Number, y: Number },
      size: { width: Number, height: Number },
      config: mongoose.Schema.Types.Mixed,
      enabled: { type: Boolean, default: true }
    }],
    refreshInterval: {
      type: Number,
      default: 30000 // 30 seconds
    },
    autoRefresh: { type: Boolean, default: true },
    theme: {
      type: String,
      enum: ['Light', 'Dark', 'Auto'],
      default: 'Light'
    },
    compactMode: { type: Boolean, default: false },
    showWelcome: { type: Boolean, default: true }
  },

  // Alert preferences
  alerts: {
    // Auto-assignment rules
    autoAssignment: {
      enabled: { type: Boolean, default: false },
      rules: [{
        name: String,
        priority: Number,
        conditions: {
          threatTypes: [String],
          severity: [String],
          sources: [String],
          timeRanges: [String],
          keywords: [String]
        },
        assignTo: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User'
        },
        enabled: { type: Boolean, default: true }
      }]
    },

    // Escalation settings
    escalation: {
      enabled: { type: Boolean, default: true },
      levels: [{
        level: Number,
        timeoutMinutes: Number,
        notifyUsers: [{
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User'
        }],
        channels: [String]
      }]
    },

    // Acknowledgment settings
    acknowledgment: {
      requireComments: { type: Boolean, default: false },
      autoAcknowledge: { type: Boolean, default: false },
      autoAcknowledgeAfterMinutes: Number,
      reminderInterval: Number // minutes
    }
  },

  // Report preferences
  reports: {
    // Default settings for new reports
    defaults: {
      format: {
        type: String,
        enum: ['PDF', 'CSV', 'JSON', 'HTML'],
        default: 'PDF'
      },
      includeCharts: { type: Boolean, default: true },
      includeMetrics: { type: Boolean, default: true },
      includeTrends: { type: Boolean, default: true },
      logo: String,
      footer: String,
      watermark: String
    },

    // Scheduled reports
    scheduled: [{
      name: String,
      reportType: String,
      frequency: {
        type: String,
        enum: ['Daily', 'Weekly', 'Monthly', 'Quarterly']
      },
      parameters: mongoose.Schema.Types.Mixed,
      recipients: [String],
      enabled: { type: Boolean, default: true },
      nextRun: Date
    }],

    // Auto-generation rules
    autoGeneration: {
      enabled: { type: Boolean, default: false },
      triggers: [{
        event: String,
        reportType: String,
        parameters: mongoose.Schema.Types.Mixed,
        delay: Number // minutes
      }]
    }
  },

  // Security preferences
  security: {
    // Session settings
    session: {
      timeout: {
        type: Number,
        default: 480 // 8 hours in minutes
      },
      maxConcurrentSessions: {
        type: Number,
        default: 3
      },
      requireReauthentication: {
        type: Boolean,
        default: false
      },
      reauthenticationInterval: Number // minutes
    },

    // Two-factor authentication
    twoFactor: {
      enabled: { type: Boolean, default: false },
      method: {
        type: String,
        enum: ['SMS', 'Email', 'TOTP', 'Hardware'],
        default: 'SMS'
      },
      backupCodes: [String],
      recoveryEmail: String
    },

    // Login security
    login: {
      allowMultipleDevices: { type: Boolean, default: true },
      requireStrongPassword: { type: Boolean, default: true },
      passwordExpiryDays: Number,
      lockoutAfterFailedAttempts: {
        type: Number,
        default: 5
      },
      lockoutDurationMinutes: {
        type: Number,
        default: 30
      }
    },

    // API security
    api: {
      requireIPWhitelist: { type: Boolean, default: false },
      allowedIPs: [String],
      keyRotationDays: {
        type: Number,
        default: 90
      },
      maxKeysPerUser: {
        type: Number,
        default: 5
      }
    }
  },

  // Integration preferences
  integrations: {
    // SIEM integration
    siem: {
      enabled: { type: Boolean, default: false },
      provider: String, // Splunk, QRadar, etc.
      endpoint: String,
      credentials: {
        encrypted: String,
        keyId: String
      },
      syncInterval: {
        type: Number,
        default: 300 // 5 minutes
      },
      eventTypes: [String]
    },

    // Ticketing system
    ticketing: {
      enabled: { type: Boolean, default: false },
      provider: String, // Jira, ServiceNow, etc.
      endpoint: String,
      credentials: {
        encrypted: String,
        keyId: String
      },
      autoCreateTickets: { type: Boolean, default: false },
      ticketTemplate: mongoose.Schema.Types.Mixed
    },

    // Cloud services
    cloud: {
      aws: {
        enabled: { type: Boolean, default: false },
        region: String,
        accessKeyId: String,
        secretAccessKey: String, // encrypted
        services: [String]
      },
      azure: {
        enabled: { type: Boolean, default: false },
        tenantId: String,
        clientId: String,
        clientSecret: String, // encrypted
        subscriptionId: String
      },
      gcp: {
        enabled: { type: Boolean, default: false },
        projectId: String,
        serviceAccountKey: String, // encrypted
        region: String
      }
    }
  },

  // Data retention preferences
  dataRetention: {
    logs: {
      retentionDays: {
        type: Number,
        default: 365
      },
      archiveAfterDays: {
        type: Number,
        default: 90
      },
      compressionEnabled: { type: Boolean, default: true }
    },
    threats: {
      retentionDays: {
        type: Number,
        default: 1095 // 3 years
      },
      archiveResolvedAfterDays: {
        type: Number,
        default: 180
      }
    },
    reports: {
      retentionDays: {
        type: Number,
        default: 2555 // 7 years
      },
      archiveAfterDays: {
        type: Number,
        default: 365
      }
    },
    alerts: {
      retentionDays: {
        type: Number,
        default: 730 // 2 years
      },
      archiveResolvedAfterDays: {
        type: Number,
        default: 90
      }
    }
  },

  // Privacy preferences
  privacy: {
    // Data sharing
    dataSharing: {
      allowTelemetry: { type: Boolean, default: true },
      allowUsageAnalytics: { type: Boolean, default: true },
      allowErrorReporting: { type: Boolean, default: true },
      shareAnonymizedData: { type: Boolean, default: false }
    },

    // Personal data
    personalData: {
      showFullName: { type: Boolean, default: true },
      showEmail: { type: Boolean, default: true },
      showLastLogin: { type: Boolean, default: true },
      allowProfileDiscovery: { type: Boolean, default: false }
    }
  },

  // Accessibility preferences
  accessibility: {
    highContrast: { type: Boolean, default: false },
    largeText: { type: Boolean, default: false },
    reducedMotion: { type: Boolean, default: false },
    screenReader: { type: Boolean, default: false },
    keyboardNavigation: { type: Boolean, default: true },
    colorBlindFriendly: { type: Boolean, default: false }
  },

  // Localization preferences
  localization: {
    language: {
      type: String,
      default: 'en'
    },
    region: String,
    timezone: {
      type: String,
      default: 'UTC'
    },
    dateFormat: {
      type: String,
      enum: ['MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD'],
      default: 'MM/DD/YYYY'
    },
    timeFormat: {
      type: String,
      enum: ['12h', '24h'],
      default: '12h'
    },
    currency: {
      type: String,
      default: 'USD'
    },
    numberFormat: {
      type: String,
      enum: ['1,234.56', '1.234,56', '1 234,56'],
      default: '1,234.56'
    }
  },

  // Backup and sync
  backup: {
    autoBackup: { type: Boolean, default: true },
    backupFrequency: {
      type: String,
      enum: ['Daily', 'Weekly', 'Monthly'],
      default: 'Weekly'
    },
    backupLocation: String,
    cloudSync: { type: Boolean, default: false },
    syncProvider: String,
    lastBackup: Date
  }
}, {
  timestamps: true
});

// Indexes
settingsSchema.index({ userId: 1 }, { unique: true });

// Instance methods
settingsSchema.methods = {
  /**
   * Check if notification is enabled for event and channel
   * @param {string} event - Event type
   * @param {string} channel - Notification channel
   * @returns {boolean} Notification enabled
   */
  isNotificationEnabled(event, channel) {
    // Check if channel is enabled
    if (!this.notifications.channels[channel]?.enabled) {
      return false;
    }

    // Check if event notification is enabled
    const eventConfig = this.notifications.events[event];
    if (!eventConfig?.enabled) {
      return false;
    }

    // Check if channel is included for this event
    if (eventConfig.channels && eventConfig.channels.length > 0) {
      return eventConfig.channels.includes(channel);
    }

    return true;
  },

  /**
   * Check if severity meets minimum threshold for event
   * @param {string} event - Event type
   * @param {string} severity - Event severity
   * @returns {boolean} Severity meets threshold
   */
  severityMeetsThreshold(event, severity) {
    const eventConfig = this.notifications.events[event];
    if (!eventConfig?.minimumSeverity) {
      return true;
    }

    const severityOrder = ['Low', 'Medium', 'High', 'Critical'];
    const eventMinIndex = severityOrder.indexOf(eventConfig.minimumSeverity);
    const severityIndex = severityOrder.indexOf(severity);

    return severityIndex >= eventMinIndex;
  },

  /**
   * Check if currently in quiet hours
   * @returns {boolean} In quiet hours
   */
  isInQuietHours() {
    if (!this.notifications.quietHours.enabled) {
      return false;
    }

    const now = new Date();
    const timezone = this.notifications.quietHours.timezone || 'UTC';
    
    // Convert to user's timezone
    const userTime = new Date(now.toLocaleString("en-US", {timeZone: timezone}));
    const currentTime = userTime.getHours() * 100 + userTime.getMinutes();
    
    const startTime = this.parseTime(this.notifications.quietHours.startTime);
    const endTime = this.parseTime(this.notifications.quietHours.endTime);

    // Check if weekends only and it's not weekend
    if (this.notifications.quietHours.weekendsOnly) {
      const dayOfWeek = userTime.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) { // 0 = Sunday, 6 = Saturday
        return false;
      }
    }

    // Handle overnight quiet hours
    if (startTime > endTime) {
      return currentTime >= startTime || currentTime <= endTime;
    } else {
      return currentTime >= startTime && currentTime <= endTime;
    }
  },

  /**
   * Parse time string to numeric format
   * @param {string} timeStr - Time string in HH:MM format
   * @returns {number} Time in HHMM format
   */
  parseTime(timeStr) {
    if (!timeStr) return 0;
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 100 + (minutes || 0);
  },

  /**
   * Get widget configuration
   * @param {string} widgetId - Widget ID
   * @returns {Object} Widget configuration
   */
  getWidgetConfig(widgetId) {
    return this.dashboard.widgets.find(widget => widget.id === widgetId);
  },

  /**
   * Update widget configuration
   * @param {string} widgetId - Widget ID
   * @param {Object} config - New configuration
   * @returns {Promise<void>}
   */
  async updateWidgetConfig(widgetId, config) {
    const widget = this.dashboard.widgets.find(w => w.id === widgetId);
    if (widget) {
      Object.assign(widget.config, config);
    } else {
      this.dashboard.widgets.push({
        id: widgetId,
        ...config,
        enabled: true
      });
    }
    return this.save();
  },

  /**
   * Get scheduled reports for user
   * @returns {Array} Scheduled reports
   */
  getScheduledReports() {
    return this.reports.scheduled.filter(report => report.enabled);
  },

  /**
   * Check if feature is enabled
   * @param {string} feature - Feature path (dot notation)
   * @returns {boolean} Feature enabled
   */
  isFeatureEnabled(feature) {
    const keys = feature.split('.');
    let current = this;
    
    for (const key of keys) {
      if (current && typeof current === 'object' && key in current) {
        current = current[key];
      } else {
        return false;
      }
    }
    
    return current === true;
  }
};

// Static methods
settingsSchema.statics = {
  /**
   * Get default settings for new user
   * @returns {Object} Default settings
   */
  getDefaultSettings() {
    return {
      notifications: {
        channels: {
          email: { enabled: true },
          sms: { enabled: false },
          push: { enabled: true },
          webhook: { enabled: false }
        },
        events: {
          threatDetected: { enabled: true, minimumSeverity: 'Medium' },
          alertTriggered: { enabled: true, minimumSeverity: 'Medium' },
          reportGenerated: { enabled: true }
        },
        digest: {
          enabled: true,
          frequency: 'Daily',
          time: '09:00'
        }
      },
      dashboard: {
        layout: 'Grid',
        theme: 'Light',
        refreshInterval: 30000,
        autoRefresh: true
      },
      security: {
        session: { timeout: 480 },
        login: { lockoutAfterFailedAttempts: 5 }
      }
    };
  },

  /**
   * Create default settings for user
   * @param {string} userId - User ID
   * @returns {Promise<Settings>} Settings document
   */
  async createDefaultSettings(userId) {
    const defaultSettings = this.getDefaultSettings();
    return this.create({
      userId,
      ...defaultSettings
    });
  },

  /**
   * Get or create settings for user
   * @param {string} userId - User ID
   * @returns {Promise<Settings>} Settings document
   */
  async getOrCreateForUser(userId) {
    let settings = await this.findOne({ userId });
    if (!settings) {
      settings = await this.createDefaultSettings(userId);
    }
    return settings;
  }
};

const Settings = mongoose.model('Settings', settingsSchema);

module.exports = Settings;
