const express = require('express');
const threatController = require('../controllers/threatController');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// All threat routes require authentication
router.use(authenticateToken);

// Get all threats (with pagination and filtering)
router.get('/', threatController.getThreats);

// Get threat statistics
router.get('/stats', threatController.getThreatStats);

// Get threat trends
router.get('/trends', threatController.getThreatTrends);

// Analyze threat patterns (admin/analyst only)
router.get('/patterns', requireRole(['admin', 'analyst']), threatController.analyzeThreatPatterns);

// Run threat scan (admin/analyst only)
router.post('/scan', requireRole(['admin', 'analyst']), threatController.runThreatScan);

// Get threat by ID
router.get('/:id', threatController.getThreatById);

// Create new threat detection
router.post('/', threatController.createThreat);

// Update threat status
router.put('/:id/status', threatController.updateThreatStatus);

// Bulk operations (admin/analyst only)
router.post('/bulk', requireRole(['admin', 'analyst']), threatController.bulkOperation);

module.exports = router;
