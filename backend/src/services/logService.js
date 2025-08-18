const { Log, User } = require('../models');
const { logger, securityLogger } = require('../utils/logger');
const BlockchainService = require('./blockchainService');
const CryptoUtils = require('../utils/crypto');
const { ethers } = require('ethers');

/**
 * Log Service
 * Handles log creation, management, and blockchain anchoring
 */
class LogService {
  constructor() {
    this.blockchainService = BlockchainService;
    this.pendingLogs = new Map(); // For batching logs before blockchain anchoring
    this.batchInterval = 5 * 60 * 1000; // 5 minutes
    this.maxBatchSize = 100;
    
    // Start batch processing
    this.startBatchProcessing();
  }

  /**
   * Create a new log entry
   * @param {Object} logData - Log data
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} Created log
   */
  async createLog(logData, options = {}) {
    try {
      const {
        eventType,
        userId,
        walletAddress,
        severity = 'Medium',
        source,
        description,
        details = {},
        metadata = {},
        threatLevel,
        detectionMethod,
        affectedAssets,
        remediationSteps
      } = logData;

      // Validate required fields
      if (!eventType || !source) {
        throw new Error('Event type and source are required');
      }

      // Generate log hash for integrity verification
      const logHash = this.generateLogHash({
        eventType,
        userId,
        walletAddress,
        severity,
        source,
        description,
        details,
        timestamp: new Date()
      });

      // Create log entry
      const log = new Log({
        eventType,
        userId,
        walletAddress,
        severity,
        source,
        description,
        details,
        metadata,
        threatLevel,
        detectionMethod,
        affectedAssets,
        remediationSteps,
        logHash,
        status: 'Pending'
      });

      await log.save();

      // Add to pending logs for blockchain anchoring
      if (options.anchorToBlockchain !== false) {
        this.addToPendingBatch(log);
        
        // For individual high-priority logs, anchor immediately
        if (severity === 'Critical' || severity === 'High') {
          await this.anchorLogImmediately(log);
        }
      }

      // Emit real-time notification for high-severity logs
      if (severity === 'Critical' || severity === 'High') {
        this.emitRealTimeAlert(log);
      }

      securityLogger.info('Log created', {
        logId: log._id,
        eventType,
        severity,
        source,
        userId
      });

      return log;
    } catch (error) {
      logger.error('Log creation error:', error.message);
      throw error;
    }
  }

