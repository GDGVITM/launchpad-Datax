const express = require('express');
const alertController = require('../controllers/alertController');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// All alert routes require authentication
router.use(authenticateToken);

// Get all alerts (with pagination and filtering)
router.get('/', alertController.getAlerts);

// Get alert statistics
router.get('/stats', alertController.getAlertStats);

// Get alert trends
router.get('/trends', alertController.getAlertTrends);

// Get alert configuration (admin only)
router.get('/config', requireRole(['admin']), alertController.getAlertConfig);

// Update alert configuration (admin only)
router.put('/config', requireRole(['admin']), alertController.updateAlertConfig);

// Test alert configuration (admin only)
router.post('/test', requireRole(['admin']), alertController.testAlert);

// Get alert by ID
router.get('/:id', alertController.getAlertById);

// Create new alert
router.post('/', alertController.createAlert);

// Update alert status
router.put('/:id/status', alertController.updateAlertStatus);

// Acknowledge alert
router.put('/:id/acknowledge', alertController.acknowledgeAlert);

// Bulk operations (admin only)
router.post('/bulk', requireRole(['admin']), alertController.bulkOperation);

module.exports = router;
