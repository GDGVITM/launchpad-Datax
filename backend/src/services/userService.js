const { User, Log, APIKey } = require('../models');
const { logger } = require('../utils/logger');
const AuthService = require('./authService');
const CryptoUtils = require('../utils/crypto');

/**
 * User Service
 * Handles user management, profiles, and account operations
 */
class UserService {
  /**
   * Get user profile by ID
   * @param {string} userId - User ID
   * @param {boolean} includePrivate - Include private fields
   * @returns {Promise<Object>} User profile
   */
  async getUserProfile(userId, includePrivate = false) {
    try {
      let selectFields = '-passwordHash -refreshTokens';
      if (!includePrivate) {
        selectFields += ' -security -nonce';
      }

      const user = await User.findById(userId).select(selectFields);
      if (!user) {
        throw new Error('User not found');
      }

      return user.toJSON();
    } catch (error) {
      logger.error('Get user profile error:', error.message);
      throw error;
    }
  }

  /**
   * Update user profile
   * @param {string} userId - User ID
   * @param {Object} updateData - Update data
   * @param {Object} metadata - Request metadata
   * @returns {Promise<Object>} Updated user profile
   */
  async updateUserProfile(userId, updateData, metadata = {}) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      const allowedFields = [
        'firstName',
        'lastName',
        'department',
        'phone',
        'timezone',
        'language',
        'notificationSettings'
      ];

      const updateObject = {};
      Object.keys(updateData).forEach(key => {
        if (allowedFields.includes(key)) {
          updateObject[key] = updateData[key];
        }
      });

      if (Object.keys(updateObject).length === 0) {
        throw new Error('No valid fields to update');
      }

      // Update user
      const updatedUser = await User.findByIdAndUpdate(
        userId,
        { $set: updateObject },
        { new: true, runValidators: true }
      ).select('-passwordHash -refreshTokens -nonce');

      // Log profile update
      await Log.create({
        eventType: 'user_update',
        userId: userId,
        severity: 'Low',
        source: 'user_service',
        description: 'User profile updated',
        details: {
          updatedFields: Object.keys(updateObject),
          ...metadata
        }
      });

      logger.info('User profile updated', {
        userId,
        updatedFields: Object.keys(updateObject)
      });

