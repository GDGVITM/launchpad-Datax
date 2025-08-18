const { Threat, Log, Alert } = require('../models');
const { logger } = require('../utils/logger');
const LogService = require('./logService');
const AlertService = require('./alertService');

/**
 * Threat Detection Service
 * Handles AI/ML-based threat detection and analysis
 */
class ThreatDetectionService {
  constructor() {
    this.detectionRules = new Map();
    this.mlModels = new Map();
    this.anomalyBaselines = new Map();
    this.detectionMetrics = {
      totalScans: 0,
      threatsDetected: 0,
      falsePositives: 0,
      lastScan: null
    };

    this.loadDetectionRules();
    this.initializeMLModels();
  }

  /**
   * Analyze logs for threats using multiple detection methods
   * @param {Array} logs - Array of log entries to analyze
   * @param {Object} options - Analysis options
   * @returns {Promise<Object>} Analysis results
   */
  async analyzeLogsForThreats(logs, options = {}) {
    try {
      const {
        enableMLDetection = true,
        enableRuleBasedDetection = true,
        enableAnomalyDetection = true,
        minThreatScore = 0.5
      } = options;

      this.detectionMetrics.totalScans++;
      this.detectionMetrics.lastScan = new Date();

      const detectedThreats = [];
      const analysisResults = {
        totalLogs: logs.length,
        threatsDetected: 0,
        highRiskThreats: 0,
        mediumRiskThreats: 0,
        lowRiskThreats: 0,
        detectionMethods: {
          rulesBased: 0,
          mlBased: 0,
          anomalyBased: 0
        }
      };

      for (const log of logs) {
        const threats = [];

        // Rule-based detection
        if (enableRuleBasedDetection) {
          const ruleThreats = await this.runRuleBasedDetection(log);
          threats.push(...ruleThreats);
          analysisResults.detectionMethods.rulesBased += ruleThreats.length;
        }

        // ML-based detection
        if (enableMLDetection) {
          const mlThreats = await this.runMLDetection(log);
          threats.push(...mlThreats);
          analysisResults.detectionMethods.mlBased += mlThreats.length;
        }

        // Anomaly detection
        if (enableAnomalyDetection) {
          const anomalyThreats = await this.runAnomalyDetection(log);
          threats.push(...anomalyThreats);
          analysisResults.detectionMethods.anomalyBased += anomalyThreats.length;
        }

        // Process detected threats
        for (const threat of threats) {
          if (threat.threatScore >= minThreatScore) {
            const savedThreat = await this.createThreatRecord(threat, log);
            detectedThreats.push(savedThreat);

            // Categorize by risk level
            switch (savedThreat.riskLevel) {
              case 'High':
                analysisResults.highRiskThreats++;
                break;
              case 'Medium':
                analysisResults.mediumRiskThreats++;
                break;
              case 'Low':
                analysisResults.lowRiskThreats++;
                break;
            }
          }
        }
      }

      analysisResults.threatsDetected = detectedThreats.length;
      this.detectionMetrics.threatsDetected += detectedThreats.length;

      // Generate alerts for high-risk threats
      await this.generateThreatAlerts(detectedThreats);

      logger.info('Threat analysis completed', {
        logsAnalyzed: logs.length,
        threatsDetected: detectedThreats.length,
        highRisk: analysisResults.highRiskThreats
      });

      return {
        threats: detectedThreats,
        analysis: analysisResults,
        timestamp: new Date()
      };
    } catch (error) {
      logger.error('Threat analysis error:', error.message);
      throw error;
    }
  }

