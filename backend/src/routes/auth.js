const express = require('express');
const authController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');
const rateLimit = require('express-rate-limit');

const router = express.Router();

// Rate limiting for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 requests per windowMs
  message: 'Too many authentication attempts, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 login attempts per windowMs
  message: 'Too many login attempts, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
});

// Public authentication routes
router.post('/register', authLimiter, authController.register);
router.post('/login', loginLimiter, authController.login);
router.post('/refresh-token', authController.refreshToken);
router.post('/logout', authController.logout);
router.post('/forgot-password', authLimiter, authController.requestPasswordReset);
router.post('/reset-password', authController.resetPassword);

// Protected routes (require authentication)
router.use(authenticateToken);

// Profile management
router.get('/profile', authController.getProfile);
router.put('/profile', authController.updateProfile);
router.put('/change-password', authController.changePassword);

// Wallet integration
router.post('/link-wallet', authController.linkWallet);

module.exports = router;
