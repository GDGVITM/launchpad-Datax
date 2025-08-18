const express = require('express');

const router = express.Router();

// Import route modules
const authRoutes = require('./auth');
const userRoutes = require('./users');
const logRoutes = require('./logs');
const threatRoutes = require('./threats');
const alertRoutes = require('./alerts');

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Cybersecurity SaaS API is running',
    timestamp: new Date().toISOString(),
    version: process.env.API_VERSION || '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
});

// API status endpoint
router.get('/status', (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      api: 'Cybersecurity SaaS Platform',
      version: process.env.API_VERSION || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      blockchain: {
        enabled: process.env.BLOCKCHAIN_ENABLED === 'true',
        network: process.env.BLOCKCHAIN_NETWORK || 'polygon-mumbai',
        chainShield: {
          deployed: !!process.env.CHAINSHIELD_CONTRACT_ADDRESS,
          address: process.env.CHAINSHIELD_CONTRACT_ADDRESS || null
        }
      },
      features: {
        userManagement: true,
        logAnchoring: true,
        threatDetection: true,
        alertSystem: true,
        blockchainIntegration: process.env.BLOCKCHAIN_ENABLED === 'true'
      }
    },
    timestamp: new Date().toISOString()
  });
});

// Mount route modules
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/logs', logRoutes);
router.use('/threats', threatRoutes);
router.use('/alerts', alertRoutes);

// Catch-all for undefined routes
router.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found',
    path: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
