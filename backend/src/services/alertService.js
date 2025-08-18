const { Alert, User } = require('../models');
const { logger } = require('../utils/logger');
const nodemailer = require('nodemailer');
const twilio = require('twilio');
const config = require('../config');

/**
 * Alert Service
 * Handles alert creation, delivery, and management
 */
class AlertService {
  constructor() {
    this.emailTransporter = null;
    this.twilioClient = null;
    this.alertQueues = new Map(); // For batching and rate limiting
    this.deliveryChannels = ['email', 'sms', 'webhook', 'realtime'];
    
    this.initializeNotificationServices();
  }

  /**
   * Initialize notification services
   */
  async initializeNotificationServices() {
    try {
      // Initialize email transporter
      if (config.EMAIL_HOST && config.EMAIL_USER) {
        this.emailTransporter = nodemailer.createTransporter({
          host: config.EMAIL_HOST,
          port: config.EMAIL_PORT,
          secure: config.EMAIL_SECURE,
          auth: {
            user: config.EMAIL_USER,
            pass: config.EMAIL_PASS
          }
        });

        // Verify email connection
        await this.emailTransporter.verify();
        logger.info('Email service initialized');
      }

      // Initialize SMS service
      if (config.TWILIO_ACCOUNT_SID && config.TWILIO_AUTH_TOKEN) {
        this.twilioClient = twilio(
          config.TWILIO_ACCOUNT_SID,
          config.TWILIO_AUTH_TOKEN
        );
        logger.info('SMS service initialized');
      }
    } catch (error) {
      logger.error('Notification services initialization error:', error.message);
    }
  }

  /**
   * Create and send an alert
   * @param {Object} alertData - Alert data
   * @param {Object} options - Delivery options
   * @returns {Promise<Object>} Created alert with delivery status
   */
  async createAlert(alertData, options = {}) {
    try {
      const {
        type,
        severity = 'Medium',
        title,
        message,
        source,
        userId,
        relatedEntity,
        entityId,
        metadata = {},
        channels = ['email'], // Default delivery channels
        priority = 'normal',
        scheduledFor = null
      } = alertData;

      // Validate required fields
      if (!type || !title || !message) {
        throw new Error('Type, title, and message are required');
      }

      // Create alert record
      const alert = new Alert({
        type,
        severity,
        title,
        message,
        source,
        userId,
        relatedEntity,
        entityId,
        metadata,
        priority,
        scheduledFor: scheduledFor ? new Date(scheduledFor) : null,
        status: scheduledFor ? 'Scheduled' : 'Active',
        delivery: {
          channels: channels,
          attempts: [],
          status: 'Pending'
        }
      });

      await alert.save();

      // If not scheduled, deliver immediately
      if (!scheduledFor) {
        const deliveryResult = await this.deliverAlert(alert, options);
        alert.delivery.status = deliveryResult.success ? 'Delivered' : 'Failed';
        alert.delivery.attempts = deliveryResult.attempts;
        await alert.save();
      }

      logger.info('Alert created', {
        alertId: alert._id,
        type: alert.type,
        severity: alert.severity,
        channels: channels
      });

      return {
        alert,
        delivered: !scheduledFor,
        deliveryStatus: alert.delivery.status
      };
    } catch (error) {
      logger.error('Alert creation error:', error.message);
      throw error;
    }
  }

  /**
   * Deliver alert through specified channels
   * @param {Object} alert - Alert object
   * @param {Object} options - Delivery options
   * @returns {Promise<Object>} Delivery result
   */
  async deliverAlert(alert, options = {}) {
    try {
      const deliveryAttempts = [];
      let overallSuccess = false;

      // Get recipients
      const recipients = await this.getAlertRecipients(alert);

      // Deliver through each channel
      for (const channel of alert.delivery.channels) {
        try {
          const channelResult = await this.deliverThroughChannel(
            alert,
            channel,
            recipients,
            options
          );

          deliveryAttempts.push({
            channel,
            timestamp: new Date(),
            success: channelResult.success,
            recipientCount: channelResult.recipientCount,
            error: channelResult.error
          });

          if (channelResult.success) {
            overallSuccess = true;
          }
        } catch (channelError) {
          deliveryAttempts.push({
            channel,
            timestamp: new Date(),
            success: false,
            error: channelError.message
          });
        }
      }

      return {
        success: overallSuccess,
        attempts: deliveryAttempts
      };
    } catch (error) {
      logger.error('Alert delivery error:', error.message);
      return {
        success: false,
        attempts: [{
          channel: 'all',
          timestamp: new Date(),
          success: false,
          error: error.message
        }]
      };
    }
  }

