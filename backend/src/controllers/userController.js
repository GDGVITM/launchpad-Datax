const User = require('../models/User');
const userService = require('../services/userService');
const blockchainService = require('../services/blockchainService');
const BaseController = require('./baseController');
const Joi = require('joi');

/**
 * User Controller
 * Handles user management operations with blockchain integration
 */
class UserController extends BaseController {
  constructor() {
    super(User, 'User');
  }

  /**
   * Get all users with advanced filtering
   */
  async getUsers(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = Math.min(parseInt(req.query.limit) || 10, 100);
      const skip = (page - 1) * limit;

      const filter = this.buildUserFilter(req.query);
      const sort = this.buildSort(req.query.sort);

      const [users, total] = await Promise.all([
        User.find(filter)
          .select('-password')
          .populate('organizationId', 'name type')
          .sort(sort)
          .skip(skip)
          .limit(limit),
        User.countDocuments(filter)
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
        users,
        pagination
      }, 'Users retrieved successfully');

    } catch (error) {
      console.error('Get users error:', error);
      return this.sendError(res, 'Failed to retrieve users');
    }
  }

  /**
   * Get user by ID
   */
  async getUserById(req, res) {
    try {
      const user = await User.findById(req.params.id)
        .select('-password')
        .populate('organizationId', 'name type');

      if (!user) {
        return this.sendNotFound(res, 'User not found');
      }

      // Check if user has permission to view this user
      if (req.user.role !== 'admin' && req.user.organizationId.toString() !== user.organizationId.toString()) {
        return this.sendError(res, 'Access denied', 403);
      }

      return this.sendSuccess(res, user, 'User retrieved successfully');

    } catch (error) {
      console.error('Get user error:', error);
      return this.sendError(res, 'Failed to retrieve user');
    }
  }

  /**
   * Create new user with blockchain registration
   */
  async createUser(req, res) {
    try {
      const { error } = this.validateUserCreation(req.body);
      if (error) {
        return this.sendValidationError(res, error.details);
      }

      // Check if user already exists
      const existingUser = await User.findOne({ email: req.body.email });
      if (existingUser) {
        return this.sendError(res, 'User already exists with this email', 400);
      }

      // Create user
      const userData = {
        ...req.body,
        organizationId: req.user.role === 'admin' ? req.body.organizationId : req.user.organizationId,
        isActive: true
      };

      const user = await userService.createUser(userData);

      // Register user on blockchain if enabled
      if (process.env.BLOCKCHAIN_ENABLED === 'true') {
        try {
          await blockchainService.registerUser(
            user._id.toString(), 
            user.organizationId.toString()
          );
          await User.findByIdAndUpdate(user._id, { 
            isBlockchainRegistered: true 
          });
        } catch (blockchainError) {
          console.error('Blockchain registration failed:', blockchainError);
        }
      }

      // Remove password from response
      const userResponse = await User.findById(user._id)
        .select('-password')
        .populate('organizationId', 'name type');

      return this.sendSuccess(res, userResponse, 'User created successfully', 201);

    } catch (error) {
      console.error('Create user error:', error);
      return this.sendError(res, 'Failed to create user');
    }
  }

  /**
   * Update user
   */
  async updateUser(req, res) {
    try {
      const { error } = this.validateUserUpdate(req.body);
      if (error) {
        return this.sendValidationError(res, error.details);
      }

      const userId = req.params.id;

      // Check if user exists and permission
      const existingUser = await User.findById(userId);
      if (!existingUser) {
        return this.sendNotFound(res, 'User not found');
      }

      // Check permissions
      if (req.user.role !== 'admin' && 
          req.user.organizationId.toString() !== existingUser.organizationId.toString()) {
        return this.sendError(res, 'Access denied', 403);
      }

      // Prevent self-deactivation
      if (req.user.id === userId && req.body.isActive === false) {
        return this.sendError(res, 'Cannot deactivate your own account', 400);
      }

      // Update user
      const allowedUpdates = [
        'name', 'email', 'phone', 'role', 'isActive', 
        'permissions', 'preferences', 'twoFactorEnabled'
      ];

      const updates = {};
      Object.keys(req.body).forEach(key => {
        if (allowedUpdates.includes(key)) {
          updates[key] = req.body[key];
        }
      });

      // Only admin can change organization
      if (req.user.role === 'admin' && req.body.organizationId) {
        updates.organizationId = req.body.organizationId;
      }

      const user = await User.findByIdAndUpdate(
        userId,
        updates,
        { new: true, runValidators: true }
      ).select('-password').populate('organizationId', 'name type');

      return this.sendSuccess(res, user, 'User updated successfully');

    } catch (error) {
      console.error('Update user error:', error);
      return this.sendError(res, 'Failed to update user');
    }
  }

  /**
   * Delete user (soft delete)
   */
  async deleteUser(req, res) {
    try {
      const userId = req.params.id;

      // Check if user exists and permission
      const existingUser = await User.findById(userId);
      if (!existingUser) {
        return this.sendNotFound(res, 'User not found');
      }

      // Check permissions
      if (req.user.role !== 'admin' && 
          req.user.organizationId.toString() !== existingUser.organizationId.toString()) {
        return this.sendError(res, 'Access denied', 403);
      }

      // Prevent self-deletion
      if (req.user.id === userId) {
        return this.sendError(res, 'Cannot delete your own account', 400);
      }

      // Soft delete by deactivating
      await User.findByIdAndUpdate(userId, { 
        isActive: false,
        deletedAt: new Date()
      });

      return this.sendSuccess(res, null, 'User deleted successfully');

    } catch (error) {
      console.error('Delete user error:', error);
      return this.sendError(res, 'Failed to delete user');
    }
  }

  /**
   * Get user activity logs
   */
  async getUserActivity(req, res) {
    try {
      const userId = req.params.id;

      // Check permissions
      const user = await User.findById(userId);
      if (!user) {
        return this.sendNotFound(res, 'User not found');
      }

      if (req.user.role !== 'admin' && 
          req.user.organizationId.toString() !== user.organizationId.toString()) {
        return this.sendError(res, 'Access denied', 403);
      }

      const page = parseInt(req.query.page) || 1;
      const limit = Math.min(parseInt(req.query.limit) || 20, 100);

      const activities = await userService.getUserActivity(userId, page, limit);

      return this.sendSuccess(res, activities, 'User activity retrieved successfully');

    } catch (error) {
      console.error('Get user activity error:', error);
      return this.sendError(res, 'Failed to retrieve user activity');
    }
  }

  /**
   * Get user statistics
   */
  async getUserStats(req, res) {
    try {
      const userId = req.params.id;

      // Check permissions
      const user = await User.findById(userId);
      if (!user) {
        return this.sendNotFound(res, 'User not found');
      }

      if (req.user.role !== 'admin' && 
          req.user.organizationId.toString() !== user.organizationId.toString()) {
        return this.sendError(res, 'Access denied', 403);
      }

      const stats = await userService.getUserStats(userId);

      return this.sendSuccess(res, stats, 'User statistics retrieved successfully');

    } catch (error) {
      console.error('Get user stats error:', error);
      return this.sendError(res, 'Failed to retrieve user statistics');
    }
  }

  /**
   * Bulk user operations
   */
  async bulkOperation(req, res) {
    try {
      const { operation, userIds, data } = req.body;

      if (!operation || !userIds || !Array.isArray(userIds)) {
        return this.sendError(res, 'Operation and userIds array are required', 400);
      }

      // Check permissions
      if (req.user.role !== 'admin') {
        return this.sendError(res, 'Admin access required for bulk operations', 403);
      }

      let result;
      switch (operation) {
        case 'activate':
          result = await User.updateMany(
            { _id: { $in: userIds } },
            { isActive: true }
          );
          break;
        case 'deactivate':
          result = await User.updateMany(
            { _id: { $in: userIds } },
            { isActive: false }
          );
          break;
        case 'updateRole':
          if (!data.role) {
            return this.sendError(res, 'Role is required for role update', 400);
          }
          result = await User.updateMany(
            { _id: { $in: userIds } },
            { role: data.role }
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
   * Build user-specific filter
   */
  buildUserFilter(query) {
    const filter = {};

    // Base organization filter
    if (query.organizationId) {
      filter.organizationId = query.organizationId;
    }

    // Role filter
    if (query.role) {
      filter.role = query.role;
    }

    // Active status filter
    if (query.isActive !== undefined) {
      filter.isActive = query.isActive === 'true';
    }

    // Blockchain registration filter
    if (query.isBlockchainRegistered !== undefined) {
      filter.isBlockchainRegistered = query.isBlockchainRegistered === 'true';
    }

    // Search functionality
    if (query.search) {
      filter.$or = [
        { name: { $regex: query.search, $options: 'i' } },
        { email: { $regex: query.search, $options: 'i' } }
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
  validateUserCreation(data) {
    const schema = Joi.object({
      name: Joi.string().min(2).max(50).required(),
      email: Joi.string().email().required(),
      password: Joi.string().min(8).required(),
      phone: Joi.string().optional(),
      role: Joi.string().valid('user', 'admin', 'analyst').default('user'),
      organizationId: Joi.string().required(),
      permissions: Joi.array().items(Joi.string()).optional(),
      twoFactorEnabled: Joi.boolean().default(false)
    });

    return schema.validate(data);
  }

  validateUserUpdate(data) {
    const schema = Joi.object({
      name: Joi.string().min(2).max(50).optional(),
      email: Joi.string().email().optional(),
      phone: Joi.string().optional(),
      role: Joi.string().valid('user', 'admin', 'analyst').optional(),
      organizationId: Joi.string().optional(),
      isActive: Joi.boolean().optional(),
      permissions: Joi.array().items(Joi.string()).optional(),
      preferences: Joi.object().optional(),
      twoFactorEnabled: Joi.boolean().optional()
    });

    return schema.validate(data);
  }

  getPopulateFields() {
    return 'organizationId';
  }

  getSearchFields() {
    return ['name', 'email'];
  }
}

module.exports = new UserController();
