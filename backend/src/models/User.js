const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const config = require('../config');

/**
 * User Model Schema
 * Supports both traditional email/password and blockchain wallet authentication
 */
const userSchema = new mongoose.Schema({
  // Basic user information
  email: {
    type: String,
    unique: true,
    sparse: true, // Allow null values for wallet-only users
    lowercase: true,
    trim: true,
    validate: {
      validator: function(email) {
        // Email is required if no wallet address is provided
        return this.walletAddress || email;
      },
      message: 'Either email or wallet address is required'
    }
  },

  // Traditional authentication
  passwordHash: {
    type: String,
    required: function() {
      return this.email && !this.walletAddress;
    }
  },

  // Blockchain authentication
  walletAddress: {
    type: String,
    unique: true,
    sparse: true,
    uppercase: true,
    validate: {
      validator: function(address) {
        return !address || /^0x[a-fA-F0-9]{40}$/.test(address);
      },
      message: 'Invalid Ethereum wallet address format'
    }
  },

  // Authentication nonce for wallet login
  nonce: {
    type: String,
    default: null
  },

  // User role and permissions
  role: {
    type: String,
    enum: ['Admin', 'Analyst', 'Auditor'],
    default: 'Analyst',
    required: true
  },

  permissions: [{
    type: String,
    enum: [
      'read:logs', 'write:logs', 'delete:logs',
      'read:threats', 'write:threats', 'resolve:threats',
      'read:users', 'write:users', 'delete:users',
      'read:reports', 'generate:reports', 'delete:reports',
      'read:alerts', 'write:alerts', 'delete:alerts',
      'manage:system', 'view:audit', 'manage:settings'
    ]
  }],

  // User status
  status: {
    type: String,
    enum: ['Active', 'Inactive', 'Banned', 'Pending'],
    default: 'Active'
  },

  // Profile information
  profile: {
    firstName: String,
    lastName: String,
    organization: String,
    department: String,
    phoneNumber: String,
    timezone: {
      type: String,
      default: 'UTC'
    }
  },

  // Security settings
  security: {
    twoFactorEnabled: {
      type: Boolean,
      default: false
    },
    lastPasswordChange: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
    loginAttempts: {
      type: Number,
      default: 0
    },
    lockUntil: Date
  },

  // Preferences
  preferences: {
    notifications: {
      email: { type: Boolean, default: true },
      sms: { type: Boolean, default: false },
      push: { type: Boolean, default: true },
      webhook: { type: Boolean, default: false }
    },
    alertSettings: {
      minimumSeverity: {
        type: String,
        enum: ['Low', 'Medium', 'High', 'Critical'],
        default: 'Medium'
      },
      threatTypes: [String],
      autoAssign: { type: Boolean, default: false }
    },
    dashboardLayout: mongoose.Schema.Types.Mixed,
    language: {
      type: String,
      default: 'en'
    }
  },

  // API access
  apiKeys: [{
    keyId: String,
    hashedKey: String,
    name: String,
    permissions: [String],
    createdAt: { type: Date, default: Date.now },
    lastUsed: Date,
    expiresAt: Date,
    revoked: { type: Boolean, default: false }
  }],

  // Session management
  refreshTokens: [{
    token: String,
    createdAt: { type: Date, default: Date.now },
    expiresAt: Date,
    deviceInfo: String
  }],

  // Activity tracking
  lastLogin: Date,
  lastActivity: Date,
  loginHistory: [{
    timestamp: { type: Date, default: Date.now },
    ipAddress: String,
    userAgent: String,
    location: String,
    success: Boolean
  }]
}, {
  timestamps: true,
  toJSON: { 
    transform: function(doc, ret) {
      delete ret.passwordHash;
      delete ret.nonce;
      delete ret.security.passwordResetToken;
      delete ret.refreshTokens;
      delete ret.apiKeys;
      return ret;
    }
  }
});

// Indexes for performance
userSchema.index({ email: 1 });
userSchema.index({ walletAddress: 1 });
userSchema.index({ status: 1 });
userSchema.index({ role: 1 });
userSchema.index({ 'lastActivity': 1 });

// Virtual for account lock status
userSchema.virtual('isLocked').get(function() {
  return !!(this.security.lockUntil && this.security.lockUntil > Date.now());
});

