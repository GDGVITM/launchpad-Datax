#!/usr/bin/env node

/**
 * Cybersecurity SaaS Platform Server
 * Main entry point for the application
 */

const { server } = require('./src/app');
const config = require('./src/config');

const PORT = config.PORT;

// Start server
server.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════════════╗
║                 CYBERSECURITY SAAS PLATFORM                  ║
╠═══════════════════════════════════════════════════════════════╣
║  Server running on port: ${PORT.toString().padEnd(40)}║
║  Environment: ${config.NODE_ENV.padEnd(48)}║
║  API Base URL: ${config.API_BASE_URL.padEnd(47)}║
║  Database: Connected to MongoDB${' '.repeat(31)}║
║  Blockchain: ${(config.BLOCKCHAIN_ENABLED ? 'Enabled' : 'Disabled').padEnd(45)}║
║  Network: ${(config.BLOCKCHAIN_NETWORK || 'N/A').padEnd(48)}║
║  ChainShield: ${(config.CHAINSHIELD_CONTRACT_ADDRESS ? 'Deployed' : 'Not Deployed').padEnd(44)}║
╚═══════════════════════════════════════════════════════════════╝
  `);

  if (config.BLOCKCHAIN_ENABLED && config.CHAINSHIELD_CONTRACT_ADDRESS) {
    console.log(`🔗 ChainShield Contract: ${config.CHAINSHIELD_CONTRACT_ADDRESS}`);
    console.log(`🏢 Organization ID: ${config.CHAINSHIELD_ORG_ID}`);
  }

  if (config.NODE_ENV === 'development') {
    console.log(`\n📋 Available endpoints:`);
    console.log(`  Health Check: ${config.API_BASE_URL}/health`);
    console.log(`  API Status: ${config.API_BASE_URL}/status`);
    console.log(`  Authentication: ${config.API_BASE_URL}/auth/*`);
    console.log(`  Users: ${config.API_BASE_URL}/users/*`);
    console.log(`  Logs: ${config.API_BASE_URL}/logs/*`);
    console.log(`  Threats: ${config.API_BASE_URL}/threats/*`);
    console.log(`  Alerts: ${config.API_BASE_URL}/alerts/*`);
  }

  console.log(`\n🚀 Server ready and accepting connections!`);
});

// Error handling for server startup
server.on('error', (error) => {
  if (error.syscall !== 'listen') {
    throw error;
  }

  const bind = typeof PORT === 'string' ? 'Pipe ' + PORT : 'Port ' + PORT;

  switch (error.code) {
    case 'EACCES':
      console.error(`❌ ${bind} requires elevated privileges`);
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(`❌ ${bind} is already in use`);
      process.exit(1);
      break;
    default:
      throw error;
  }
});

module.exports = server;