  /**
   * Deliver alert through specific channel
   * @param {Object} alert - Alert object
   * @param {string} channel - Delivery channel
   * @param {Array} recipients - Recipients list
   * @param {Object} options - Channel options
   * @returns {Promise<Object>} Channel delivery result
   */
  async deliverThroughChannel(alert, channel, recipients, options = {}) {
    switch (channel) {
      case 'email':
        return this.deliverEmail(alert, recipients, options);
      case 'sms':
        return this.deliverSMS(alert, recipients, options);
      case 'webhook':
        return this.deliverWebhook(alert, recipients, options);
      case 'realtime':
        return this.deliverRealtime(alert, recipients, options);
      default:
        throw new Error(`Unknown delivery channel: ${channel}`);
    }
  }

  /**
   * Deliver alert via email
   * @param {Object} alert - Alert object
   * @param {Array} recipients - Recipients list
   * @param {Object} options - Email options
   * @returns {Promise<Object>} Email delivery result
   */
  async deliverEmail(alert, recipients, options = {}) {
    try {
      if (!this.emailTransporter) {
        throw new Error('Email service not configured');
      }

      const emailRecipients = recipients.filter(r => r.email && r.notificationSettings?.email);
      if (emailRecipients.length === 0) {
        return {
          success: false,
          recipientCount: 0,
          error: 'No valid email recipients'
        };
      }

      const emailContent = this.generateEmailContent(alert, options);
      const sendPromises = emailRecipients.map(recipient =>
        this.sendEmail(recipient.email, emailContent, alert)
      );

      const results = await Promise.allSettled(sendPromises);
      const successCount = results.filter(r => r.status === 'fulfilled').length;

      return {
        success: successCount > 0,
        recipientCount: successCount,
        totalRecipients: emailRecipients.length,
        errors: results
          .filter(r => r.status === 'rejected')
          .map(r => r.reason.message)
      };
    } catch (error) {
      logger.error('Email delivery error:', error.message);
      return {
        success: false,
        recipientCount: 0,
        error: error.message
      };
    }
  }

  /**
   * Deliver alert via SMS
   * @param {Object} alert - Alert object
   * @param {Array} recipients - Recipients list
   * @param {Object} options - SMS options
   * @returns {Promise<Object>} SMS delivery result
   */
  async deliverSMS(alert, recipients, options = {}) {
    try {
      if (!this.twilioClient) {
        throw new Error('SMS service not configured');
      }

      const smsRecipients = recipients.filter(r => r.phone && r.notificationSettings?.sms);
      if (smsRecipients.length === 0) {
        return {
          success: false,
          recipientCount: 0,
          error: 'No valid SMS recipients'
        };
      }

      const smsContent = this.generateSMSContent(alert, options);
      const sendPromises = smsRecipients.map(recipient =>
        this.sendSMS(recipient.phone, smsContent, alert)
      );

      const results = await Promise.allSettled(sendPromises);
      const successCount = results.filter(r => r.status === 'fulfilled').length;

      return {
        success: successCount > 0,
        recipientCount: successCount,
        totalRecipients: smsRecipients.length,
        errors: results
          .filter(r => r.status === 'rejected')
          .map(r => r.reason.message)
      };
    } catch (error) {
      logger.error('SMS delivery error:', error.message);
      return {
        success: false,
        recipientCount: 0,
        error: error.message
      };
    }
  }

  /**
   * Deliver alert via webhook
   * @param {Object} alert - Alert object
   * @param {Array} recipients - Recipients list
   * @param {Object} options - Webhook options
   * @returns {Promise<Object>} Webhook delivery result
   */
  async deliverWebhook(alert, recipients, options = {}) {
    try {
      const webhookUrls = recipients
        .map(r => r.notificationSettings?.webhookUrl)
        .filter(Boolean);

      if (webhookUrls.length === 0) {
        return {
          success: false,
          recipientCount: 0,
          error: 'No webhook URLs configured'
        };
      }

      const webhookPayload = this.generateWebhookPayload(alert, options);
      const sendPromises = webhookUrls.map(url =>
        this.sendWebhook(url, webhookPayload, alert)
      );

      const results = await Promise.allSettled(sendPromises);
      const successCount = results.filter(r => r.status === 'fulfilled').length;

      return {
        success: successCount > 0,
        recipientCount: successCount,
        totalRecipients: webhookUrls.length
      };
    } catch (error) {
      logger.error('Webhook delivery error:', error.message);
      return {
        success: false,
        recipientCount: 0,
        error: error.message
      };
    }
  }