  /**
   * Run rule-based threat detection
   * @param {Object} log - Log entry
   * @returns {Promise<Array>} Detected threats
   */
  async runRuleBasedDetection(log) {
    const threats = [];

    for (const [ruleName, rule] of this.detectionRules) {
      try {
        if (rule.enabled && this.matchesRule(log, rule)) {
          threats.push({
            type: 'rule_based',
            ruleName,
            threatType: rule.threatType,
            threatScore: rule.severity,
            riskLevel: this.calculateRiskLevel(rule.severity),
            description: rule.description,
            indicators: rule.indicators,
            detectionMethod: 'Rules Engine',
            confidence: rule.confidence || 0.8
          });
        }
      } catch (error) {
        logger.error(`Rule execution error for ${ruleName}:`, error.message);
      }
    }

    return threats;
  }

  /**
   * Run ML-based threat detection
   * @param {Object} log - Log entry
   * @returns {Promise<Array>} Detected threats
   */
  async runMLDetection(log) {
    const threats = [];

    try {
      // Feature extraction from log
      const features = this.extractMLFeatures(log);

      // Run through ML models
      for (const [modelName, model] of this.mlModels) {
        if (model.enabled) {
          const prediction = await this.runMLModel(model, features);
          
          if (prediction.isThreat && prediction.confidence > 0.6) {
            threats.push({
              type: 'ml_based',
              modelName,
              threatType: prediction.threatType,
              threatScore: prediction.confidence,
              riskLevel: this.calculateRiskLevel(prediction.confidence),
              description: `ML model detected potential ${prediction.threatType}`,
              indicators: prediction.indicators,
              detectionMethod: 'Machine Learning',
              confidence: prediction.confidence,
              features: features
            });
          }
        }
      }
    } catch (error) {
      logger.error('ML detection error:', error.message);
    }

    return threats;
  }

  /**
   * Run anomaly-based threat detection
   * @param {Object} log - Log entry
   * @returns {Promise<Array>} Detected threats
   */
  async runAnomalyDetection(log) {
    const threats = [];

    try {
      const anomalyScore = await this.calculateAnomalyScore(log);
      
      if (anomalyScore > 0.7) {
        threats.push({
          type: 'anomaly_based',
          threatType: 'Anomalous Behavior',
          threatScore: anomalyScore,
          riskLevel: this.calculateRiskLevel(anomalyScore),
          description: 'Detected anomalous behavior pattern',
          indicators: ['unusual_pattern', 'statistical_outlier'],
          detectionMethod: 'Anomaly Detection',
          confidence: anomalyScore,
          anomalyScore
        });
      }
    } catch (error) {
      logger.error('Anomaly detection error:', error.message);
    }

    return threats;
  }

  /**
   * Extract ML features from log entry
   * @param {Object} log - Log entry
   * @returns {Object} Extracted features
   */
  extractMLFeatures(log) {
    return {
      eventType: this.encodeEventType(log.eventType),
      severity: this.encodeSeverity(log.severity),
      timeOfDay: new Date(log.timestamp).getHours(),
      dayOfWeek: new Date(log.timestamp).getDay(),
      sourceEntropy: this.calculateSourceEntropy(log.source),
      descriptionLength: log.description ? log.description.length : 0,
      hasWalletAddress: !!log.walletAddress,
      hasUserId: !!log.userId,
      detailsComplexity: this.calculateDetailsComplexity(log.details),
      frequencyScore: this.calculateFrequencyScore(log)
    };
  }

  /**
   * Run ML model prediction (mock implementation)
   * @param {Object} model - ML model
   * @param {Object} features - Input features
   * @returns {Promise<Object>} Prediction result
   */
  async runMLModel(model, features) {
    // Mock ML model implementation
    // In production, this would integrate with TensorFlow.js, scikit-learn via API, etc.
    
    const threatPatterns = {
      'brute_force_detector': {
        pattern: features.eventType === 'login_failure' && features.frequencyScore > 0.8,
        threatType: 'Brute Force Attack',
        baseConfidence: 0.85
      },
      'anomaly_detector': {
        pattern: features.sourceEntropy > 0.7 || features.detailsComplexity > 0.8,
        threatType: 'Suspicious Activity',
        baseConfidence: 0.75
      },
      'injection_detector': {
        pattern: features.descriptionLength > 500 && features.detailsComplexity > 0.6,
        threatType: 'Injection Attack',
        baseConfidence: 0.8
      }
    };

    const pattern = threatPatterns[model.name];
    if (pattern && pattern.pattern) {
      return {
        isThreat: true,
        threatType: pattern.threatType,
        confidence: pattern.baseConfidence + (Math.random() * 0.1 - 0.05), // Add some variance
        indicators: ['ml_pattern_match', model.name]
      };
    }

    return {
      isThreat: false,
      confidence: Math.random() * 0.5
    };
  }

