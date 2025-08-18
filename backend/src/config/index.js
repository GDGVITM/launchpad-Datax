require('dotenv').config();

const config = {
  // Server Configuration
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT) || 5000,
  API_BASE_URL: process.env.API_BASE_URL || 'http://localhost:5000/api',

  // Database Configuration
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/cybersecurity_saas',
  MONGODB_TEST_URI: process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/cybersecurity_saas_test',

  // JWT Configuration
  JWT_SECRET: process.env.JWT_SECRET || 'fallback-jwt-secret',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'fallback-refresh-secret',
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '30d',

  // Blockchain Configuration
  BLOCKCHAIN_ENABLED: process.env.BLOCKCHAIN_ENABLED === 'true',
  BLOCKCHAIN_NETWORK: process.env.BLOCKCHAIN_NETWORK || 'polygon-mumbai',
  ETHEREUM_RPC_URL: process.env.ETHEREUM_RPC_URL || process.env.POLYGON_TESTNET_RPC_URL || 'https://polygon-mumbai.g.alchemy.com/v2/demo',
  PRIVATE_KEY: process.env.PRIVATE_KEY || process.env.ADMIN_PRIVATE_KEY || '0x0000000000000000000000000000000000000000000000000000000000000000',
  CONTRACT_ADDRESS: process.env.CONTRACT_ADDRESS || '0x1234567890123456789012345678901234567890',

  // ChainShield Smart Contract Configuration
  CHAINSHIELD_CONTRACT_ADDRESS: process.env.CHAINSHIELD_CONTRACT_ADDRESS,
  CHAINSHIELD_ORG_ID: process.env.CHAINSHIELD_ORG_ID || 'cybersecurity_saas_org',
  CHAINSHIELD_PLATFORM_ADMIN: process.env.CHAINSHIELD_PLATFORM_ADMIN || process.env.ADMIN_WALLET_ADDRESS,
  
  // Additional blockchain settings
  POLYGON_RPC_URL: process.env.POLYGON_TESTNET_RPC_URL,
  INFURA_PROJECT_ID: process.env.INFURA_PROJECT_ID,

  // Email Configuration
  EMAIL: {
    HOST: process.env.EMAIL_HOST || 'smtp.gmail.com',
    PORT: parseInt(process.env.EMAIL_PORT) || 587,
    USER: process.env.EMAIL_USER || 'test@example.com',
    PASS: process.env.EMAIL_PASS || 'test-password',
    FROM: process.env.EMAIL_FROM || 'noreply@cybersecurity-saas.com'
  },

  // SMS Configuration
  TWILIO: {
    ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID || 'test-sid',
    AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN || 'test-token',
    PHONE_NUMBER: process.env.TWILIO_PHONE_NUMBER || '+1234567890'
  },

  // Frontend Configuration
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000',
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:3000',

  // Security Configuration
  BCRYPT_SALT_ROUNDS: parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12,
  RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000, // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,

  // File Upload Configuration
  MAX_FILE_SIZE: parseInt(process.env.MAX_FILE_SIZE) || 10485760, // 10MB
  UPLOAD_PATH: process.env.UPLOAD_PATH || './uploads',
  REPORTS_PATH: process.env.REPORTS_PATH || './reports',

  // Other Configuration
  WEBHOOK_SECRET: process.env.WEBHOOK_SECRET || 'dev-webhook-secret',
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
  REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',
  API_KEY_ENCRYPTION_SECRET: process.env.API_KEY_ENCRYPTION_SECRET || 'dev-api-key-secret',
  REPORT_STORAGE_PATH: process.env.REPORT_STORAGE_PATH || './storage/reports',
  TEMP_PATH: process.env.TEMP_PATH || './temp',

  // Development flags
  IS_DEVELOPMENT: process.env.NODE_ENV === 'development',
  IS_PRODUCTION: process.env.NODE_ENV === 'production',
  IS_TEST: process.env.NODE_ENV === 'test'
};

module.exports = config;
