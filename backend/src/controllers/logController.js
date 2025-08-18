const Log = require('../models/Log');
const logService = require('../services/logService');
const blockchainService = require('../services/blockchainService');
const BaseController = require('./baseController');
const Joi = require('joi');

/**
 * Log Controller
 * Handles security log management with blockchain anchoring
 */
class LogController extends BaseController {
  constructor() {
    super(Log, 'Log');
  }

  /**
   * Create new security log with blockchain anchoring
   */
  async createLog(req, res) {
    try {
      const { error } = this.validateLogCreation(req.body);
      if (error) {
        return this.sendValidationError(res, error.details);
      }

      const logData = {
        ...req.body,
        organizationId: req.user.organizationId,
        userId: req.user.id,
        sourceIP: req.ip,
        userAgent: req.get('User-Agent'),
        timestamp: new Date()
      };

      // Create log
      const log = await logService.createLog(logData);

      // Anchor to blockchain if it's a high-priority event
      const highPriorityEvents = ['security_breach', 'admin_action', 'data_access', 'system_alert'];
      if (process.env.BLOCKCHAIN_ENABLED === 'true' && 
          highPriorityEvents.includes(logData.eventType)) {
        try {
          await logService.anchorLogImmediately(log._id);
        } catch (blockchainError) {
          console.error('Blockchain anchoring failed:', blockchainError);
          // Continue without blockchain anchoring
        }
      }

      return this.sendSuccess(res, log, 'Log created successfully', 201);

    } catch (error) {
      console.error('Create log error:', error);
      return this.sendError(res, 'Failed to create log');
    }
  }