  /**
   * Get logs with filtering and pagination
   * @param {Object} filters - Filter criteria
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Paginated logs
   */
  async getLogs(filters = {}, options = {}) {
    try {
      const {
        page = 1,
        limit = 50,
        sortBy = 'timestamp',
        sortOrder = 'desc',
        includeDetails = false
      } = options;

      const query = this.buildLogQuery(filters);
      const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

      const skip = (page - 1) * limit;

      let selectFields = '-details';
      if (includeDetails) {
        selectFields = '';
      }

      const [logs, total] = await Promise.all([
        Log.find(query)
          .select(selectFields)
          .sort(sort)
          .skip(skip)
          .limit(limit)
          .populate('userId', 'email role')
          .lean(),
        Log.countDocuments(query)
      ]);

      return {
        logs,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      logger.error('Get logs error:', error.message);
      throw error;
    }
  }

  /**
   * Get log analytics and statistics
   * @param {Object} filters - Filter criteria
   * @param {string} timeframe - Time frame for analytics
   * @returns {Promise<Object>} Analytics data
   */
  async getLogAnalytics(filters = {}, timeframe = '24h') {
    try {
      const timeframeMap = {
        '1h': 1 * 60 * 60 * 1000,
        '24h': 24 * 60 * 60 * 1000,
        '7d': 7 * 24 * 60 * 60 * 1000,
        '30d': 30 * 24 * 60 * 60 * 1000
      };

      const timeRange = new Date(Date.now() - timeframeMap[timeframe]);
      const query = {
        ...this.buildLogQuery(filters),
        timestamp: { $gte: timeRange }
      };

      // Aggregate statistics
      const [
        totalLogs,
        severityBreakdown,
        eventTypeBreakdown,
        sourceBreakdown,
        timelineCounts,
        threatLevelBreakdown
      ] = await Promise.all([
        Log.countDocuments(query),
        this.getSeverityBreakdown(query),
        this.getEventTypeBreakdown(query),
        this.getSourceBreakdown(query),
        this.getTimelineCounts(query, timeframe),
        this.getThreatLevelBreakdown(query)
      ]);

      return {
        summary: {
          totalLogs,
          timeframe,
          dateRange: {
            from: timeRange,
            to: new Date()
          }
        },
        breakdowns: {
          severity: severityBreakdown,
          eventType: eventTypeBreakdown,
          source: sourceBreakdown,
          threatLevel: threatLevelBreakdown
        },
        timeline: timelineCounts
      };
    } catch (error) {
      logger.error('Log analytics error:', error.message);
      throw error;
    }
  }

  /**
   * Search logs with text search
   * @param {string} searchTerm - Search term
   * @param {Object} filters - Additional filters
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Search results
   */
  async searchLogs(searchTerm, filters = {}, options = {}) {
    try {
      const { page = 1, limit = 50 } = options;

      // Build text search query
      const searchQuery = {
        $and: [
          {
            $or: [
              { eventType: { $regex: searchTerm, $options: 'i' } },
              { description: { $regex: searchTerm, $options: 'i' } },
              { source: { $regex: searchTerm, $options: 'i' } },
              { 'details.message': { $regex: searchTerm, $options: 'i' } }
            ]
          },
          this.buildLogQuery(filters)
        ]
      };

      const skip = (page - 1) * limit;

      const [logs, total] = await Promise.all([
        Log.find(searchQuery)
          .select('-details')
          .sort({ timestamp: -1 })
          .skip(skip)
          .limit(limit)
          .populate('userId', 'email role')
          .lean(),
        Log.countDocuments(searchQuery)
      ]);

      return {
        logs,
        searchTerm,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      logger.error('Log search error:', error.message);
      throw error;
    }
  }

  /**
   * Anchor log immediately to ChainShield
   * @param {Object} log - Log object
   * @returns {Promise<void>}
   */
  async anchorLogImmediately(log) {
    try {
      const userId = log.userId?.toString() || log.walletAddress || 'anonymous';
      const logType = this.mapEventTypeToLogType(log.eventType);
      const refURI = `ipfs://log/${log._id}`; // In production, upload to IPFS/Arweave

      const result = await this.blockchainService.anchorLog(
        userId,
        log.logHash,
        logType,
        refURI
      );

      if (result.success) {
        // Update log with blockchain information
        await Log.findByIdAndUpdate(log._id, {
          $set: {
            'blockchain.logId': result.logId,
            'blockchain.transactionHash': result.transactionHash,
            'blockchain.blockNumber': result.blockNumber,
            'blockchain.anchoredAt': new Date(),
            status: 'Anchored'
          }
        });

        logger.info('Log immediately anchored to ChainShield', {
          logId: log._id,
          blockchainLogId: result.logId,
          transactionHash: result.transactionHash
        });
      }
    } catch (error) {
      logger.error('Immediate log anchoring error:', error.message);
    }
  }

  /**
   * Map event type to ChainShield log type
   * @param {string} eventType - Event type
   * @returns {string} Mapped log type
   */
  mapEventTypeToLogType(eventType) {
    const typeMap = {
      'user_login': 'authentication',
      'user_logout': 'authentication',
      'authentication_failure': 'authentication',
      'user_registration': 'authentication',
      'user_update': 'authentication',
      'user_deactivation': 'authentication',
      'data_access': 'file_access',
      'data_export': 'file_access',
      'file_upload': 'file_access',
      'file_download': 'file_access',
      'network_event': 'network',
      'threat_detected': 'network',
      'firewall_event': 'firewall',
      'system_event': 'application',
      'api_request': 'application',
      'report_generated': 'application',
      'alert_generated': 'application',
      'email_sent': 'email',
      'transaction': 'transaction',
      'blockchain_transaction': 'transaction'
    };

    return typeMap[eventType] || 'application';
  }

  /**
   * Verify log integrity using blockchain
   * @param {string} logId - Log ID
   * @returns {Promise<Object>} Verification result
   */
  async verifyLogIntegrity(logId) {
    try {
      const log = await Log.findById(logId);
      if (!log) {
        throw new Error('Log not found');
      }

      // Generate current hash
      const currentHash = this.generateLogHash({
        eventType: log.eventType,
        userId: log.userId,
        walletAddress: log.walletAddress,
        severity: log.severity,
        source: log.source,
        description: log.description,
        details: log.details,
        timestamp: log.timestamp
      });

      // Check if hash matches
      const hashIntact = currentHash === log.logHash;

      // Verify blockchain anchoring if available
      let blockchainVerified = false;
      let blockchainData = null;

      if (log.blockchain.logId) {
        // Use ChainShield verification with log ID
        const blockchainResult = await this.blockchainService.verifyLogOnChain(
          log.blockchain.logId,
          JSON.stringify({
            eventType: log.eventType,
            userId: log.userId,
            walletAddress: log.walletAddress,
            severity: log.severity,
            source: log.source,
            description: log.description,
            details: log.details,
            timestamp: log.timestamp
          })
        );
        blockchainVerified = blockchainResult.verified;
        blockchainData = blockchainResult.data;
      } else if (log.blockchain.transactionHash) {
        // Legacy verification for old logs
        const blockchainResult = await this.blockchainService.verifyLogOnChain(
          log.blockchain.transactionHash,
          log.logHash
        );
        blockchainVerified = blockchainResult.verified;
        blockchainData = blockchainResult.data;
      }

      return {
        logId,
        integrity: {
          hashIntact,
          originalHash: log.logHash,
          currentHash,
          blockchain: {
            anchored: !!(log.blockchain.logId || log.blockchain.transactionHash),
            verified: blockchainVerified,
            logId: log.blockchain.logId,
            transactionHash: log.blockchain.transactionHash,
            blockNumber: log.blockchain.blockNumber,
            data: blockchainData
          }
        },
        verified: hashIntact && (blockchainVerified || !(log.blockchain.logId || log.blockchain.transactionHash))
      };
    } catch (error) {
      logger.error('Log integrity verification error:', error.message);
      throw error;
    }
  }

  /**
   * Archive old logs based on retention policy
   * @param {Object} retentionPolicy - Retention policy settings
   * @returns {Promise<Object>} Archive results
   */
  async archiveLogs(retentionPolicy = {}) {
    try {
      const {
        days = 365,
        severityExceptions = ['Critical', 'High'],
        complianceRetention = 2555 // 7 years for compliance
      } = retentionPolicy;

      const archiveDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
      const complianceDate = new Date(Date.now() - complianceRetention * 24 * 60 * 60 * 1000);

      // Find logs to archive (excluding high severity logs)
      const archiveQuery = {
        timestamp: { $lt: archiveDate },
        severity: { $nin: severityExceptions },
        status: { $ne: 'Archived' }
      };

      // Find logs to delete (very old, even compliance logs)
      const deleteQuery = {
        timestamp: { $lt: complianceDate },
        status: 'Archived'
      };

      // Archive logs
      const archiveResult = await Log.updateMany(
        archiveQuery,
        { 
          $set: { 
            status: 'Archived',
            archivedAt: new Date()
          }
        }
      );

      // Delete very old archived logs
      const deleteResult = await Log.deleteMany(deleteQuery);

      logger.info('Log archival completed', {
        archived: archiveResult.modifiedCount,
        deleted: deleteResult.deletedCount,
        retentionDays: days
      });

      return {
        archived: archiveResult.modifiedCount,
        deleted: deleteResult.deletedCount,
        archiveDate,
        deleteDate: complianceDate
      };
    } catch (error) {
      logger.error('Log archival error:', error.message);
      throw error;
    }
  }

  /**
   * Export logs to various formats
   * @param {Object} filters - Filter criteria
   * @param {string} format - Export format (csv, json, pdf)
   * @param {Object} options - Export options
   * @returns {Promise<Object>} Export result
   */
  async exportLogs(filters = {}, format = 'csv', options = {}) {
    try {
      const query = this.buildLogQuery(filters);
      const logs = await Log.find(query)
        .populate('userId', 'email role')
        .sort({ timestamp: -1 })
        .lean();

      let exportData;
      let mimeType;
      let filename;

      switch (format.toLowerCase()) {
        case 'csv':
          exportData = this.convertToCSV(logs);
          mimeType = 'text/csv';
          filename = `security_logs_${Date.now()}.csv`;
          break;
        case 'json':
          exportData = JSON.stringify(logs, null, 2);
          mimeType = 'application/json';
          filename = `security_logs_${Date.now()}.json`;
          break;
        case 'pdf':
          exportData = await this.generatePDFReport(logs, options);
          mimeType = 'application/pdf';
          filename = `security_logs_${Date.now()}.pdf`;
          break;
        default:
          throw new Error('Unsupported export format');
      }

      return {
        data: exportData,
        mimeType,
        filename,
        recordCount: logs.length
      };
    } catch (error) {
      logger.error('Log export error:', error.message);
      throw error;
    }
  }

  /**
   * Generate log hash for integrity verification
   * @param {Object} logData - Log data
   * @returns {string} Generated hash
   */
  generateLogHash(logData) {
    const hashInput = JSON.stringify({
      eventType: logData.eventType,
      userId: logData.userId,
      walletAddress: logData.walletAddress,
      severity: logData.severity,
      source: logData.source,
      description: logData.description,
      details: logData.details,
      timestamp: logData.timestamp
    });

    return CryptoUtils.generateHash(hashInput);
  }

  /**
   * Build MongoDB query from filters
   * @param {Object} filters - Filter criteria
   * @returns {Object} MongoDB query
   */
  buildLogQuery(filters) {
    const query = {};

    if (filters.eventType) {
      if (Array.isArray(filters.eventType)) {
        query.eventType = { $in: filters.eventType };
      } else {
        query.eventType = filters.eventType;
      }
    }

    if (filters.severity) {
      if (Array.isArray(filters.severity)) {
        query.severity = { $in: filters.severity };
      } else {
        query.severity = filters.severity;
      }
    }

    if (filters.source) {
      if (Array.isArray(filters.source)) {
        query.source = { $in: filters.source };
      } else {
        query.source = filters.source;
      }
    }

    if (filters.userId) {
      query.userId = filters.userId;
    }

    if (filters.walletAddress) {
      query.walletAddress = filters.walletAddress.toUpperCase();
    }

    if (filters.threatLevel) {
      query.threatLevel = filters.threatLevel;
    }

    if (filters.dateRange) {
      query.timestamp = {};
      if (filters.dateRange.from) {
        query.timestamp.$gte = new Date(filters.dateRange.from);
      }
      if (filters.dateRange.to) {
        query.timestamp.$lte = new Date(filters.dateRange.to);
      }
    }

    if (filters.status) {
      query.status = filters.status;
    }

    return query;
  }

  /**
   * Add log to pending batch for blockchain anchoring
   * @param {Object} log - Log object
   */
  addToPendingBatch(log) {
    this.pendingLogs.set(log._id.toString(), log);

    // Process batch if it reaches max size
    if (this.pendingLogs.size >= this.maxBatchSize) {
      this.processPendingBatch();
    }
  }

  /**
   * Start batch processing timer
   */
  startBatchProcessing() {
    setInterval(() => {
      if (this.pendingLogs.size > 0) {
        this.processPendingBatch();
      }
    }, this.batchInterval);
  }

  /**
   * Process pending logs batch for blockchain anchoring
   */
  async processPendingBatch() {
    try {
      if (this.pendingLogs.size === 0) return;

      const logs = Array.from(this.pendingLogs.values());
      const logIds = logs.map(log => log._id);

      // Create batch hash
      const batchHash = this.generateBatchHash(logs);

      // Anchor to blockchain
      const blockchainResult = await this.blockchainService.anchorBatch(
        batchHash,
        logIds
      );

      if (blockchainResult.success) {
        // Update logs with blockchain information
        await Log.updateMany(
          { _id: { $in: logIds } },
          {
            $set: {
              'blockchain.transactionHash': blockchainResult.transactionHash,
              'blockchain.blockNumber': blockchainResult.blockNumber,
              'blockchain.batchHash': batchHash,
              'blockchain.anchoredAt': new Date(),
              status: 'Anchored'
            }
          }
        );

        logger.info('Batch anchored to blockchain', {
          batchSize: logs.length,
          transactionHash: blockchainResult.transactionHash,
          blockNumber: blockchainResult.blockNumber
        });
      }

      // Clear pending logs
      this.pendingLogs.clear();
    } catch (error) {
      logger.error('Batch processing error:', error.message);
      // Don't clear pending logs on error - they'll be retried
    }
  }

  /**
   * Generate batch hash for multiple logs
   * @param {Array} logs - Array of log objects
   * @returns {string} Batch hash
   */
  generateBatchHash(logs) {
    const sortedHashes = logs
      .map(log => log.logHash)
      .sort()
      .join('');
    
    return CryptoUtils.generateHash(sortedHashes);
  }

  /**
   * Emit real-time alert for high-priority logs
   * @param {Object} log - Log object
   */
  emitRealTimeAlert(log) {
    // This would integrate with Socket.io for real-time notifications
    // Implementation depends on the main app setup
    logger.info('High-priority log alert', {
      logId: log._id,
      eventType: log.eventType,
      severity: log.severity
    });
  }

  /**
   * Convert logs to CSV format
   * @param {Array} logs - Array of log objects
   * @returns {string} CSV data
   */
  convertToCSV(logs) {
    if (logs.length === 0) return '';

    const headers = [
      'Timestamp',
      'Event Type',
      'Severity',
      'Source',
      'Description',
      'User Email',
      'Wallet Address',
      'Threat Level',
      'Status'
    ];

    const rows = logs.map(log => [
      log.timestamp?.toISOString() || '',
      log.eventType || '',
      log.severity || '',
      log.source || '',
      log.description || '',
      log.userId?.email || '',
      log.walletAddress || '',
      log.threatLevel || '',
      log.status || ''
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    return csvContent;
  }

  /**
   * Get severity breakdown
   * @param {Object} query - MongoDB query
   * @returns {Promise<Array>} Severity breakdown
   */
  async getSeverityBreakdown(query) {
    return Log.aggregate([
      { $match: query },
      { $group: { _id: '$severity', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
  }

  /**
   * Get event type breakdown
   * @param {Object} query - MongoDB query
   * @returns {Promise<Array>} Event type breakdown
   */
  async getEventTypeBreakdown(query) {
    return Log.aggregate([
      { $match: query },
      { $group: { _id: '$eventType', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);
  }

  /**
   * Get source breakdown
   * @param {Object} query - MongoDB query
   * @returns {Promise<Array>} Source breakdown
   */
  async getSourceBreakdown(query) {
    return Log.aggregate([
      { $match: query },
      { $group: { _id: '$source', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);
  }

  /**
   * Get threat level breakdown
   * @param {Object} query - MongoDB query
   * @returns {Promise<Array>} Threat level breakdown
   */
  async getThreatLevelBreakdown(query) {
    return Log.aggregate([
      { $match: query },
      { $group: { _id: '$threatLevel', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
  }

  /**
   * Get timeline counts for analytics
   * @param {Object} query - MongoDB query
   * @param {string} timeframe - Time frame
   * @returns {Promise<Array>} Timeline data
   */
  async getTimelineCounts(query, timeframe) {
    const groupBy = timeframe === '1h' ? {
      hour: { $hour: '$timestamp' },
      day: { $dayOfYear: '$timestamp' },
      year: { $year: '$timestamp' }
    } : {
      day: { $dayOfYear: '$timestamp' },
      year: { $year: '$timestamp' }
    };

    return Log.aggregate([
      { $match: query },
      { $group: { _id: groupBy, count: { $sum: 1 } } },
      { $sort: { '_id.year': 1, '_id.day': 1, '_id.hour': 1 } }
    ]);
  }
}

module.exports = new LogService();