      return updatedUser.toJSON();
    } catch (error) {
      logger.error('Update user profile error:', error.message);
      throw error;
    }
  }

  /**
   * Update user notification settings
   * @param {string} userId - User ID
   * @param {Object} notificationSettings - Notification settings
   * @returns {Promise<Object>} Updated settings
   */
  async updateNotificationSettings(userId, notificationSettings) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Validate notification settings structure
      const validSettings = this.validateNotificationSettings(notificationSettings);

      user.notificationSettings = {
        ...user.notificationSettings,
        ...validSettings
      };

      await user.save();

      logger.info('Notification settings updated', {
        userId,
        settings: validSettings
      });

      return user.notificationSettings;
    } catch (error) {
      logger.error('Update notification settings error:', error.message);
      throw error;
    }
  }

  /**
   * Get all users with filtering and pagination
   * @param {Object} filters - Filter criteria
   * @param {Object} options - Query options
   * @param {string} requesterId - ID of user making request
   * @returns {Promise<Object>} Paginated users
   */
  async getUsers(filters = {}, options = {}, requesterId) {
    try {
      // Check requester permissions
      const requester = await User.findById(requesterId);
      if (!requester || !['Admin', 'Security_Analyst'].includes(requester.role)) {
        throw new Error('Insufficient permissions');
      }

      const {
        page = 1,
        limit = 50,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        includeInactive = false
      } = options;

      const query = this.buildUserQuery(filters, includeInactive);
      const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

      const skip = (page - 1) * limit;

      const [users, total] = await Promise.all([
        User.find(query)
          .select('-passwordHash -refreshTokens -nonce -security')
          .sort(sort)
          .skip(skip)
          .limit(limit)
          .lean(),
        User.countDocuments(query)
      ]);

      return {
        users,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      logger.error('Get users error:', error.message);
      throw error;
    }
  }

  /**
   * Create new user (admin only)
   * @param {Object} userData - User data
   * @param {string} createdBy - ID of admin creating user
   * @param {Object} metadata - Request metadata
   * @returns {Promise<Object>} Created user
   */
  async createUser(userData, createdBy, metadata = {}) {
    try {
      // Check creator permissions
      const creator = await User.findById(createdBy);
      if (!creator || creator.role !== 'Admin') {
        throw new Error('Only admins can create users');
      }

      const {
        email,
        walletAddress,
        role = 'Analyst',
        firstName,
        lastName,
        department,
        phone,
        sendWelcomeEmail = true
      } = userData;

      // Check if user already exists
      const existingUser = await User.findOne({
        $or: [
          { email: email?.toLowerCase() },
          { walletAddress: walletAddress?.toUpperCase() }
        ]
      });

      if (existingUser) {
        throw new Error('User already exists with this email or wallet address');
      }

      // Generate temporary password if email provided
      let tempPassword = null;
      if (email && !walletAddress) {
        tempPassword = CryptoUtils.generateSecurePassword();
      }

      // Create user
      const user = new User({
        email: email?.toLowerCase(),
        passwordHash: tempPassword,
        walletAddress: walletAddress?.toUpperCase(),
        role,
        firstName,
        lastName,
        department,
        phone,
        status: 'Active',
        createdBy: createdBy
      });

      await user.save();

      // Log user creation
      await Log.create({
        eventType: 'user_creation',
        userId: user._id,
        severity: 'Medium',
        source: 'user_service',
        description: 'New user created by admin',
        details: {
          createdBy,
          userRole: role,
          hasEmail: !!email,
          hasWallet: !!walletAddress,
          ...metadata
        }
      });

      // Send welcome email if configured
      if (sendWelcomeEmail && email && tempPassword) {
        await this.sendWelcomeEmail(user, tempPassword);
      }

      logger.info('User created', {
        userId: user._id,
        email: user.email,
        role: user.role,
        createdBy
      });

      return {
        user: user.toJSON(),
        tempPassword: tempPassword
      };
    } catch (error) {
      logger.error('Create user error:', error.message);
      throw error;
    }
  }

  /**
   * Update user role (admin only)
   * @param {string} userId - User ID to update
   * @param {string} newRole - New role
   * @param {string} updatedBy - ID of admin updating role
   * @param {Object} metadata - Request metadata
   * @returns {Promise<Object>} Updated user
   */
  async updateUserRole(userId, newRole, updatedBy, metadata = {}) {
    try {
      // Check updater permissions
      const updater = await User.findById(updatedBy);
      if (!updater || updater.role !== 'Admin') {
        throw new Error('Only admins can update user roles');
      }

      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      const oldRole = user.role;
      
      // Validate new role
      const validRoles = ['Admin', 'Security_Analyst', 'Compliance_Officer', 'Analyst', 'Viewer'];
      if (!validRoles.includes(newRole)) {
        throw new Error('Invalid role');
      }

      // Prevent self-demotion from admin
      if (userId === updatedBy && oldRole === 'Admin' && newRole !== 'Admin') {
        throw new Error('Cannot demote yourself from admin role');
      }

      user.role = newRole;
      await user.save();

      // Log role change
      await Log.create({
        eventType: 'user_update',
        userId: userId,
        severity: 'High',
        source: 'user_service',
        description: 'User role updated',
        details: {
          oldRole,
          newRole,
          updatedBy,
          roleChange: true,
          ...metadata
        }
      });

      logger.info('User role updated', {
        userId,
        oldRole,
        newRole,
        updatedBy
      });

      return user.toJSON();
    } catch (error) {
      logger.error('Update user role error:', error.message);
      throw error;
    }
  }

  /**
   * Deactivate user account
   * @param {string} userId - User ID to deactivate
   * @param {string} deactivatedBy - ID of admin deactivating user
   * @param {string} reason - Reason for deactivation
   * @param {Object} metadata - Request metadata
   * @returns {Promise<Object>} Deactivated user
   */
  async deactivateUser(userId, deactivatedBy, reason, metadata = {}) {
    try {
      // Check permissions
      const deactivator = await User.findById(deactivatedBy);
      if (!deactivator || deactivator.role !== 'Admin') {
        throw new Error('Only admins can deactivate users');
      }

      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Cannot deactivate yourself
      if (userId === deactivatedBy) {
        throw new Error('Cannot deactivate your own account');
      }

      user.status = 'Inactive';
      user.deactivatedAt = new Date();
      user.deactivatedBy = deactivatedBy;
      user.deactivationReason = reason;

      // Clear refresh tokens to force logout
      user.refreshTokens = [];

      await user.save();

      // Deactivate user's API keys
      await APIKey.updateMany(
        { userId: userId },
        { $set: { status: 'Inactive' } }
      );

      // Log deactivation
      await Log.create({
        eventType: 'user_deactivation',
        userId: userId,
        severity: 'High',
        source: 'user_service',
        description: 'User account deactivated',
        details: {
          deactivatedBy,
          reason,
          ...metadata
        }
      });

      logger.info('User deactivated', {
        userId,
        deactivatedBy,
        reason
      });

      return user.toJSON();
    } catch (error) {
      logger.error('Deactivate user error:', error.message);
      throw error;
    }
  }

  /**
   * Reactivate user account
   * @param {string} userId - User ID to reactivate
   * @param {string} reactivatedBy - ID of admin reactivating user
   * @param {Object} metadata - Request metadata
   * @returns {Promise<Object>} Reactivated user
   */
  async reactivateUser(userId, reactivatedBy, metadata = {}) {
    try {
      // Check permissions
      const reactivator = await User.findById(reactivatedBy);
      if (!reactivator || reactivator.role !== 'Admin') {
        throw new Error('Only admins can reactivate users');
      }

      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      user.status = 'Active';
      user.reactivatedAt = new Date();
      user.reactivatedBy = reactivatedBy;

      await user.save();

      // Log reactivation
      await Log.create({
        eventType: 'user_reactivation',
        userId: userId,
        severity: 'Medium',
        source: 'user_service',
        description: 'User account reactivated',
        details: {
          reactivatedBy,
          ...metadata
        }
      });

      logger.info('User reactivated', {
        userId,
        reactivatedBy
      });

      return user.toJSON();
    } catch (error) {
      logger.error('Reactivate user error:', error.message);
      throw error;
    }
  }

  /**
   * Get user activity history
   * @param {string} userId - User ID
   * @param {Object} options - Query options
   * @param {string} requesterId - ID of user making request
   * @returns {Promise<Object>} User activity history
   */
  async getUserActivity(userId, options = {}, requesterId) {
    try {
      // Check permissions
      const requester = await User.findById(requesterId);
      if (!requester) {
        throw new Error('Requester not found');
      }

      // Users can view their own activity, admins can view any
      if (userId !== requesterId && requester.role !== 'Admin') {
        throw new Error('Insufficient permissions');
      }

      const { page = 1, limit = 50, eventType, dateRange } = options;

      const query = { userId: userId };
      if (eventType) {
        query.eventType = eventType;
      }
      if (dateRange) {
        query.timestamp = {};
        if (dateRange.from) {
          query.timestamp.$gte = new Date(dateRange.from);
        }
        if (dateRange.to) {
          query.timestamp.$lte = new Date(dateRange.to);
        }
      }

      const skip = (page - 1) * limit;

      const [activities, total] = await Promise.all([
        Log.find(query)
          .sort({ timestamp: -1 })
          .skip(skip)
          .limit(limit)
          .select('-details')
          .lean(),
        Log.countDocuments(query)
      ]);

      return {
        activities,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      logger.error('Get user activity error:', error.message);
      throw error;
    }
  }

  /**
   * Get user statistics
   * @param {string} userId - User ID
   * @param {string} requesterId - ID of user making request
   * @returns {Promise<Object>} User statistics
   */
  async getUserStatistics(userId, requesterId) {
    try {
      // Check permissions
      const requester = await User.findById(requesterId);
      if (!requester) {
        throw new Error('Requester not found');
      }

      if (userId !== requesterId && !['Admin', 'Security_Analyst'].includes(requester.role)) {
        throw new Error('Insufficient permissions');
      }

      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      const [
        totalLogins,
        recentActivity,
        apiKeyCount,
        failedLogins
      ] = await Promise.all([
        Log.countDocuments({ 
          userId: userId, 
          eventType: 'user_login' 
        }),
        Log.countDocuments({ 
          userId: userId, 
          timestamp: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } 
        }),
        APIKey.countDocuments({ 
          userId: userId, 
          status: 'Active' 
        }),
        Log.countDocuments({ 
          userId: userId, 
          eventType: 'authentication_failure' 
        })
      ]);

      return {
        user: {
          id: user._id,
          email: user.email,
          role: user.role,
          status: user.status,
          createdAt: user.createdAt,
          lastLogin: user.lastLogin,
          lastActivity: user.lastActivity
        },
        statistics: {
          totalLogins,
          recentActivity,
          activeApiKeys: apiKeyCount,
          failedLogins,
          accountAge: Math.floor((Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24))
        }
      };
    } catch (error) {
      logger.error('Get user statistics error:', error.message);
      throw error;
    }
  }

  /**
   * Send welcome email to new user
   * @param {Object} user - User object
   * @param {string} tempPassword - Temporary password
   * @returns {Promise<void>}
   */
  async sendWelcomeEmail(user, tempPassword) {
    try {
      // This would integrate with your email service
      // For now, we'll just log the welcome email details
      logger.info('Welcome email would be sent', {
        userId: user._id,
        email: user.email,
        hasTempPassword: !!tempPassword
      });

      // In production, integrate with AlertService or email service:
      // await AlertService.sendEmail(user.email, welcomeEmailContent);
    } catch (error) {
      logger.error('Send welcome email error:', error.message);
    }
  }

  /**
   * Validate notification settings structure
   * @param {Object} settings - Notification settings
   * @returns {Object} Validated settings
   */
  validateNotificationSettings(settings) {
    const validSettings = {};
    const allowedChannels = ['email', 'sms', 'realtime', 'webhook'];
    const allowedTypes = [
      'security_alerts',
      'system_alerts',
      'compliance_alerts',
      'user_activity',
      'api_activity'
    ];

    allowedChannels.forEach(channel => {
      if (settings[channel] !== undefined) {
        validSettings[channel] = Boolean(settings[channel]);
      }
    });

    allowedTypes.forEach(type => {
      if (settings[type] !== undefined) {
        validSettings[type] = Boolean(settings[type]);
      }
    });

    if (settings.webhookUrl && typeof settings.webhookUrl === 'string') {
      // Basic URL validation
      try {
        new URL(settings.webhookUrl);
        validSettings.webhookUrl = settings.webhookUrl;
      } catch (error) {
        throw new Error('Invalid webhook URL');
      }
    }

    return validSettings;
  }

  /**
   * Build MongoDB query from filters
   * @param {Object} filters - Filter criteria
   * @param {boolean} includeInactive - Include inactive users
   * @returns {Object} MongoDB query
   */
  buildUserQuery(filters, includeInactive = false) {
    const query = {};

    if (!includeInactive) {
      query.status = { $ne: 'Banned' };
    }

    if (filters.role) {
      if (Array.isArray(filters.role)) {
        query.role = { $in: filters.role };
      } else {
        query.role = filters.role;
      }
    }

    if (filters.status) {
      query.status = filters.status;
    }

    if (filters.department) {
      query.department = filters.department;
    }

    if (filters.search) {
      query.$or = [
        { email: { $regex: filters.search, $options: 'i' } },
        { firstName: { $regex: filters.search, $options: 'i' } },
        { lastName: { $regex: filters.search, $options: 'i' } }
      ];
    }

    if (filters.dateRange) {
      query.createdAt = {};
      if (filters.dateRange.from) {
        query.createdAt.$gte = new Date(filters.dateRange.from);
      }
      if (filters.dateRange.to) {
        query.createdAt.$lte = new Date(filters.dateRange.to);
      }
    }

    return query;
  }
}

module.exports = new UserService();
