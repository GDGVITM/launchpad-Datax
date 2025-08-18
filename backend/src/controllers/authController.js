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
      const { error } = this.validateRegistration(req.body);
      if (error) {
        return this.sendValidationError(res, error.details);
      }

      const { email, password, name, organizationId, role = 'user' } = req.body;

      // Check if user already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return this.sendError(res, 'User already exists with this email', 400);
      }

      // Create user
      const userData = {
        email,
        password,
        name,
        organizationId,
        role,
        isActive: true
      };

      const user = await userService.createUser(userData);

      // Register user on blockchain if enabled
      if (process.env.BLOCKCHAIN_ENABLED === 'true') {
        try {
          await blockchainService.registerUser(user._id.toString(), organizationId);
          await User.findByIdAndUpdate(user._id, { 
            isBlockchainRegistered: true 
          });
        } catch (blockchainError) {
          console.error('Blockchain registration failed:', blockchainError);
          // Continue with registration but log the blockchain failure
        }
      }

      // Generate tokens
      const tokens = authService.generateTokens(user);

      // Remove password from response
      const userResponse = user.toObject();
      delete userResponse.password;

      return this.sendSuccess(res, {
        user: userResponse,
        tokens
      }, 'User registered successfully', 201);

    } catch (error) {
      console.error('Registration error:', error);
      return this.sendError(res, 'Registration failed');
    }
  }

  /**
   * User login with dual authentication support
   */
  async login(req, res) {
    try {
      const { error } = this.validateLogin(req.body);
      if (error) {
        return this.sendValidationError(res, error.details);
      }

      const { email, password, walletAddress, signature } = req.body;

      let user;

      if (email && password) {
        // Traditional email/password login
        user = await authService.authenticateUser(email, password);
      } else if (walletAddress && signature) {
        // Blockchain wallet login
        user = await authService.authenticateWallet(walletAddress, signature);
      } else {
        return this.sendError(res, 'Invalid login credentials provided', 400);
      }

      if (!user) {
        return this.sendError(res, 'Invalid credentials', 401);
      }

      if (!user.isActive) {
        return this.sendError(res, 'Account is deactivated', 401);
      }

      // Update last login
      await User.findByIdAndUpdate(user._id, {
        lastLogin: new Date(),
        $inc: { loginCount: 1 }
      });

      // Generate tokens
      const tokens = authService.generateTokens(user);

      // Remove password from response
      const userResponse = user.toObject();
      delete userResponse.password;

      return this.sendSuccess(res, {
        user: userResponse,
        tokens
      }, 'Login successful');

    } catch (error) {
      console.error('Login error:', error);
      return this.sendError(res, 'Login failed');
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
