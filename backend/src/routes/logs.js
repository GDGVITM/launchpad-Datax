const express = require('express');
const logController = require('../controllers/logController');
const { authenticateToken, requireRole, requirePermission } = require('../middleware/auth');

const router = express.Router();

// All log routes require authentication
router.use(authenticateToken);

// Get all logs (with pagination and filtering)
router.get('/', logController.getLogs);

// Get log statistics
router.get('/stats', logController.getLogStats);

// Export logs
router.get('/export', requireRole(['admin', 'analyst']), logController.exportLogs);

// Get log by ID
router.get('/:id', logController.getLogById);

// Create new log
router.post('/', logController.createLog);

// Verify log integrity
router.post('/:id/verify', logController.verifyLog);

// Anchor log to blockchain
router.post('/:id/anchor', requireRole(['admin']), logController.anchorLog);

// Bulk operations (admin only)
router.post('/bulk', requireRole(['admin']), logController.bulkOperation);

module.exports = router;
