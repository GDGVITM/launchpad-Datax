const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const config = require('../src/config');

// Import models
const User = require('../src/models/User');
const Organization = require('../src/models/Organization');

// Sample data
const organizations = [
  {
    _id: new mongoose.Types.ObjectId(),
    name: 'Demo Organization',
    type: 'enterprise',
    contactEmail: 'admin@demo.com',
    phone: '+1-555-0123',
    address: {
      street: '123 Security St',
      city: 'Tech City',
      state: 'CA',
      zipCode: '94105',
      country: 'USA'
    },
    settings: {
      retentionPeriod: 90,
      alertThreshold: 'medium',
      maxUsers: 100,
      features: ['threat_detection', 'log_management', 'alert_system', 'blockchain_anchoring']
    },
    isActive: true
  }
];

const users = [
  {
    name: 'System Administrator',
    email: 'admin@demo.com',
    password: 'SecurePassword123!',
    role: 'admin',
    organizationId: organizations[0]._id,
    permissions: ['read', 'write', 'delete', 'admin'],
    isActive: true,
    emailVerified: true
  },
  {
    name: 'Security Analyst',
    email: 'analyst@demo.com',
    password: 'AnalystPass456!',
    role: 'analyst',
    organizationId: organizations[0]._id,
    permissions: ['read', 'write'],
    isActive: true,
    emailVerified: true
  },
  {
    name: 'Regular User',
    email: 'user@demo.com',
    password: 'UserPass789!',
    role: 'user',
    organizationId: organizations[0]._id,
    permissions: ['read'],
    isActive: true,
    emailVerified: true
  }
];

async function seedDatabase() {
  try {
    console.log('🌱 Starting database seeding...');
    
    // Connect to MongoDB
    await mongoose.connect(config.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    console.log('🗑️  Clearing existing data...');
    await User.deleteMany({});
    await Organization.deleteMany({});

    // Seed organizations
    console.log('🏢 Seeding organizations...');
    await Organization.insertMany(organizations);
    console.log(`✅ Created ${organizations.length} organizations`);

    // Hash passwords and seed users
    console.log('👥 Seeding users...');
    for (const userData of users) {
      const hashedPassword = await bcrypt.hash(userData.password, 12);
      userData.password = hashedPassword;
    }
    
    await User.insertMany(users);
    console.log(`✅ Created ${users.length} users`);

    console.log('🎉 Database seeding completed successfully!');
    console.log('\n📋 Created accounts:');
    console.log('  Admin: admin@demo.com / SecurePassword123!');
    console.log('  Analyst: analyst@demo.com / AnalystPass456!');
    console.log('  User: user@demo.com / UserPass789!');

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