  /**
   * Get logs with advanced filtering
   */
  async getLogs(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = Math.min(parseInt(req.query.limit) || 20, 100);
      const skip = (page - 1) * limit;

      const filter = this.buildLogFilter(req.query, req.user);
      const sort = this.buildSort(req.query.sort || 'timestamp:desc');

      const [logs, total] = await Promise.all([
        Log.find(filter)
          .populate('userId', 'name email')
          .populate('organizationId', 'name')
          .sort(sort)
          .skip(skip)
          .limit(limit),
        Log.countDocuments(filter)
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
        logs,
        pagination
      }, 'Logs retrieved successfully');

    } catch (error) {
      console.error('Get logs error:', error);
      return this.sendError(res, 'Failed to retrieve logs');
    }
  }

  /**
   * Get log by ID
   */
  async getLogById(req, res) {
    try {
      const log = await Log.findById(req.params.id)
        .populate('userId', 'name email')
        .populate('organizationId', 'name');

      if (!log) {
        return this.sendNotFound(res, 'Log not found');
      }

      // Check permissions
      if (req.user.role !== 'admin' && 
          req.user.organizationId.toString() !== log.organizationId.toString()) {
        return this.sendError(res, 'Access denied', 403);
      }

      return this.sendSuccess(res, log, 'Log retrieved successfully');

    } catch (error) {
      console.error('Get log error:', error);
      return this.sendError(res, 'Failed to retrieve log');
    }
  }

  /**
   * Verify log integrity using blockchain
   */
  async verifyLog(req, res) {
    try {
      const logId = req.params.id;

      const log = await Log.findById(logId);
      if (!log) {
        return this.sendNotFound(res, 'Log not found');
      }

      // Check permissions
      if (req.user.role !== 'admin' && 
          req.user.organizationId.toString() !== log.organizationId.toString()) {
        return this.sendError(res, 'Access denied', 403);
      }

      if (!log.blockchainHash && !log.chainShieldLogId) {
        return this.sendError(res, 'Log is not anchored to blockchain', 400);
      }

      const verificationResult = await logService.verifyLogIntegrity(logId);

      return this.sendSuccess(res, verificationResult, 'Log verification completed');

    } catch (error) {
      console.error('Verify log error:', error);
      return this.sendError(res, 'Failed to verify log');
    }
  }

  /**
   * Anchor log to blockchain
   */
  async anchorLog(req, res) {
    try {
      const logId = req.params.id;

      const log = await Log.findById(logId);
      if (!log) {
        return this.sendNotFound(res, 'Log not found');
      }

      // Check permissions
      if (req.user.role !== 'admin' && 
          req.user.organizationId.toString() !== log.organizationId.toString()) {
        return this.sendError(res, 'Access denied', 403);
      }

      if (log.blockchainHash || log.chainShieldLogId) {
        return this.sendError(res, 'Log is already anchored to blockchain', 400);
      }

      if (process.env.BLOCKCHAIN_ENABLED !== 'true') {
        return this.sendError(res, 'Blockchain is not enabled', 400);
      }

      await logService.anchorLogImmediately(logId);

      const updatedLog = await Log.findById(logId);

      return this.sendSuccess(res, updatedLog, 'Log anchored to blockchain successfully');

    } catch (error) {
      console.error('Anchor log error:', error);
      return this.sendError(res, 'Failed to anchor log to blockchain');
    }
  }

  /**
   * Get log statistics
   */
  async getLogStats(req, res) {
    try {
      const filter = this.buildLogFilter(req.query, req.user);
      
      const stats = await logService.getLogStatistics(filter);

      return this.sendSuccess(res, stats, 'Log statistics retrieved successfully');

    } catch (error) {
      console.error('Get log stats error:', error);
      return this.sendError(res, 'Failed to retrieve log statistics');
    }
  }

  /**
   * Export logs
   */
  async exportLogs(req, res) {
    try {
      const { format = 'json', startDate, endDate } = req.query;

      if (!['json', 'csv'].includes(format)) {
        return this.sendError(res, 'Invalid format. Supported formats: json, csv', 400);
      }

      const filter = this.buildLogFilter(req.query, req.user);

      const logs = await Log.find(filter)
        .populate('userId', 'name email')
        .populate('organizationId', 'name')
        .sort({ timestamp: -1 })
        .limit(10000); // Limit for performance

      if (format === 'csv') {
        const csv = await logService.convertLogsToCSV(logs);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=security_logs.csv');
        return res.send(csv);
      }

      const exportData = {
        metadata: {
          exportedAt: new Date().toISOString(),
          totalLogs: logs.length,
          exportedBy: req.user.email,
          dateRange: {
            start: startDate,
            end: endDate
          }
        },
        logs
      };

      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', 'attachment; filename=security_logs.json');
      return res.send(JSON.stringify(exportData, null, 2));

    } catch (error) {
      console.error('Export logs error:', error);
      return this.sendError(res, 'Failed to export logs');
    }
  }

  /**
   * Bulk log operations
   */
  async bulkOperation(req, res) {
    try {
      const { operation, logIds, data } = req.body;

      if (!operation || !logIds || !Array.isArray(logIds)) {
        return this.sendError(res, 'Operation and logIds array are required', 400);
      }

      // Check permissions
      if (req.user.role !== 'admin') {
        return this.sendError(res, 'Admin access required for bulk operations', 403);
      }

      let result;
      switch (operation) {
        case 'anchor':
          if (process.env.BLOCKCHAIN_ENABLED !== 'true') {
            return this.sendError(res, 'Blockchain is not enabled', 400);
          }
          result = await logService.bulkAnchorLogs(logIds);
          break;
        case 'verify':
          result = await logService.bulkVerifyLogs(logIds);
          break;
        case 'updateSeverity':
          if (!data.severity) {
            return this.sendError(res, 'Severity is required', 400);
          }
          result = await Log.updateMany(
            { _id: { $in: logIds } },
            { severity: data.severity }
          );
          break;
        default:
          return this.sendError(res, 'Invalid operation', 400);
      }

      return this.sendSuccess(res, result, `Bulk ${operation} completed successfully`);

    } catch (error) {
      console.error('Bulk operation error:', error);
      return this.sendError(res, 'Bulk operation failed');
    }
  }

  /**
   * Build log-specific filter
   */
  buildLogFilter(query, user) {
    const filter = {};

    // Organization filter
    if (user.role !== 'admin') {
      filter.organizationId = user.organizationId;
    } else if (query.organizationId) {
      filter.organizationId = query.organizationId;
    }

    // Event type filter
    if (query.eventType) {
      if (Array.isArray(query.eventType)) {
        filter.eventType = { $in: query.eventType };
      } else {
        filter.eventType = query.eventType;
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

    // Source filter
    if (query.source) {
      filter.source = { $regex: query.source, $options: 'i' };
    }

    // User ID filter
    if (query.userId) {
      filter.userId = query.userId;
    }

    // Blockchain anchored filter
    if (query.isAnchored !== undefined) {
      if (query.isAnchored === 'true') {
        filter.$or = [
          { blockchainHash: { $exists: true, $ne: null } },
          { chainShieldLogId: { $exists: true, $ne: null } }
        ];
      } else {
        filter.$and = [
          { blockchainHash: { $exists: false } },
          { chainShieldLogId: { $exists: false } }
        ];
      }
    }

    // Search functionality
    if (query.search) {
      filter.$or = [
        { message: { $regex: query.search, $options: 'i' } },
        { source: { $regex: query.search, $options: 'i' } },
        { details: { $regex: query.search, $options: 'i' } }
      ];
    }

    // Date range filter
    if (query.startDate || query.endDate) {
      filter.timestamp = {};
      if (query.startDate) {
        filter.timestamp.$gte = new Date(query.startDate);
      }
      if (query.endDate) {
        filter.timestamp.$lte = new Date(query.endDate);
      }
    }

    return filter;
  }

  /**
   * Validation schemas
   */
  validateLogCreation(data) {
    const schema = Joi.object({
      eventType: Joi.string().valid(
        'user_login', 'user_logout', 'failed_login', 'password_change',
        'data_access', 'data_modification', 'admin_action', 'config_change',
        'security_breach', 'malware_detection', 'suspicious_activity',
        'system_error', 'system_alert', 'api_call', 'file_upload', 'other'
      ).required(),
      severity: Joi.string().valid('low', 'medium', 'high', 'critical').required(),
      message: Joi.string().required(),
      source: Joi.string().required(),
      details: Joi.object().optional(),
      affectedResource: Joi.string().optional(),
      riskScore: Joi.number().min(0).max(100).optional()
    });

    return schema.validate(data);
  }

  getPopulateFields() {
    return 'userId organizationId';
  }

  getSearchFields() {
    return ['message', 'source', 'details'];
  }
}

module.exports = new LogController();
