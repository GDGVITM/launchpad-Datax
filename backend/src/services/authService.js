const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { User, Log } = require('../models');
const config = require('../config');
const { logger, securityLogger } = require('../utils/logger');
const CryptoUtils = require('../utils/crypto');

/**
 * Authentication Service
 * Handles user authentication, registration, and session management
 */
class AuthService {
  /**
   * Register a new user with email and password
   * @param {Object} userData - User registration data
   * @returns {Promise<Object>} User and token data
   */
  async registerUser(userData) {
    try {
      const { email, password, walletAddress, role = 'Analyst' } = userData;

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

      // Create new user
      const user = new User({
        email: email?.toLowerCase(),
        passwordHash: password,
        walletAddress: walletAddress?.toUpperCase(),
        role,
        status: 'Active'
      });

      await user.save();

      // Generate tokens
      const tokens = this.generateTokens(user._id);

      // Log registration event
      await this.logAuthEvent('user_registration', user, {
        registrationMethod: walletAddress ? 'wallet' : 'email',
        role: role
      });

      securityLogger.info('User registered', {
        userId: user._id,
        email: user.email,
        walletAddress: user.walletAddress,
        method: walletAddress ? 'wallet' : 'email'
      });

      return {
        user: user.toJSON(),
        tokens
      };
    } catch (error) {
      logger.error('User registration error:', error.message);
      throw error;
    }
  }