// Password hashing middleware
userSchema.pre('save', async function(next) {
  // Only hash password if it's new or modified
  if (!this.isModified('passwordHash')) return next();

  try {
    if (this.passwordHash) {
      const salt = await bcrypt.genSalt(config.BCRYPT_SALT_ROUNDS);
      this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
    }
    next();
  } catch (error) {
    next(error);
  }
});

// Set default permissions based on role
userSchema.pre('save', function(next) {
  if (this.isModified('role')) {
    switch (this.role) {
      case 'Admin':
        this.permissions = [
          'read:logs', 'write:logs', 'delete:logs',
          'read:threats', 'write:threats', 'resolve:threats',
          'read:users', 'write:users', 'delete:users',
          'read:reports', 'generate:reports', 'delete:reports',
          'read:alerts', 'write:alerts', 'delete:alerts',
          'manage:system', 'view:audit', 'manage:settings'
        ];
        break;
      case 'Analyst':
        this.permissions = [
          'read:logs', 'write:logs',
          'read:threats', 'write:threats', 'resolve:threats',
          'read:reports', 'generate:reports',
          'read:alerts', 'write:alerts'
        ];
        break;
      case 'Auditor':
        this.permissions = [
          'read:logs', 'read:threats', 'read:reports', 
          'read:alerts', 'view:audit'
        ];
        break;
    }
  }
  next();
});

// Instance methods
userSchema.methods = {
  /**
   * Compare password for authentication
   * @param {string} candidatePassword - Password to compare
   * @returns {Promise<boolean>} Match result
   */
  async comparePassword(candidatePassword) {
    if (!this.passwordHash) return false;
    return bcrypt.compare(candidatePassword, this.passwordHash);
  },

  /**
   * Increment login attempts
   * @returns {Promise<void>}
   */
  async incLoginAttempts() {
    // If we have a previous lock that has expired, restart at 1
    if (this.security.lockUntil && this.security.lockUntil < Date.now()) {
      return this.updateOne({
        $unset: { 'security.lockUntil': 1 },
        $set: { 'security.loginAttempts': 1 }
      });
    }

    const updates = { $inc: { 'security.loginAttempts': 1 } };
    
    // Lock account after 5 failed attempts for 2 hours
    if (this.security.loginAttempts + 1 >= 5 && !this.isLocked) {
      updates.$set = { 'security.lockUntil': Date.now() + 2 * 60 * 60 * 1000 }; // 2 hours
    }

    return this.updateOne(updates);
  },

  /**
   * Reset login attempts
   * @returns {Promise<void>}
   */
  async resetLoginAttempts() {
    return this.updateOne({
      $unset: { 
        'security.lockUntil': 1,
        'security.loginAttempts': 1
      }
    });
  },

  /**
   * Update last activity
   * @returns {Promise<void>}
   */
  async updateLastActivity() {
    this.lastActivity = new Date();
    return this.save();
  },

  /**
   * Check if user has permission
   * @param {string} permission - Permission to check
   * @returns {boolean} Has permission
   */
  hasPermission(permission) {
    return this.permissions.includes(permission) || this.role === 'Admin';
  },

  /**
   * Add login to history
   * @param {Object} loginInfo - Login information
   * @returns {Promise<void>}
   */
  async addLoginHistory(loginInfo) {
    this.loginHistory.push({
      timestamp: new Date(),
      ipAddress: loginInfo.ipAddress,
      userAgent: loginInfo.userAgent,
      location: loginInfo.location || 'Unknown',
      success: loginInfo.success
    });

    // Keep only last 50 login records
    if (this.loginHistory.length > 50) {
      this.loginHistory = this.loginHistory.slice(-50);
    }

    return this.save();
  }
};

// Static methods
userSchema.statics = {
  /**
   * Find user by email or wallet address
   * @param {string} identifier - Email or wallet address
   * @returns {Promise<User>} User document
   */
  async findByIdentifier(identifier) {
    const isEmail = identifier.includes('@');
    const query = isEmail 
      ? { email: identifier.toLowerCase() }
      : { walletAddress: identifier.toUpperCase() };
    
    return this.findOne(query);
  },

  /**
   * Get users with specific role
   * @param {string} role - User role
   * @returns {Promise<User[]>} User documents
   */
  async findByRole(role) {
    return this.find({ role, status: 'Active' });
  },

  /**
   * Get active users count
   * @returns {Promise<number>} Active users count
   */
  async getActiveUsersCount() {
    return this.countDocuments({ status: 'Active' });
  }
};

const User = mongoose.model('User', userSchema);

module.exports = User;