  /**
   * Calculate anomaly score based on historical patterns
   * @param {Object} log - Log entry
   * @returns {Promise<number>} Anomaly score (0-1)
   */
  async calculateAnomalyScore(log) {
    try {
      // Get baseline for this type of event
      const baseline = await this.getAnomalyBaseline(log.eventType, log.source);
      
      let anomalyScore = 0;

      // Time-based anomaly
      const timeAnomaly = this.calculateTimeAnomaly(log.timestamp, baseline.timePatterns);
      anomalyScore += timeAnomaly * 0.3;

      // Frequency anomaly
      const frequencyAnomaly = await this.calculateFrequencyAnomaly(log, baseline);
      anomalyScore += frequencyAnomaly * 0.4;

      // Content anomaly
      const contentAnomaly = this.calculateContentAnomaly(log, baseline.contentPatterns);
      anomalyScore += contentAnomaly * 0.3;

      return Math.min(anomalyScore, 1);
    } catch (error) {
      logger.error('Anomaly score calculation error:', error.message);
      return 0;
    }
  }

  /**
   * Create threat record in database
   * @param {Object} threatData - Threat data
   * @param {Object} sourceLog - Source log entry
   * @returns {Promise<Object>} Created threat record
   */
  async createThreatRecord(threatData, sourceLog) {
    try {
      const threat = new Threat({
        threatType: threatData.threatType,
        severity: this.mapRiskLevelToSeverity(threatData.riskLevel),
        status: 'Active',
        source: sourceLog.source,
        detectionMethod: threatData.detectionMethod,
        confidence: threatData.confidence,
        threatScore: threatData.threatScore,
        indicators: threatData.indicators || [],
        affectedAssets: this.extractAffectedAssets(sourceLog),
        mitigationSteps: this.generateMitigationSteps(threatData),
        relatedLogs: [sourceLog._id],
        metadata: {
          detectionType: threatData.type,
          ruleName: threatData.ruleName,
          modelName: threatData.modelName,
          features: threatData.features,
          anomalyScore: threatData.anomalyScore
        }
      });

      await threat.save();

      // Create audit log
      await LogService.createLog({
        eventType: 'threat_detected',
        severity: threat.severity,
        source: 'threat_detection_service',
        description: `Threat detected: ${threat.threatType}`,
        details: {
          threatId: threat._id,
          detectionMethod: threat.detectionMethod,
          confidence: threat.confidence,
          threatScore: threat.threatScore
        }
      });

      return threat;
    } catch (error) {
      logger.error('Threat record creation error:', error.message);
      throw error;
    }
  }

  /**
   * Generate alerts for detected threats
   * @param {Array} threats - Array of detected threats
   * @returns {Promise<void>}
   */
  async generateThreatAlerts(threats) {
    try {
      for (const threat of threats) {
        if (threat.riskLevel === 'High' || threat.riskLevel === 'Critical') {
          await AlertService.createAlert({
            type: 'security_threat',
            severity: threat.severity,
            title: `${threat.threatType} Detected`,
            message: `A ${threat.threatType} has been detected with ${threat.confidence * 100}% confidence.`,
            source: 'threat_detection_service',
            relatedEntity: 'threat',
            entityId: threat._id,
            metadata: {
              threatType: threat.threatType,
              detectionMethod: threat.detectionMethod,
              threatScore: threat.threatScore,
              indicators: threat.indicators
            }
          });
        }
      }
    } catch (error) {
      logger.error('Threat alert generation error:', error.message);
    }
  }

