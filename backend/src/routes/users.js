const express = require('express');
const userController = require('../controllers/userController');
const { authenticateToken, requireRole, requirePermission } = require('../middleware/auth');

const router = express.Router();

// All user routes require authentication
router.use(authenticateToken);

// Get all users (with pagination and filtering)
router.get('/', userController.getUsers);

// Get user by ID
router.get('/:id', userController.getUserById);

// Create new user (admin only)
router.post('/', requireRole(['admin']), userController.createUser);

// Update user
router.put('/:id', userController.updateUser);

// Delete user (admin only)
router.delete('/:id', requireRole(['admin']), userController.deleteUser);

// Get user activity logs
router.get('/:id/activity', userController.getUserActivity);

// Get user statistics
router.get('/:id/stats', userController.getUserStats);

// Bulk operations (admin only)
router.post('/bulk', requireRole(['admin']), userController.bulkOperation);

module.exports = router;
