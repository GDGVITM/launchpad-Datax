const User = require('../models/User');
const authService = require('../services/authService');
const userService = require('../services/userService');
const blockchainService = require('../services/blockchainService');
const BaseController = require('./baseController');
const Joi = require('joi');

/**
 * Authentication Controller
 * Handles user authentication, registration, and session management
 */
class AuthController extends BaseController {
  constructor() {
    super(User, 'User');
  }

  /**
   * User registration with blockchain integration
   */
  async register(req, res) {
    try {
      const { email, password, name, role = 'Analyst' } = req.body;

      // Basic validation
      if (!email || !password || !name) {
        return res.status(400).json({
          success: false,
          message: 'Email, password, and name are required',
          timestamp: new Date().toISOString()
        });
      }

      // Check if user already exists
      const existingUser = await User.findOne({ email: email.toLowerCase() });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'User already exists with this email',
          timestamp: new Date().toISOString()
        });
      }

      // Create user
      const userData = {
        email: email.toLowerCase(),
        passwordHash: password, // Will be hashed by pre-save middleware
        role,
        status: 'Active',
        profile: {
          firstName: name.split(' ')[0],
          lastName: name.split(' ').slice(1).join(' ') || ''
        }
      };

      const user = await User.create(userData);

      // Generate simple JWT token
      const jwt = require('jsonwebtoken');
      const accessToken = jwt.sign(
        { 
          id: user._id, 
          email: user.email, 
          role: user.role 
        },
        process.env.JWT_SECRET || 'fallback-secret',
        { expiresIn: '24h' }
      );

      const refreshToken = jwt.sign(
        { id: user._id },
        process.env.JWT_REFRESH_SECRET || 'fallback-refresh-secret',
        { expiresIn: '7d' }
      );

      // Remove password from response
      const userResponse = user.toObject();
      delete userResponse.passwordHash;

      return res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: {
          user: userResponse,
          tokens: {
            accessToken,
            refreshToken
          }
        },
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Registration error:', error);
      return res.status(500).json({
        success: false,
        message: 'Registration failed',
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * User login with dual authentication support
   */
  async login(req, res) {
    try {
      const { email, password, walletAddress, signature } = req.body;

      // Basic validation
      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Email and password are required',
          timestamp: new Date().toISOString()
        });
      }

      // Find user by email
      const user = await User.findOne({ email: email.toLowerCase() });
      
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials',
          timestamp: new Date().toISOString()
        });
      }

      // Check password
      const isPasswordValid = await user.comparePassword(password);
      
      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials',
          timestamp: new Date().toISOString()
        });
      }

      if (user.status !== 'Active') {
        return res.status(401).json({
          success: false,
          message: 'Account is deactivated',
          timestamp: new Date().toISOString()
        });
      }

      // Update last login
      await User.findByIdAndUpdate(user._id, {
        lastLogin: new Date()
      });

      // Generate simple JWT token
      const jwt = require('jsonwebtoken');
      const accessToken = jwt.sign(
        { 
          id: user._id, 
          email: user.email, 
          role: user.role 
        },
        process.env.JWT_SECRET || 'fallback-secret',
        { expiresIn: '24h' }
      );

      const refreshToken = jwt.sign(
        { id: user._id },
        process.env.JWT_REFRESH_SECRET || 'fallback-refresh-secret',
        { expiresIn: '7d' }
      );

      // Remove password from response
      const userResponse = user.toObject();
      delete userResponse.passwordHash;

      return res.status(200).json({
        success: true,
        message: 'Login successful',
        data: {
          user: userResponse,
          tokens: {
            accessToken,
            refreshToken
          }
        },
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Login error:', error);
      return res.status(500).json({
        success: false,
        message: 'Login failed',
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Refresh access token
   */
  async refreshToken(req, res) {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return this.sendError(res, 'Refresh token is required', 400);
      }

      const tokens = await authService.refreshTokens(refreshToken);
      
      return this.sendSuccess(res, { tokens }, 'Tokens refreshed successfully');

    } catch (error) {
      console.error('Token refresh error:', error);
      return this.sendError(res, 'Token refresh failed', 401);
    }
  }

  /**
   * User logout
   */
  async logout(req, res) {
    try {
      const { refreshToken } = req.body;

      if (refreshToken) {
        await authService.invalidateRefreshToken(refreshToken);
      }

      return this.sendSuccess(res, null, 'Logged out successfully');

    } catch (error) {
      console.error('Logout error:', error);
      return this.sendError(res, 'Logout failed');
    }
  }

  /**
   * Get current user profile
   */
  async getProfile(req, res) {
    try {
      const user = await User.findById(req.user.id)
        .populate('organizationId', 'name type')
        .select('-password');

      if (!user) {
        return this.sendNotFound(res, 'User profile not found');
      }

      return this.sendSuccess(res, user, 'Profile retrieved successfully');

    } catch (error) {
      console.error('Get profile error:', error);
      return this.sendError(res, 'Failed to retrieve profile');
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(req, res) {
    try {
      const { error } = this.validateProfileUpdate(req.body);
      if (error) {
        return this.sendValidationError(res, error.details);
      }

      const allowedUpdates = ['name', 'email', 'phone', 'preferences', 'twoFactorEnabled'];
      const updates = {};

      Object.keys(req.body).forEach(key => {
        if (allowedUpdates.includes(key)) {
          updates[key] = req.body[key];
        }
      });

      const user = await User.findByIdAndUpdate(
        req.user.id,
        updates,
        { new: true, runValidators: true }
      ).select('-password');

      if (!user) {
        return this.sendNotFound(res, 'User not found');
      }

      return this.sendSuccess(res, user, 'Profile updated successfully');

    } catch (error) {
      console.error('Update profile error:', error);
      return this.sendError(res, 'Failed to update profile');
    }
  }

  /**
   * Change password
   */
  async changePassword(req, res) {
    try {
      const { error } = this.validatePasswordChange(req.body);
      if (error) {
        return this.sendValidationError(res, error.details);
      }

      const { currentPassword, newPassword } = req.body;

      const success = await authService.changePassword(
        req.user.id,
        currentPassword,
        newPassword
      );

      if (!success) {
        return this.sendError(res, 'Current password is incorrect', 400);
      }

      return this.sendSuccess(res, null, 'Password changed successfully');

    } catch (error) {
      console.error('Change password error:', error);
      return this.sendError(res, 'Failed to change password');
    }
  }

  /**
   * Request password reset
   */
  async requestPasswordReset(req, res) {
    try {
      const { email } = req.body;

      if (!email) {
        return this.sendError(res, 'Email is required', 400);
      }

      await authService.requestPasswordReset(email);

      return this.sendSuccess(res, null, 'Password reset email sent if account exists');

    } catch (error) {
      console.error('Password reset request error:', error);
      return this.sendError(res, 'Failed to process password reset request');
    }
  }

  /**
   * Reset password with token
   */
  async resetPassword(req, res) {
    try {
      const { token, newPassword } = req.body;

      if (!token || !newPassword) {
        return this.sendError(res, 'Token and new password are required', 400);
      }

      const success = await authService.resetPassword(token, newPassword);

      if (!success) {
        return this.sendError(res, 'Invalid or expired reset token', 400);
      }

      return this.sendSuccess(res, null, 'Password reset successfully');

    } catch (error) {
      console.error('Password reset error:', error);
      return this.sendError(res, 'Failed to reset password');
    }
  }

  /**
   * Link wallet address to user account
   */
  async linkWallet(req, res) {
    try {
      const { walletAddress, signature } = req.body;

      if (!walletAddress || !signature) {
        return this.sendError(res, 'Wallet address and signature are required', 400);
      }

      // Verify wallet ownership
      const isValid = await authService.verifyWalletSignature(walletAddress, signature);
      if (!isValid) {
        return this.sendError(res, 'Invalid wallet signature', 400);
      }

      // Check if wallet is already linked to another account
      const existingUser = await User.findOne({ 
        walletAddress, 
        _id: { $ne: req.user.id } 
      });

      if (existingUser) {
        return this.sendError(res, 'Wallet address is already linked to another account', 400);
      }

      // Link wallet to current user
      const user = await User.findByIdAndUpdate(
        req.user.id,
        { 
          walletAddress,
          isWalletLinked: true 
        },
        { new: true }
      ).select('-password');

      return this.sendSuccess(res, user, 'Wallet linked successfully');

    } catch (error) {
      console.error('Link wallet error:', error);
      return this.sendError(res, 'Failed to link wallet');
    }
  }

  /**
   * Validation schemas
   */
  validateRegistration(data) {
    const schema = Joi.object({
      email: Joi.string().email().required(),
      password: Joi.string().min(8).required(),
      name: Joi.string().min(2).max(50).required(),
      organizationId: Joi.string().required(),
      role: Joi.string().valid('user', 'admin', 'analyst').optional()
    });

    return schema.validate(data);
  }

  validateLogin(data) {
    const schema = Joi.alternatives().try(
      Joi.object({
        email: Joi.string().email().required(),
        password: Joi.string().required()
      }),
      Joi.object({
        walletAddress: Joi.string().required(),
        signature: Joi.string().required()
      })
    );

    return schema.validate(data);
  }

  validateProfileUpdate(data) {
    const schema = Joi.object({
      name: Joi.string().min(2).max(50).optional(),
      email: Joi.string().email().optional(),
      phone: Joi.string().optional(),
      preferences: Joi.object().optional(),
      twoFactorEnabled: Joi.boolean().optional()
    });

    return schema.validate(data);
  }

  validatePasswordChange(data) {
    const schema = Joi.object({
      currentPassword: Joi.string().required(),
      newPassword: Joi.string().min(8).required()
    });

    return schema.validate(data);
  }
}

module.exports = new AuthController();