  /**
   * Deliver alert via real-time channel (WebSocket/Socket.io)
   * @param {Object} alert - Alert object
   * @param {Array} recipients - Recipients list
   * @param {Object} options - Real-time options
   * @returns {Promise<Object>} Real-time delivery result
   */
  async deliverRealtime(alert, recipients, options = {}) {
    try {
      // This would integrate with your Socket.io server
      // For now, we'll just log the delivery
      const realtimeRecipients = recipients.filter(r => r.notificationSettings?.realtime);

      logger.info('Real-time alert delivery', {
        alertId: alert._id,
        recipientCount: realtimeRecipients.length,
        alert: {
          type: alert.type,
          severity: alert.severity,
          title: alert.title,
          message: alert.message
        }
      });

      return {
        success: true,
        recipientCount: realtimeRecipients.length
      };
    } catch (error) {
      logger.error('Real-time delivery error:', error.message);
      return {
        success: false,
        recipientCount: 0,
        error: error.message
      };
    }
  }

  /**
   * Get alert recipients based on alert configuration
   * @param {Object} alert - Alert object
   * @returns {Promise<Array>} Recipients list
   */
  async getAlertRecipients(alert) {
    try {
      const recipients = [];

      // If alert is for specific user
      if (alert.userId) {
        const user = await User.findById(alert.userId).select('email phone notificationSettings');
        if (user) {
          recipients.push(user);
        }
      } else {
        // Get all users who should receive this type of alert
        const query = this.buildRecipientQuery(alert);
        const users = await User.find(query).select('email phone notificationSettings role');
        recipients.push(...users);
      }

      return recipients;
    } catch (error) {
      logger.error('Get recipients error:', error.message);
      return [];
    }
  }

  /**
   * Build query for finding alert recipients
   * @param {Object} alert - Alert object
   * @returns {Object} MongoDB query
   */
  buildRecipientQuery(alert) {
    const query = {
      status: 'Active'
    };

    // Role-based alert routing
    switch (alert.type) {
      case 'security_threat':
      case 'security_incident':
        query.role = { $in: ['Admin', 'Security_Analyst'] };
        break;
      case 'system_alert':
        query.role = { $in: ['Admin', 'Security_Analyst', 'Compliance_Officer'] };
        break;
      case 'compliance_alert':
        query.role = { $in: ['Admin', 'Compliance_Officer'] };
        break;
      case 'user_activity':
        if (alert.severity === 'Critical' || alert.severity === 'High') {
          query.role = { $in: ['Admin', 'Security_Analyst'] };
        } else {
          query.role = 'Admin';
        }
        break;
      default:
        query.role = 'Admin';
    }

    // Severity-based filtering
    if (alert.severity === 'Critical') {
      // All admins and security analysts for critical alerts
      query.role = { $in: ['Admin', 'Security_Analyst'] };
    }

    return query;
  }

