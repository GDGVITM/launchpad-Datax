const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const config = require('../src/config');

// Import models
const User = require('../src/models/User');
const Log = require('../src/models/Log');
const Threat = require('../src/models/Threat');
const Alert = require('../src/models/Alert');

async function seedDatabase() {
  try {
    console.log('🌱 Starting database seeding...');
    
    // Connect to MongoDB
    await mongoose.connect(config.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    console.log('🗑️  Clearing existing data...');
    await User.deleteMany({});
    await Log.deleteMany({});
    await Threat.deleteMany({});
    await Alert.deleteMany({});

    // Create a demo organization ID
    const demoOrgId = new mongoose.Types.ObjectId();

    // Create demo users
    console.log('👥 Creating demo users...');
    
    const demoUsers = [
      {
        email: 'admin@demo.com',
        passwordHash: 'demo123', // Will be hashed by pre-save middleware
        role: 'Admin',
        status: 'Active',
        profile: {
          firstName: 'Demo',
          lastName: 'Admin',
          organization: 'Demo Organization'
        }
      },
      {
        email: 'analyst@demo.com',
        passwordHash: 'demo123', // Will be hashed by pre-save middleware
        role: 'Analyst',
        status: 'Active',
        profile: {
          firstName: 'Demo',
          lastName: 'Analyst',
          organization: 'Demo Organization'
        }
      },
      {
        email: 'user@demo.com',
        passwordHash: 'demo123', // Will be hashed by pre-save middleware
        role: 'Auditor',
        status: 'Active',
        profile: {
          firstName: 'Demo',
          lastName: 'User',
          organization: 'Demo Organization'
        }
      }
    ];

    const createdUsers = await User.insertMany(demoUsers);
    console.log(`✅ Created ${createdUsers.length} users`);

    // Create sample logs
    console.log('📝 Creating sample logs...');
    const sampleLogs = [
      {
        eventType: 'user_login',
        severity: 'Low',
        source: 'web_app',
        userId: createdUsers[0]._id,
        details: { 
          message: 'User login successful',
          ip: '192.168.1.100', 
          userAgent: 'Chrome/123.0.0.0' 
        },
        metadata: {
          ipAddress: '192.168.1.100',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      },
      {
        eventType: 'authentication_failure',
        severity: 'Medium',
        source: 'web_app',
        details: { 
          message: 'Failed login attempt detected',
          ip: '203.0.113.42', 
          attempts: 5 
        },
        metadata: {
          ipAddress: '203.0.113.42',
          userAgent: 'curl/7.68.0'
        }
      },
      {
        eventType: 'data_access',
        severity: 'Low',
        source: 'api',
        userId: createdUsers[1]._id,
        details: { 
          message: 'Sensitive file accessed',
          file: 'financial_report.pdf', 
          action: 'read' 
        },
        metadata: {
          ipAddress: '192.168.1.101',
          sessionId: 'sess_123456789'
        }
      },
      {
        eventType: 'config_change',
        severity: 'Medium',
        source: 'system',
        userId: createdUsers[0]._id,
        details: { 
          message: 'Security policy updated',
          policy: 'password_complexity', 
          changes: ['min_length: 8->12'] 
        },
        metadata: {
          ipAddress: '192.168.1.100',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      }
    ];

    const createdLogs = await Log.insertMany(sampleLogs);
    console.log(`✅ Created ${createdLogs.length} logs`);

    // Create sample threats
    console.log('⚠️  Creating sample threats...');
    const sampleThreats = [
      {
        threatId: 'THR-001',
        type: 'Malware Detection',
        severity: 'Critical',
        status: 'Active',
        title: 'Suspicious Executable Detected',
        description: 'Suspicious executable detected in downloads folder',
        logRefs: [createdLogs[0]._id],
        affectedAssets: [{
          assetType: 'Endpoint',
          assetId: 'workstation-001',
          assetName: 'Workstation 001',
          impact: 'High'
        }]
      },
      {
        threatId: 'THR-002',
        type: 'Phishing Attempt',
        severity: 'Medium',
        status: 'Investigating',
        title: 'Suspicious Email Campaign',
        description: 'Suspicious email with credential harvesting links',
        logRefs: [createdLogs[1]._id],
        affectedAssets: [{
          assetType: 'User Account',
          assetId: 'user-001',
          assetName: 'User Account 001',
          impact: 'Medium'
        }]
      },
      {
        threatId: 'THR-003',
        type: 'Anomalous Behavior',
        severity: 'Medium',
        status: 'Active',
        title: 'Unusual Network Traffic',
        description: 'Unusual outbound traffic to unknown IP addresses',
        logRefs: [createdLogs[2]._id],
        affectedAssets: [{
          assetType: 'Network',
          assetId: 'network-001',
          assetName: 'Main Network',
          impact: 'Medium'
        }]
      }
    ];

    const createdThreats = await Threat.insertMany(sampleThreats);
    console.log(`✅ Created ${createdThreats.length} threats`);

    // Create sample alerts
    console.log('🚨 Creating sample alerts...');
    const sampleAlerts = [
      {
        alertId: 'ALT-001',
        type: 'Security',
        subType: 'Malware Alert',
        severity: 'Critical',
        status: 'Active',
        title: 'Malware Detected',
        message: 'Critical malware detected on workstation-001',
        description: 'Suspicious executable file detected and quarantined',
        source: {
          system: 'Endpoint Protection',
          component: 'AI Engine',
          service: 'Malware Scanner'
        },
        relatedEntities: {
          logId: createdLogs[0]._id,
          threatId: createdThreats[0]._id
        }
      },
      {
        alertId: 'ALT-002',
        type: 'Security',
        subType: 'Failed Authentication',
        severity: 'Medium',
        status: 'Active',
        title: 'Multiple Failed Logins',
        message: 'Multiple failed login attempts from IP 203.0.113.42',
        description: 'Potential brute force attack detected',
        source: {
          system: 'Authentication Service',
          component: 'Login Monitor',
          service: 'Auth API'
        },
        relatedEntities: {
          logId: createdLogs[1]._id,
          threatId: createdThreats[1]._id
        }
      },
      {
        alertId: 'ALT-003',
        type: 'System',
        subType: 'Configuration Change',
        severity: 'Low',
        status: 'Acknowledged',
        title: 'Security Policy Updated',
        message: 'Security policy has been updated',
        description: 'Password complexity requirements have been strengthened',
        source: {
          system: 'Admin Panel',
          component: 'Policy Manager',
          service: 'Configuration Service'
        },
        relatedEntities: {
          logId: createdLogs[3]._id
        }
      }
    ];

    const createdAlerts = await Alert.insertMany(sampleAlerts);
    console.log(`✅ Created ${createdAlerts.length} alerts`);

    console.log('\n🎉 Database seeding completed successfully!');
    console.log('\n📋 Demo credentials:');
    console.log('  Email: admin@demo.com');
    console.log('  Password: demo123');
    console.log('  OR');
    console.log('  Email: user@demo.com');
    console.log('  Password: demo123');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
    process.exit(0);
  }
}

// Run seeding if this script is executed directly
if (require.main === module) {
  seedDatabase();
}

module.exports = seedDatabase;