  /**
   * Load detection rules from configuration
   */
  loadDetectionRules() {
    const rules = [
      {
        name: 'brute_force_detection',
        enabled: true,
        threatType: 'Brute Force Attack',
        severity: 0.9,
        confidence: 0.85,
        description: 'Multiple failed login attempts from same IP',
        indicators: ['multiple_failures', 'same_ip'],
        conditions: {
          eventType: 'authentication_failure',
          timeWindow: 300, // 5 minutes
          threshold: 5
        }
      },
      {
        name: 'privilege_escalation',
        enabled: true,
        threatType: 'Privilege Escalation',
        severity: 0.95,
        confidence: 0.8,
        description: 'Unauthorized privilege escalation attempt',
        indicators: ['role_change', 'unauthorized_access'],
        conditions: {
          eventType: 'user_update',
          roleChange: true,
          unauthorized: true
        }
      },
      {
        name: 'suspicious_api_usage',
        enabled: true,
        threatType: 'API Abuse',
        severity: 0.7,
        confidence: 0.75,
        description: 'Unusual API usage patterns detected',
        indicators: ['high_frequency', 'unusual_endpoints'],
        conditions: {
          source: 'api_gateway',
          requestRate: 'high',
          timeWindow: 60
        }
      },
      {
        name: 'data_exfiltration',
        enabled: true,
        threatType: 'Data Exfiltration',
        severity: 0.95,
        confidence: 0.9,
        description: 'Potential data exfiltration detected',
        indicators: ['large_data_transfer', 'unusual_access_pattern'],
        conditions: {
          eventType: 'data_access',
          dataVolume: 'high',
          timeOfDay: 'unusual'
        }
      }
    ];

    rules.forEach(rule => {
      this.detectionRules.set(rule.name, rule);
    });

    logger.info(`Loaded ${rules.length} detection rules`);
  }

  /**
   * Initialize ML models
   */
  initializeMLModels() {
    const models = [
      {
        name: 'brute_force_detector',
        enabled: true,
        type: 'classification',
        version: '1.0',
        accuracy: 0.92
      },
      {
        name: 'anomaly_detector',
        enabled: true,
        type: 'anomaly_detection',
        version: '1.0',
        accuracy: 0.85
      },
      {
        name: 'injection_detector',
        enabled: true,
        type: 'pattern_matching',
        version: '1.0',
        accuracy: 0.88
      }
    ];

    models.forEach(model => {
      this.mlModels.set(model.name, model);
    });

    logger.info(`Initialized ${models.length} ML models`);
  }

  /**
   * Check if log matches detection rule
   * @param {Object} log - Log entry
   * @param {Object} rule - Detection rule
   * @returns {boolean} Match result
   */
  matchesRule(log, rule) {
    const conditions = rule.conditions;

    // Check event type
    if (conditions.eventType && log.eventType !== conditions.eventType) {
      return false;
    }

    // Check source
    if (conditions.source && log.source !== conditions.source) {
      return false;
    }

    // Check for specific patterns in rule conditions
    if (conditions.roleChange && !this.detectRoleChange(log)) {
      return false;
    }

    if (conditions.unauthorized && !this.detectUnauthorizedAccess(log)) {
      return false;
    }

    // Time-based checks (would need more complex implementation)
    if (conditions.timeWindow && conditions.threshold) {
      return this.checkFrequencyThreshold(log, conditions);
    }

    return true;
  }

  /**
   * Calculate risk level from threat score
   * @param {number} score - Threat score (0-1)
   * @returns {string} Risk level
   */
  calculateRiskLevel(score) {
    if (score >= 0.9) return 'Critical';
    if (score >= 0.7) return 'High';
    if (score >= 0.5) return 'Medium';
    return 'Low';
  }

