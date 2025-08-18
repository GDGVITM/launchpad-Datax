const Alert = require('../models/Alert');
const alertService = require('../services/alertService');
const BaseController = require('./baseController');
const Joi = require('joi');

/**
 * Alert Controller
 * Handles security alert management and notifications
 */
class AlertController extends BaseController {
  constructor() {
    super(Alert, 'Alert');
  }

  /**
   * Get alerts with filtering
   */
  async getAlerts(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = Math.min(parseInt(req.query.limit) || 20, 100);
      const skip = (page - 1) * limit;

      const filter = this.buildAlertFilter(req.query, req.user);
      const sort = this.buildSort(req.query.sort || 'createdAt:desc');

      const [alerts, total] = await Promise.all([
        Alert.find(filter)
          .populate('organizationId', 'name')
          .populate('triggeredBy', 'name email')
          .populate('resolvedBy', 'name email')
          .sort(sort)
          .skip(skip)
          .limit(limit),
        Alert.countDocuments(filter)
      ]);

      const pagination = {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      };

      return this.sendSuccess(res, {
        alerts,
        pagination
      }, 'Alerts retrieved successfully');

    } catch (error) {
      console.error('Get alerts error:', error);
      return this.sendError(res, 'Failed to retrieve alerts');
    }
  }

  /**
   * Get alert by ID
   */
  async getAlertById(req, res) {
    try {
      const alert = await Alert.findById(req.params.id)
        .populate('organizationId', 'name')
        .populate('triggeredBy', 'name email')
        .populate('resolvedBy', 'name email');

      if (!alert) {
        return this.sendNotFound(res, 'Alert not found');
      }

      // Check permissions
      if (req.user.role !== 'admin' && 
          req.user.organizationId.toString() !== alert.organizationId.toString()) {
        return this.sendError(res, 'Access denied', 403);
      }

      return this.sendSuccess(res, alert, 'Alert retrieved successfully');

    } catch (error) {
      console.error('Get alert error:', error);
      return this.sendError(res, 'Failed to retrieve alert');
    }
  }

  /**
   * Create new alert
   */
  async createAlert(req, res) {
    try {
      const { error } = this.validateAlertCreation(req.body);
      if (error) {
        return this.sendValidationError(res, error.details);
      }

      const alertData = {
        ...req.body,
        organizationId: req.user.organizationId,
        triggeredBy: req.user.id,
        status: 'active',
        createdAt: new Date()
      };

      const alert = await alertService.createAlert(alertData);

      return this.sendSuccess(res, alert, 'Alert created successfully', 201);

    } catch (error) {
      console.error('Create alert error:', error);
      return this.sendError(res, 'Failed to create alert');
    }
  }

  /**
   * Update alert status
   */
  async updateAlertStatus(req, res) {
    try {
      const { status, resolutionNotes } = req.body;
      const alertId = req.params.id;

      if (!status) {
        return this.sendError(res, 'Status is required', 400);
      }

      const alert = await Alert.findById(alertId);
      if (!alert) {
        return this.sendNotFound(res, 'Alert not found');
      }

      // Check permissions
      if (req.user.role !== 'admin' && 
          req.user.organizationId.toString() !== alert.organizationId.toString()) {
        return this.sendError(res, 'Access denied', 403);
      }

      const updateData = {
        status,
        lastUpdated: new Date()
      };

      if (status === 'resolved' || status === 'dismissed') {
        updateData.resolvedAt = new Date();
        updateData.resolvedBy = req.user.id;
        if (resolutionNotes) {
          updateData.resolutionNotes = resolutionNotes;
        }
      }

      const updatedAlert = await Alert.findByIdAndUpdate(
        alertId,
        updateData,
        { new: true }
      ).populate('organizationId', 'name')
       .populate('triggeredBy', 'name email')
       .populate('resolvedBy', 'name email');

      return this.sendSuccess(res, updatedAlert, 'Alert status updated successfully');

    } catch (error) {
      console.error('Update alert status error:', error);
      return this.sendError(res, 'Failed to update alert status');
    }
  }

  /**
   * Acknowledge alert
   */
  async acknowledgeAlert(req, res) {
    try {
      const alertId = req.params.id;

      const alert = await Alert.findById(alertId);
      if (!alert) {
        return this.sendNotFound(res, 'Alert not found');
      }

      // Check permissions
      if (req.user.role !== 'admin' && 
          req.user.organizationId.toString() !== alert.organizationId.toString()) {
        return this.sendError(res, 'Access denied', 403);
      }

      if (alert.isAcknowledged) {
        return this.sendError(res, 'Alert is already acknowledged', 400);
      }

      const updatedAlert = await Alert.findByIdAndUpdate(
        alertId,
        {
          isAcknowledged: true,
          acknowledgedAt: new Date(),
          acknowledgedBy: req.user.id
        },
        { new: true }
      ).populate('organizationId', 'name')
       .populate('acknowledgedBy', 'name email');

      return this.sendSuccess(res, updatedAlert, 'Alert acknowledged successfully');

    } catch (error) {
      console.error('Acknowledge alert error:', error);
      return this.sendError(res, 'Failed to acknowledge alert');
    }
  }

  /**
   * Get alert statistics
   */
  async getAlertStats(req, res) {
    try {
      const filter = this.buildAlertFilter(req.query, req.user);
      
      const stats = await alertService.getAlertStatistics(filter);

      return this.sendSuccess(res, stats, 'Alert statistics retrieved successfully');

    } catch (error) {
      console.error('Get alert stats error:', error);
      return this.sendError(res, 'Failed to retrieve alert statistics');
    }
  }

  /**
   * Get alert trends
   */
  async getAlertTrends(req, res) {
    try {
      const { period = '7d', granularity = 'hour' } = req.query;

      const filter = {
        organizationId: req.user.role === 'admin' ? 
          (req.query.organizationId || req.user.organizationId) : 
          req.user.organizationId
      };

      const trends = await alertService.getAlertTrends(filter, period, granularity);

      return this.sendSuccess(res, trends, 'Alert trends retrieved successfully');

    } catch (error) {
      console.error('Get alert trends error:', error);
      return this.sendError(res, 'Failed to retrieve alert trends');
    }
  }

  /**
   * Test alert configuration
   */
  async testAlert(req, res) {
    try {
      const { alertType, configuration } = req.body;

      if (!alertType || !configuration) {
        return this.sendError(res, 'Alert type and configuration are required', 400);
      }

      // Check permissions
      if (req.user.role !== 'admin') {
        return this.sendError(res, 'Admin access required to test alerts', 403);
      }

      const testResult = await alertService.testAlertConfiguration(
        alertType,
        configuration,
        req.user.organizationId
      );

      return this.sendSuccess(res, testResult, 'Alert test completed successfully');

    } catch (error) {
      console.error('Test alert error:', error);
      return this.sendError(res, 'Failed to test alert configuration');
    }
  }

  /**
   * Bulk alert operations
   */
  async bulkOperation(req, res) {
    try {
      const { operation, alertIds, data } = req.body;

      if (!operation || !alertIds || !Array.isArray(alertIds)) {
        return this.sendError(res, 'Operation and alertIds array are required', 400);
      }

      // Check permissions
      if (req.user.role !== 'admin') {
        return this.sendError(res, 'Admin access required for bulk operations', 403);
      }

      let result;
      switch (operation) {
        case 'acknowledge':
          result = await Alert.updateMany(
            { _id: { $in: alertIds } },
            {
              isAcknowledged: true,
              acknowledgedAt: new Date(),
              acknowledgedBy: req.user.id
            }
          );
          break;
        case 'resolve':
          result = await Alert.updateMany(
            { _id: { $in: alertIds } },
            {
              status: 'resolved',
              resolvedAt: new Date(),
              resolvedBy: req.user.id,
              resolutionNotes: data.resolutionNotes || 'Bulk resolved'
            }
          );
          break;
        case 'dismiss':
          result = await Alert.updateMany(
            { _id: { $in: alertIds } },
            {
              status: 'dismissed',
              resolvedAt: new Date(),
              resolvedBy: req.user.id,
              resolutionNotes: data.resolutionNotes || 'Bulk dismissed'
            }
          );
          break;
        case 'updateSeverity':
          if (!data.severity) {
            return this.sendError(res, 'Severity is required', 400);
          }
          result = await Alert.updateMany(
            { _id: { $in: alertIds } },
            { severity: data.severity }
          );
          break;
        default:
          return this.sendError(res, 'Invalid operation', 400);
      }

      return this.sendSuccess(res, {
        modifiedCount: result.modifiedCount
      }, `Bulk ${operation} completed successfully`);

    } catch (error) {
      console.error('Bulk operation error:', error);
      return this.sendError(res, 'Bulk operation failed');
    }
  }

  /**
   * Get alert configuration
   */
  async getAlertConfig(req, res) {
    try {
      // Check permissions
      if (req.user.role !== 'admin') {
        return this.sendError(res, 'Admin access required to view alert configuration', 403);
      }

      const config = await alertService.getAlertConfiguration(req.user.organizationId);

      return this.sendSuccess(res, config, 'Alert configuration retrieved successfully');

    } catch (error) {
      console.error('Get alert config error:', error);
      return this.sendError(res, 'Failed to retrieve alert configuration');
    }
  }

  /**
   * Update alert configuration
   */
  async updateAlertConfig(req, res) {
    try {
      const { error } = this.validateAlertConfig(req.body);
      if (error) {
        return this.sendValidationError(res, error.details);
      }

      // Check permissions
      if (req.user.role !== 'admin') {
        return this.sendError(res, 'Admin access required to update alert configuration', 403);
      }

      const config = await alertService.updateAlertConfiguration(
        req.user.organizationId,
        req.body
      );

      return this.sendSuccess(res, config, 'Alert configuration updated successfully');

    } catch (error) {
      console.error('Update alert config error:', error);
      return this.sendError(res, 'Failed to update alert configuration');
    }
  }

  /**
   * Build alert-specific filter
   */
  buildAlertFilter(query, user) {
    const filter = {};

    // Organization filter
    if (user.role !== 'admin') {
      filter.organizationId = user.organizationId;
    } else if (query.organizationId) {
      filter.organizationId = query.organizationId;
    }

    // Alert type filter
    if (query.alertType) {
      if (Array.isArray(query.alertType)) {
        filter.alertType = { $in: query.alertType };
      } else {
        filter.alertType = query.alertType;
      }
    }

    // Severity filter
    if (query.severity) {
      if (Array.isArray(query.severity)) {
        filter.severity = { $in: query.severity };
      } else {
        filter.severity = query.severity;
      }
    }

    // Status filter
    if (query.status) {
      if (Array.isArray(query.status)) {
        filter.status = { $in: query.status };
      } else {
        filter.status = query.status;
      }
    }

    // Acknowledgment filter
    if (query.isAcknowledged !== undefined) {
      filter.isAcknowledged = query.isAcknowledged === 'true';
    }

    // Search functionality
    if (query.search) {
      filter.$or = [
        { title: { $regex: query.search, $options: 'i' } },
        { description: { $regex: query.search, $options: 'i' } },
        { source: { $regex: query.search, $options: 'i' } }
      ];
    }

    // Date range filter
    if (query.startDate || query.endDate) {
      filter.createdAt = {};
      if (query.startDate) {
        filter.createdAt.$gte = new Date(query.startDate);
      }
      if (query.endDate) {
        filter.createdAt.$lte = new Date(query.endDate);
      }
    }

    return filter;
  }

  /**
   * Validation schemas
   */
  validateAlertCreation(data) {
    const schema = Joi.object({
      alertType: Joi.string().valid(
        'security_breach', 'malware_detected', 'suspicious_activity',
        'failed_login_attempts', 'unauthorized_access', 'data_exfiltration',
        'system_failure', 'configuration_change', 'threshold_exceeded', 'other'
      ).required(),
      severity: Joi.string().valid('low', 'medium', 'high', 'critical').required(),
      title: Joi.string().required(),
      description: Joi.string().required(),
      source: Joi.string().required(),
      metadata: Joi.object().optional(),
      affectedAssets: Joi.array().items(Joi.string()).optional(),
      recommendedActions: Joi.array().items(Joi.string()).optional()
    });

    return schema.validate(data);
  }

  validateAlertConfig(data) {
    const schema = Joi.object({
      emailNotifications: Joi.object({
        enabled: Joi.boolean().required(),
        recipients: Joi.array().items(Joi.string().email()).optional(),
        severityThreshold: Joi.string().valid('low', 'medium', 'high', 'critical').optional()
      }).optional(),
      smsNotifications: Joi.object({
        enabled: Joi.boolean().required(),
        recipients: Joi.array().items(Joi.string()).optional(),
        severityThreshold: Joi.string().valid('low', 'medium', 'high', 'critical').optional()
      }).optional(),
      webhookNotifications: Joi.object({
        enabled: Joi.boolean().required(),
        url: Joi.string().uri().optional(),
        headers: Joi.object().optional()
      }).optional(),
      alertRules: Joi.array().items(Joi.object({
        name: Joi.string().required(),
        condition: Joi.string().required(),
        action: Joi.string().required(),
        enabled: Joi.boolean().default(true)
      })).optional()
    });

    return schema.validate(data);
  }

  getPopulateFields() {
    return 'organizationId triggeredBy resolvedBy acknowledgedBy';
  }

  getSearchFields() {
    return ['title', 'description', 'source'];
  }
}

module.exports = new AlertController();
