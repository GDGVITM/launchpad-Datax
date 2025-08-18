const Threat = require('../models/Threat');
const threatService = require('../services/threatDetectionService');
const BaseController = require('./baseController');
const Joi = require('joi');

/**
 * Threat Detection Controller
 * Handles threat detection and analysis operations
 */
class ThreatDetectionController extends BaseController {
  constructor() {
    super(Threat, 'Threat');
  }

  /**
   * Get threat detections with filtering
   */
  async getThreats(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = Math.min(parseInt(req.query.limit) || 20, 100);
      const skip = (page - 1) * limit;

      const filter = this.buildThreatFilter(req.query, req.user);
      const sort = this.buildSort(req.query.sort || 'detectedAt:desc');

      const [threats, total] = await Promise.all([
        Threat.find(filter)
          .populate('organizationId', 'name')
          .populate('resolvedBy', 'name email')
          .sort(sort)
          .skip(skip)
          .limit(limit),
        Threat.countDocuments(filter)
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
        threats,
        pagination
      }, 'Threats retrieved successfully');

    } catch (error) {
      console.error('Get threats error:', error);
      return this.sendError(res, 'Failed to retrieve threats');
    }
  }

  /**
   * Get threat by ID
   */
  async getThreatById(req, res) {
    try {
      const threat = await Threat.findById(req.params.id)
        .populate('organizationId', 'name')
        .populate('resolvedBy', 'name email');

      if (!threat) {
        return this.sendNotFound(res, 'Threat not found');
      }

      // Check permissions
      if (req.user.role !== 'admin' && 
          req.user.organizationId.toString() !== threat.organizationId.toString()) {
        return this.sendError(res, 'Access denied', 403);
      }

      return this.sendSuccess(res, threat, 'Threat retrieved successfully');

    } catch (error) {
      console.error('Get threat error:', error);
      return this.sendError(res, 'Failed to retrieve threat');
    }
  }

  /**
   * Create new threat detection
   */
  async createThreat(req, res) {
    try {
      const { error } = this.validateThreatCreation(req.body);
      if (error) {
        return this.sendValidationError(res, error.details);
      }

      const threatData = {
        ...req.body,
        organizationId: req.user.organizationId,
        detectedAt: new Date(),
        status: 'open'
      };

      const threat = await threatService.createThreat(threatData);

      return this.sendSuccess(res, threat, 'Threat detection created successfully', 201);

    } catch (error) {
      console.error('Create threat error:', error);
      return this.sendError(res, 'Failed to create threat detection');
    }
  }

  /**
   * Update threat status
   */
  async updateThreatStatus(req, res) {
    try {
      const { status, resolutionNotes } = req.body;
      const threatId = req.params.id;

      if (!status) {
        return this.sendError(res, 'Status is required', 400);
      }

      const threat = await Threat.findById(threatId);
      if (!threat) {
        return this.sendNotFound(res, 'Threat not found');
      }

      // Check permissions
      if (req.user.role !== 'admin' && 
          req.user.organizationId.toString() !== threat.organizationId.toString()) {
        return this.sendError(res, 'Access denied', 403);
      }

      const updateData = {
        status,
        lastUpdated: new Date()
      };

      if (status === 'resolved' || status === 'closed') {
        updateData.resolvedAt = new Date();
        updateData.resolvedBy = req.user.id;
        if (resolutionNotes) {
          updateData.resolutionNotes = resolutionNotes;
        }
      }

      const updatedThreat = await Threat.findByIdAndUpdate(
        threatId,
        updateData,
        { new: true }
      ).populate('organizationId', 'name')
       .populate('resolvedBy', 'name email');

      return this.sendSuccess(res, updatedThreat, 'Threat status updated successfully');

    } catch (error) {
      console.error('Update threat status error:', error);
      return this.sendError(res, 'Failed to update threat status');
    }
  }

  /**
   * Analyze threat patterns
   */
  async analyzeThreatPatterns(req, res) {
    try {
      const { timeRange = '7d', threatType } = req.query;

      // Check permissions
      if (req.user.role !== 'admin' && req.user.role !== 'analyst') {
        return this.sendError(res, 'Insufficient permissions for threat analysis', 403);
      }

      const filter = {
        organizationId: req.user.role === 'admin' ? 
          (req.query.organizationId || req.user.organizationId) : 
          req.user.organizationId
      };

      if (threatType) {
        filter.threatType = threatType;
      }

      const analysis = await threatService.analyzeThreatPatterns(filter, timeRange);

      return this.sendSuccess(res, analysis, 'Threat pattern analysis completed successfully');

    } catch (error) {
      console.error('Analyze threat patterns error:', error);
      return this.sendError(res, 'Failed to analyze threat patterns');
    }
  }

  /**
   * Get threat statistics
   */
  async getThreatStats(req, res) {
    try {
      const filter = this.buildThreatFilter(req.query, req.user);
      
      const stats = await threatDetectionService.getThreatStatistics(filter);

      return this.sendSuccess(res, stats, 'Threat statistics retrieved successfully');

    } catch (error) {
      console.error('Get threat stats error:', error);
      return this.sendError(res, 'Failed to retrieve threat statistics');
    }
  }

  /**
   * Run threat scan
   */
  async runThreatScan(req, res) {
    try {
      const { scanType = 'quick', targets } = req.body;

      // Check permissions
      if (req.user.role !== 'admin' && req.user.role !== 'analyst') {
        return this.sendError(res, 'Insufficient permissions to run threat scans', 403);
      }

      const scanParams = {
        organizationId: req.user.organizationId,
        scanType,
        targets,
        initiatedBy: req.user.id
      };

      const scanResult = await threatDetectionService.runThreatScan(scanParams);

      return this.sendSuccess(res, scanResult, 'Threat scan initiated successfully');

    } catch (error) {
      console.error('Run threat scan error:', error);
      return this.sendError(res, 'Failed to initiate threat scan');
    }
  }

  /**
   * Get threat trends
   */
  async getThreatTrends(req, res) {
    try {
      const { period = '30d', granularity = 'day' } = req.query;

      const filter = {
        organizationId: req.user.role === 'admin' ? 
          (req.query.organizationId || req.user.organizationId) : 
          req.user.organizationId
      };

      const trends = await threatDetectionService.getThreatTrends(filter, period, granularity);

      return this.sendSuccess(res, trends, 'Threat trends retrieved successfully');

    } catch (error) {
      console.error('Get threat trends error:', error);
      return this.sendError(res, 'Failed to retrieve threat trends');
    }
  }

  /**
   * Bulk threat operations
   */
  async bulkOperation(req, res) {
    try {
      const { operation, threatIds, data } = req.body;

      if (!operation || !threatIds || !Array.isArray(threatIds)) {
        return this.sendError(res, 'Operation and threatIds array are required', 400);
      }

      // Check permissions
      if (req.user.role !== 'admin' && req.user.role !== 'analyst') {
        return this.sendError(res, 'Insufficient permissions for bulk operations', 403);
      }

      let result;
      switch (operation) {
        case 'resolve':
          result = await Threat.updateMany(
            { _id: { $in: threatIds } },
            {
              status: 'resolved',
              resolvedAt: new Date(),
              resolvedBy: req.user.id,
              resolutionNotes: data.resolutionNotes || 'Bulk resolved'
            }
          );
          break;
        case 'updateSeverity':
          if (!data.severity) {
            return this.sendError(res, 'Severity is required', 400);
          }
          result = await Threat.updateMany(
            { _id: { $in: threatIds } },
            { severity: data.severity }
          );
          break;
        case 'assignAnalyst':
          if (!data.analystId) {
            return this.sendError(res, 'Analyst ID is required', 400);
          }
          result = await Threat.updateMany(
            { _id: { $in: threatIds } },
            { assignedTo: data.analystId }
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
   * Build threat-specific filter
   */
  buildThreatFilter(query, user) {
    const filter = {};

    // Organization filter
    if (user.role !== 'admin') {
      filter.organizationId = user.organizationId;
    } else if (query.organizationId) {
      filter.organizationId = query.organizationId;
    }

    // Threat type filter
    if (query.threatType) {
      if (Array.isArray(query.threatType)) {
        filter.threatType = { $in: query.threatType };
      } else {
        filter.threatType = query.threatType;
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

    // Risk score filter
    if (query.minRiskScore || query.maxRiskScore) {
      filter.riskScore = {};
      if (query.minRiskScore) {
        filter.riskScore.$gte = parseInt(query.minRiskScore);
      }
      if (query.maxRiskScore) {
        filter.riskScore.$lte = parseInt(query.maxRiskScore);
      }
    }

    // Search functionality
    if (query.search) {
      filter.$or = [
        { description: { $regex: query.search, $options: 'i' } },
        { source: { $regex: query.search, $options: 'i' } },
        { affectedAssets: { $regex: query.search, $options: 'i' } }
      ];
    }

    // Date range filter
    if (query.startDate || query.endDate) {
      filter.detectedAt = {};
      if (query.startDate) {
        filter.detectedAt.$gte = new Date(query.startDate);
      }
      if (query.endDate) {
        filter.detectedAt.$lte = new Date(query.endDate);
      }
    }

    return filter;
  }

  /**
   * Validation schemas
   */
  validateThreatCreation(data) {
    const schema = Joi.object({
      threatType: Joi.string().valid(
        'malware', 'phishing', 'ddos', 'intrusion', 'data_breach',
        'insider_threat', 'social_engineering', 'advanced_persistent_threat',
        'ransomware', 'other'
      ).required(),
      severity: Joi.string().valid('low', 'medium', 'high', 'critical').required(),
      description: Joi.string().required(),
      source: Joi.string().required(),
      affectedAssets: Joi.array().items(Joi.string()).optional(),
      riskScore: Joi.number().min(0).max(100).required(),
      indicators: Joi.object().optional(),
      recommendations: Joi.array().items(Joi.string()).optional()
    });

    return schema.validate(data);
  }

  getPopulateFields() {
    return 'organizationId resolvedBy';
  }

  getSearchFields() {
    return ['description', 'source', 'affectedAssets'];
  }
}

module.exports = new ThreatDetectionController();