  /**
   * Generate email content for alert
   * @param {Object} alert - Alert object
   * @param {Object} options - Email options
   * @returns {Object} Email content
   */
  generateEmailContent(alert, options = {}) {
    const severityColors = {
      'Critical': '#dc3545',
      'High': '#fd7e14',
      'Medium': '#ffc107',
      'Low': '#28a745'
    };

    const subject = `[${alert.severity}] ${alert.title}`;
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: ${severityColors[alert.severity] || '#007bff'}; color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0; font-size: 24px;">${alert.title}</h1>
          <p style="margin: 10px 0 0 0; font-size: 16px;">Severity: ${alert.severity}</p>
        </div>
        
        <div style="padding: 20px; background-color: #f8f9fa;">
          <h2 style="color: #343a40; margin-top: 0;">Alert Details</h2>
          
          <table style="width: 100%; border-collapse: collapse;">
            <tr style="border-bottom: 1px solid #dee2e6;">
              <td style="padding: 8px 0; font-weight: bold; color: #495057;">Type:</td>
              <td style="padding: 8px 0; color: #6c757d;">${alert.type}</td>
            </tr>
            <tr style="border-bottom: 1px solid #dee2e6;">
              <td style="padding: 8px 0; font-weight: bold; color: #495057;">Source:</td>
              <td style="padding: 8px 0; color: #6c757d;">${alert.source || 'System'}</td>
            </tr>
            <tr style="border-bottom: 1px solid #dee2e6;">
              <td style="padding: 8px 0; font-weight: bold; color: #495057;">Time:</td>
              <td style="padding: 8px 0; color: #6c757d;">${alert.createdAt.toLocaleString()}</td>
            </tr>
          </table>
          
          <div style="margin: 20px 0;">
            <h3 style="color: #343a40;">Message</h3>
            <p style="color: #495057; line-height: 1.5;">${alert.message}</p>
          </div>
          
          ${alert.metadata && Object.keys(alert.metadata).length > 0 ? `
            <div style="margin: 20px 0;">
              <h3 style="color: #343a40;">Additional Information</h3>
              <pre style="background-color: #e9ecef; padding: 10px; border-radius: 4px; overflow-x: auto; font-size: 12px;">${JSON.stringify(alert.metadata, null, 2)}</pre>
            </div>
          ` : ''}
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6; text-align: center;">
            <p style="color: #6c757d; margin: 0;">This is an automated alert from your Cybersecurity Platform</p>
          </div>
        </div>
      </div>
    `;

    return {
      subject,
      html,
      text: `${alert.title}\n\nSeverity: ${alert.severity}\nType: ${alert.type}\nTime: ${alert.createdAt.toLocaleString()}\n\n${alert.message}`
    };
  }

  /**
   * Generate SMS content for alert
   * @param {Object} alert - Alert object
   * @param {Object} options - SMS options
   * @returns {string} SMS content
   */
  generateSMSContent(alert, options = {}) {
    return `ALERT [${alert.severity}]: ${alert.title}\n\n${alert.message}\n\nTime: ${alert.createdAt.toLocaleString()}\n\nSource: ${alert.source || 'System'}`;
  }

  /**
   * Generate webhook payload for alert
   * @param {Object} alert - Alert object
   * @param {Object} options - Webhook options
   * @returns {Object} Webhook payload
   */
  generateWebhookPayload(alert, options = {}) {
    return {
      event: 'alert_created',
      timestamp: alert.createdAt.toISOString(),
      alert: {
        id: alert._id,
        type: alert.type,
        severity: alert.severity,
        title: alert.title,
        message: alert.message,
        source: alert.source,
        priority: alert.priority,
        metadata: alert.metadata,
        relatedEntity: alert.relatedEntity,
        entityId: alert.entityId
      }
    };
  }

  /**
   * Send individual email
   * @param {string} email - Recipient email
   * @param {Object} content - Email content
   * @param {Object} alert - Alert object
   * @returns {Promise<Object>} Send result
   */
  async sendEmail(email, content, alert) {
    try {
      const result = await this.emailTransporter.sendMail({
        from: config.EMAIL_FROM || config.EMAIL_USER,
        to: email,
        subject: content.subject,
        text: content.text,
        html: content.html
      });

      logger.info('Email sent', {
        alertId: alert._id,
        recipient: email,
        messageId: result.messageId
      });

      return result;
    } catch (error) {
      logger.error('Email send error:', {
        alertId: alert._id,
        recipient: email,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Send individual SMS
   * @param {string} phone - Recipient phone number
   * @param {string} message - SMS message
   * @param {Object} alert - Alert object
   * @returns {Promise<Object>} Send result
   */
  async sendSMS(phone, message, alert) {
    try {
      const result = await this.twilioClient.messages.create({
        body: message,
        from: config.TWILIO_PHONE_NUMBER,
        to: phone
      });

      logger.info('SMS sent', {
        alertId: alert._id,
        recipient: phone,
        sid: result.sid
      });

      return result;
    } catch (error) {
      logger.error('SMS send error:', {
        alertId: alert._id,
        recipient: phone,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Send webhook notification
   * @param {string} url - Webhook URL
   * @param {Object} payload - Webhook payload
   * @param {Object} alert - Alert object
   * @returns {Promise<Object>} Send result
   */
  async sendWebhook(url, payload, alert) {
    try {
      const fetch = require('node-fetch');
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'CybersecurityPlatform/1.0'
        },
        body: JSON.stringify(payload),
        timeout: 5000
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      logger.info('Webhook sent', {
        alertId: alert._id,
        url: url,
        status: response.status
      });

      return { status: response.status };
    } catch (error) {
      logger.error('Webhook send error:', {
        alertId: alert._id,
        url: url,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Get alerts with filtering and pagination
   * @param {Object} filters - Filter criteria
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Paginated alerts
   */
  async getAlerts(filters = {}, options = {}) {
    try {
      const {
        page = 1,
        limit = 50,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = options;

      const query = this.buildAlertQuery(filters);
      const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

      const skip = (page - 1) * limit;

      const [alerts, total] = await Promise.all([
        Alert.find(query)
          .sort(sort)
          .skip(skip)
          .limit(limit)
          .populate('userId', 'email role')
          .lean(),
        Alert.countDocuments(query)
      ]);

      return {
        alerts,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      logger.error('Get alerts error:', error.message);
      throw error;
    }
  }

  /**
   * Build MongoDB query from filters
   * @param {Object} filters - Filter criteria
   * @returns {Object} MongoDB query
   */
  buildAlertQuery(filters) {
    const query = {};

    if (filters.type) {
      if (Array.isArray(filters.type)) {
        query.type = { $in: filters.type };
      } else {
        query.type = filters.type;
      }
    }

    if (filters.severity) {
      if (Array.isArray(filters.severity)) {
        query.severity = { $in: filters.severity };
      } else {
        query.severity = filters.severity;
      }
    }

    if (filters.status) {
      query.status = filters.status;
    }

    if (filters.userId) {
      query.userId = filters.userId;
    }

    if (filters.source) {
      query.source = filters.source;
    }

    if (filters.dateRange) {
      query.createdAt = {};
      if (filters.dateRange.from) {
        query.createdAt.$gte = new Date(filters.dateRange.from);
      }
      if (filters.dateRange.to) {
        query.createdAt.$lte = new Date(filters.dateRange.to);
      }
    }

    return query;
  }

  /**
   * Mark alert as read/acknowledged
   * @param {string} alertId - Alert ID
   * @param {string} userId - User ID who acknowledged
   * @returns {Promise<Object>} Updated alert
   */
  async acknowledgeAlert(alertId, userId) {
    try {
      const alert = await Alert.findByIdAndUpdate(
        alertId,
        {
          status: 'Acknowledged',
          acknowledgedBy: userId,
          acknowledgedAt: new Date()
        },
        { new: true }
      );

      if (!alert) {
        throw new Error('Alert not found');
      }

      logger.info('Alert acknowledged', {
        alertId,
        userId,
        acknowledgedAt: alert.acknowledgedAt
      });

      return alert;
    } catch (error) {
      logger.error('Alert acknowledgment error:', error.message);
      throw error;
    }
  }

  /**
   * Get alert statistics
   * @param {Object} filters - Filter criteria
   * @returns {Promise<Object>} Alert statistics
   */
  async getAlertStatistics(filters = {}) {
    try {
      const query = this.buildAlertQuery(filters);

      const [
        total,
        severityBreakdown,
        typeBreakdown,
        statusBreakdown,
        deliveryStats
      ] = await Promise.all([
        Alert.countDocuments(query),
        this.getSeverityBreakdown(query),
        this.getTypeBreakdown(query),
        this.getStatusBreakdown(query),
        this.getDeliveryStats(query)
      ]);

      return {
        total,
        breakdowns: {
          severity: severityBreakdown,
          type: typeBreakdown,
          status: statusBreakdown
        },
        delivery: deliveryStats
      };
    } catch (error) {
      logger.error('Alert statistics error:', error.message);
      throw error;
    }
  }

  // Helper methods for statistics
  async getSeverityBreakdown(query) {
    return Alert.aggregate([
      { $match: query },
      { $group: { _id: '$severity', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
  }

  async getTypeBreakdown(query) {
    return Alert.aggregate([
      { $match: query },
      { $group: { _id: '$type', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
  }

  async getStatusBreakdown(query) {
    return Alert.aggregate([
      { $match: query },
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
  }

  async getDeliveryStats(query) {
    return Alert.aggregate([
      { $match: query },
      { $group: { _id: '$delivery.status', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
  }
}

module.exports = new AlertService();