  /**
   * Authenticate user with email and password
   * @param {string} email - User email
   * @param {string} password - User password
   * @param {Object} metadata - Request metadata
   * @returns {Promise<Object>} User and token data
   */
  async loginWithPassword(email, password, metadata = {}) {
    try {
      const user = await User.findOne({ 
        email: email.toLowerCase(),
        status: { $ne: 'Banned' }
      });

      if (!user) {
        await this.logFailedLogin(email, 'user_not_found', metadata);
        throw new Error('Invalid credentials');
      }

      // Check if account is locked
      if (user.isLocked) {
        await this.logFailedLogin(email, 'account_locked', metadata);
        throw new Error('Account is temporarily locked');
      }

      // Verify password
      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        await user.incLoginAttempts();
        await this.logFailedLogin(email, 'invalid_password', metadata);
        throw new Error('Invalid credentials');
      }

      // Check if account is active
      if (user.status !== 'Active') {
        await this.logFailedLogin(email, 'account_inactive', metadata);
        throw new Error('Account is not active');
      }

      // Reset login attempts on successful login
      if (user.security.loginAttempts > 0) {
        await user.resetLoginAttempts();
      }

      // Update last login
      user.lastLogin = new Date();
      await user.save();

      // Add to login history
      await user.addLoginHistory({
        ipAddress: metadata.ipAddress,
        userAgent: metadata.userAgent,
        location: metadata.location,
        success: true
      });

      // Generate tokens
      const tokens = this.generateTokens(user._id);

      // Log successful login
      await this.logAuthEvent('user_login', user, {
        loginMethod: 'password',
        ...metadata
      });

      securityLogger.info('User logged in', {
        userId: user._id,
        email: user.email,
        method: 'password',
        ip: metadata.ipAddress
      });

      return {
        user: user.toJSON(),
        tokens
      };
    } catch (error) {
      logger.error('Password login error:', error.message);
      throw error;
    }
  }

  /**
   * Authenticate user with wallet signature
   * @param {string} walletAddress - Wallet address
   * @param {string} signature - Signed message
   * @param {string} nonce - Original nonce
   * @param {Object} metadata - Request metadata
   * @returns {Promise<Object>} User and token data
   */
  async loginWithWallet(walletAddress, signature, nonce, metadata = {}) {
    try {
      const user = await User.findOne({ 
        walletAddress: walletAddress.toUpperCase(),
        status: { $ne: 'Banned' }
      });

      if (!user) {
        await this.logFailedLogin(walletAddress, 'wallet_not_found', metadata);
        throw new Error('Wallet not registered');
      }

      // Verify nonce
      if (!user.nonce || user.nonce !== nonce) {
        await this.logFailedLogin(walletAddress, 'invalid_nonce', metadata);
        throw new Error('Invalid or expired nonce');
      }

      // Verify signature (in production, use actual crypto verification)
      const isSignatureValid = this.verifyWalletSignature(
        walletAddress, 
        nonce, 
        signature
      );

      if (!isSignatureValid) {
        await this.logFailedLogin(walletAddress, 'invalid_signature', metadata);
        throw new Error('Invalid signature');
      }

      // Check if account is active
      if (user.status !== 'Active') {
        await this.logFailedLogin(walletAddress, 'account_inactive', metadata);
        throw new Error('Account is not active');
      }

      // Clear used nonce
      user.nonce = null;
      user.lastLogin = new Date();
      await user.save();

      // Add to login history
      await user.addLoginHistory({
        ipAddress: metadata.ipAddress,
        userAgent: metadata.userAgent,
        location: metadata.location,
        success: true
      });

      // Generate tokens
      const tokens = this.generateTokens(user._id);

      // Log successful login
      await this.logAuthEvent('user_login', user, {
        loginMethod: 'wallet',
        walletAddress: walletAddress,
        ...metadata
      });

      securityLogger.info('User logged in with wallet', {
        userId: user._id,
        walletAddress: user.walletAddress,
        method: 'wallet',
        ip: metadata.ipAddress
      });

      return {
        user: user.toJSON(),
        tokens
      };
    } catch (error) {
      logger.error('Wallet login error:', error.message);
      throw error;
    }
  }

  /**
   * Generate nonce for wallet authentication
   * @param {string} walletAddress - Wallet address
   * @returns {Promise<string>} Generated nonce
   */
  async generateNonce(walletAddress) {
    try {
      const user = await User.findOne({ 
        walletAddress: walletAddress.toUpperCase() 
      });

      if (!user) {
        throw new Error('Wallet not registered');
      }

      const nonce = CryptoUtils.generateNonce();
      user.nonce = nonce;
      await user.save();

      return nonce;
    } catch (error) {
      logger.error('Nonce generation error:', error.message);
      throw error;
    }
  }

  /**
   * Refresh access token using refresh token
   * @param {string} refreshToken - Refresh token
   * @returns {Promise<Object>} New tokens
   */
  async refreshToken(refreshToken) {
    try {
      // Verify refresh token
      const decoded = jwt.verify(refreshToken, config.JWT_REFRESH_SECRET);
      
      const user = await User.findById(decoded.userId);
      if (!user || user.status !== 'Active') {
        throw new Error('Invalid refresh token');
      }

      // Check if refresh token exists in user's token list
      const tokenExists = user.refreshTokens.some(
        token => token.token === refreshToken && token.expiresAt > new Date()
      );

      if (!tokenExists) {
        throw new Error('Refresh token not found or expired');
      }

      // Generate new tokens
      const tokens = this.generateTokens(user._id);

      // Remove old refresh token and add new one
      user.refreshTokens = user.refreshTokens.filter(
        token => token.token !== refreshToken
      );
      
      user.refreshTokens.push({
        token: tokens.refreshToken,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
      });

      await user.save();

      return tokens;
    } catch (error) {
      logger.error('Token refresh error:', error.message);
      throw error;
    }
  }

  /**
   * Logout user and invalidate tokens
   * @param {string} userId - User ID
   * @param {string} refreshToken - Refresh token to invalidate
   * @param {Object} metadata - Request metadata
   * @returns {Promise<void>}
   */
  async logout(userId, refreshToken, metadata = {}) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Remove refresh token
      if (refreshToken) {
        user.refreshTokens = user.refreshTokens.filter(
          token => token.token !== refreshToken
        );
        await user.save();
      }

      // Log logout event
      await this.logAuthEvent('user_logout', user, metadata);

      securityLogger.info('User logged out', {
        userId: user._id,
        email: user.email,
        ip: metadata.ipAddress
      });
    } catch (error) {
      logger.error('Logout error:', error.message);
      throw error;
    }
  }

  /**
   * Logout from all devices
   * @param {string} userId - User ID
   * @param {Object} metadata - Request metadata
   * @returns {Promise<void>}
   */
  async logoutAll(userId, metadata = {}) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Clear all refresh tokens
      user.refreshTokens = [];
      await user.save();

      // Log logout all event
      await this.logAuthEvent('user_logout', user, {
        ...metadata,
        logoutType: 'all_devices'
      });

      securityLogger.info('User logged out from all devices', {
        userId: user._id,
        email: user.email,
        ip: metadata.ipAddress
      });
    } catch (error) {
      logger.error('Logout all error:', error.message);
      throw error;
    }
  }

  /**
   * Generate JWT tokens
   * @param {string} userId - User ID
   * @returns {Object} Access and refresh tokens
   */
  generateTokens(userId) {
    const accessToken = jwt.sign(
      { userId, type: 'access' },
      config.JWT_SECRET,
      { expiresIn: config.JWT_EXPIRES_IN }
    );

    const refreshToken = jwt.sign(
      { userId, type: 'refresh' },
      config.JWT_REFRESH_SECRET,
      { expiresIn: config.JWT_REFRESH_EXPIRES_IN }
    );

    return {
      accessToken,
      refreshToken,
      expiresIn: config.JWT_EXPIRES_IN
    };
  }

  /**
   * Verify wallet signature (mock implementation)
   * In production, use ethers.js or web3.js for actual verification
   * @param {string} walletAddress - Wallet address
   * @param {string} message - Original message
   * @param {string} signature - Signature to verify
   * @returns {boolean} Verification result
   */
  verifyWalletSignature(walletAddress, message, signature) {
    // Mock verification - in production use actual crypto verification
    // const { ethers } = require('ethers');
    // const recoveredAddress = ethers.utils.verifyMessage(message, signature);
    // return recoveredAddress.toLowerCase() === walletAddress.toLowerCase();
    
    // For demo purposes, return true if signature is not empty
    return signature && signature.length > 0;
  }

  /**
   * Log authentication event
   * @param {string} eventType - Event type
   * @param {Object} user - User object
   * @param {Object} details - Event details
   * @returns {Promise<void>}
   */
  async logAuthEvent(eventType, user, details = {}) {
    try {
      await Log.create({
        eventType,
        userId: user._id,
        walletAddress: user.walletAddress,
        severity: 'Medium',
        source: 'authentication_service',
        details: {
          userId: user._id,
          email: user.email,
          walletAddress: user.walletAddress,
          role: user.role,
          ...details
        },
        metadata: {
          ipAddress: details.ipAddress,
          userAgent: details.userAgent,
          sessionId: details.sessionId
        }
      });
    } catch (error) {
      logger.error('Failed to log auth event:', error.message);
    }
  }

  /**
   * Log failed login attempt
   * @param {string} identifier - Email or wallet address
   * @param {string} reason - Failure reason
   * @param {Object} metadata - Request metadata
   * @returns {Promise<void>}
   */
  async logFailedLogin(identifier, reason, metadata = {}) {
    try {
      await Log.create({
        eventType: 'authentication_failure',
        severity: 'High',
        source: 'authentication_service',
        details: {
          identifier,
          reason,
          timestamp: new Date(),
          ...metadata
        },
        metadata: {
          ipAddress: metadata.ipAddress,
          userAgent: metadata.userAgent
        }
      });

      securityLogger.warn('Failed login attempt', {
        identifier,
        reason,
        ip: metadata.ipAddress,
        userAgent: metadata.userAgent
      });
    } catch (error) {
      logger.error('Failed to log failed login:', error.message);
    }
  }

  /**
   * Verify user session
   * @param {string} userId - User ID
   * @param {string} sessionId - Session ID
   * @returns {Promise<boolean>} Session valid
   */
  async verifySession(userId, sessionId) {
    try {
      const user = await User.findById(userId);
      if (!user || user.status !== 'Active') {
        return false;
      }

      // Check if user has been active recently
      const inactiveThreshold = new Date(Date.now() - 8 * 60 * 60 * 1000); // 8 hours
      if (user.lastActivity < inactiveThreshold) {
        return false;
      }

      return true;
    } catch (error) {
      logger.error('Session verification error:', error.message);
      return false;
    }
  }

  /**
   * Get user by token
   * @param {string} token - JWT token
   * @returns {Promise<Object>} User object
   */
  async getUserByToken(token) {
    try {
      const decoded = jwt.verify(token, config.JWT_SECRET);
      const user = await User.findById(decoded.userId).select('-passwordHash');
      
      if (!user || user.status !== 'Active') {
        throw new Error('Invalid token');
      }

      return user;
    } catch (error) {
      throw new Error('Invalid token');
    }
  }

  /**
   * Change user password
   * @param {string} userId - User ID
   * @param {string} currentPassword - Current password
   * @param {string} newPassword - New password
   * @param {Object} metadata - Request metadata
   * @returns {Promise<void>}
   */
  async changePassword(userId, currentPassword, newPassword, metadata = {}) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Verify current password
      const isCurrentPasswordValid = await user.comparePassword(currentPassword);
      if (!isCurrentPasswordValid) {
        throw new Error('Current password is incorrect');
      }

      // Update password
      user.passwordHash = newPassword; // Will be hashed by pre-save middleware
      user.security.lastPasswordChange = new Date();
      await user.save();

      // Invalidate all refresh tokens to force re-login
      user.refreshTokens = [];
      await user.save();

      // Log password change
      await this.logAuthEvent('user_update', user, {
        action: 'password_change',
        ...metadata
      });

      securityLogger.info('User password changed', {
        userId: user._id,
        email: user.email,
        ip: metadata.ipAddress
      });
    } catch (error) {
      logger.error('Password change error:', error.message);
      throw error;
    }
  }
}

module.exports = new AuthService();