  /**
   * Map risk level to severity
   * @param {string} riskLevel - Risk level
   * @returns {string} Severity
   */
  mapRiskLevelToSeverity(riskLevel) {
    const mapping = {
      'Critical': 'Critical',
      'High': 'High',
      'Medium': 'Medium',
      'Low': 'Low'
    };
    return mapping[riskLevel] || 'Medium';
  }

  /**
   * Extract affected assets from log
   * @param {Object} log - Log entry
   * @returns {Array} Affected assets
   */
  extractAffectedAssets(log) {
    const assets = [];

    if (log.userId) assets.push(`user:${log.userId}`);
    if (log.walletAddress) assets.push(`wallet:${log.walletAddress}`);
    if (log.details?.endpoint) assets.push(`endpoint:${log.details.endpoint}`);
    if (log.details?.database) assets.push(`database:${log.details.database}`);

    return assets;
  }

  /**
   * Generate mitigation steps for threat
   * @param {Object} threatData - Threat data
   * @returns {Array} Mitigation steps
   */
  generateMitigationSteps(threatData) {
    const steps = [];

    switch (threatData.threatType) {
      case 'Brute Force Attack':
        steps.push(
          'Block source IP address',
          'Implement rate limiting',
          'Enable account lockout policy',
          'Review authentication logs',
          'Notify affected users'
        );
        break;
      case 'Privilege Escalation':
        steps.push(
          'Revoke unauthorized privileges',
          'Review access control policies',
          'Audit user permissions',
          'Investigate escalation source',
          'Update security policies'
        );
        break;
      case 'API Abuse':
        steps.push(
          'Implement API rate limiting',
          'Review API key permissions',
          'Monitor API usage patterns',
          'Block suspicious requests',
          'Update API security policies'
        );
        break;
      default:
        steps.push(
          'Investigate further',
          'Review related logs',
          'Update security policies',
          'Monitor for similar patterns'
        );
    }

    return steps;
  }

  /**
   * Get detection metrics
   * @returns {Object} Detection metrics
   */
  getDetectionMetrics() {
    return {
      ...this.detectionMetrics,
      accuracy: this.detectionMetrics.totalScans > 0 
        ? (this.detectionMetrics.threatsDetected - this.detectionMetrics.falsePositives) / this.detectionMetrics.totalScans 
        : 0,
      rules: {
        total: this.detectionRules.size,
        enabled: Array.from(this.detectionRules.values()).filter(rule => rule.enabled).length
      },
      models: {
        total: this.mlModels.size,
        enabled: Array.from(this.mlModels.values()).filter(model => model.enabled).length
      }
    };
  }

  // Helper methods (simplified implementations)
  encodeEventType(eventType) { return eventType ? eventType.length : 0; }
  encodeSeverity(severity) { 
    const map = { 'Low': 1, 'Medium': 2, 'High': 3, 'Critical': 4 };
    return map[severity] || 2;
  }
  calculateSourceEntropy(source) { return source ? Math.random() * 0.5 : 0; }
  calculateDetailsComplexity(details) { return details ? Math.min(Object.keys(details).length / 10, 1) : 0; }
  calculateFrequencyScore(log) { return Math.random() * 0.8; }
  detectRoleChange(log) { return log.details?.oldRole && log.details?.newRole; }
  detectUnauthorizedAccess(log) { return log.details?.unauthorized === true; }
  checkFrequencyThreshold(log, conditions) { return Math.random() > 0.7; }
  
  async getAnomalyBaseline(eventType, source) {
    return {
      timePatterns: { peak_hours: [9, 17], normal_variance: 0.2 },
      contentPatterns: { avg_length: 100, common_terms: [] }
    };
  }
  
  calculateTimeAnomaly(timestamp, patterns) { return Math.random() * 0.3; }
  async calculateFrequencyAnomaly(log, baseline) { return Math.random() * 0.4; }
  calculateContentAnomaly(log, patterns) { return Math.random() * 0.3; }
}

module.exports = new ThreatDetectionService();
