# Cybersecurity SaaS Backend Platform

A comprehensive decentralized cybersecurity SaaS platform built with Node.js, Express.js, MongoDB, and blockchain integration using the ChainShield smart contract.

## 🚀 Features

- **User Management**: Complete user authentication with JWT and blockchain wallet integration
- **Security Log Management**: Comprehensive logging with blockchain anchoring for tamper-proof records
- **Threat Detection**: Advanced threat detection and analysis capabilities
- **Alert System**: Real-time security alerts with multiple notification channels
- **Blockchain Integration**: ChainShield smart contract for decentralized log anchoring
- **Real-time Updates**: Socket.IO integration for live notifications
- **Multi-tenant Support**: Organization-based access control
- **RESTful API**: Comprehensive REST API with proper error handling

## 🏗️ Architecture

### Backend Stack
- **Runtime**: Node.js 16+
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT + Blockchain wallet authentication
- **Blockchain**: Ethereum/Polygon with ethers.js
- **Real-time**: Socket.IO
- **Validation**: Joi for request validation
- **Security**: Helmet, CORS, Rate limiting

### Smart Contract
- **ChainShield**: Custom Solidity contract for log anchoring
- **Network**: Polygon Mumbai Testnet
- **Features**: Multi-tenant log registry, organization management, tamper verification

## 📁 Project Structure

```
backend/
├── src/
│   ├── config/
│   │   ├── index.js              # Configuration management
│   │   └── database.js           # MongoDB connection
│   ├── models/
│   │   ├── User.js               # User model
│   │   ├── Organization.js       # Organization model
│   │   ├── Log.js               # Security log model
│   │   ├── ThreatDetection.js   # Threat detection model
│   │   └── Alert.js             # Alert model
│   ├── middleware/
│   │   ├── auth.js              # Authentication middleware
│   │   ├── validation.js        # Request validation
│   │   └── errorHandler.js      # Error handling
│   ├── services/
│   │   ├── authService.js       # Authentication service
│   │   ├── userService.js       # User management
│   │   ├── logService.js        # Log management with blockchain
│   │   ├── blockchainService.js # ChainShield integration
│   │   ├── threatDetectionService.js # Threat detection
│   │   └── alertService.js      # Alert management
│   ├── controllers/
│   │   ├── baseController.js    # Base controller class
│   │   ├── authController.js    # Authentication endpoints
│   │   ├── userController.js    # User management endpoints
│   │   ├── logController.js     # Log management endpoints
│   │   ├── threatController.js  # Threat detection endpoints
│   │   └── alertController.js   # Alert management endpoints
│   ├── routes/
│   │   ├── index.js             # Main router
│   │   ├── auth.js              # Authentication routes
│   │   ├── users.js             # User routes
│   │   ├── logs.js              # Log routes
│   │   ├── threats.js           # Threat routes
│   │   └── alerts.js            # Alert routes
│   └── app.js                   # Express app setup
├── contracts/
│   └── ChainShield.sol          # Smart contract
├── scripts/
│   └── seedDatabase.js          # Database seeding
├── .env                         # Environment variables
├── package.json                 # Dependencies
└── server.js                    # Server entry point
```

## ⚙️ Installation & Setup

### Prerequisites
- Node.js 16 or higher
- MongoDB (local or cloud)
- Git

### 1. Clone and Install Dependencies
```bash
git clone <repository-url>
cd backend
npm install
```

### 2. Environment Configuration
Create a `.env` file in the root directory:

```env
# Server Configuration
NODE_ENV=development
PORT=5000
API_BASE_URL=http://localhost:5000/api

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/cybersecurity_saas

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=your-refresh-secret-key-min-32-chars
JWT_REFRESH_EXPIRES_IN=30d

# Blockchain Configuration
BLOCKCHAIN_ENABLED=true
BLOCKCHAIN_NETWORK=polygon-mumbai
POLYGON_TESTNET_RPC_URL=https://polygon-mumbai.g.alchemy.com/v2/YOUR_ALCHEMY_KEY
ADMIN_PRIVATE_KEY=0x_your_private_key_here
ADMIN_WALLET_ADDRESS=0x_your_wallet_address_here

# ChainShield Smart Contract
CHAINSHIELD_CONTRACT_ADDRESS=0x01B0CB02107Cd66Df4DB390Dce2EeD391D3B57F3
CHAINSHIELD_ORG_ID=cybersecurity_saas_org
CHAINSHIELD_PLATFORM_ADMIN=0x_your_admin_wallet_address

# Frontend Configuration
FRONTEND_URL=http://localhost:3000
CORS_ORIGIN=http://localhost:3000

# Security Configuration
BCRYPT_SALT_ROUNDS=12
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Email Configuration (Optional)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM=noreply@cybersecurity-saas.com

# SMS Configuration (Optional)
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
TWILIO_PHONE_NUMBER=+1234567890
```

### 3. Database Setup
```bash
# Seed the database with sample data
npm run seed
```

### 4. Start the Server
```bash
# Development mode with hot reload
npm run dev

# Production mode
npm start
```

## 🔗 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login (email/password or wallet)
- `POST /api/auth/refresh-token` - Refresh access token
- `POST /api/auth/logout` - User logout
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile
- `PUT /api/auth/change-password` - Change password
- `POST /api/auth/link-wallet` - Link blockchain wallet

### Users
- `GET /api/users` - Get all users (paginated)
- `GET /api/users/:id` - Get user by ID
- `POST /api/users` - Create new user (admin only)
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user (admin only)
- `GET /api/users/:id/activity` - Get user activity
- `POST /api/users/bulk` - Bulk user operations (admin only)

### Security Logs
- `GET /api/logs` - Get all logs (paginated, filtered)
- `GET /api/logs/:id` - Get log by ID
- `POST /api/logs` - Create new security log
- `POST /api/logs/:id/verify` - Verify log integrity
- `POST /api/logs/:id/anchor` - Anchor log to blockchain
- `GET /api/logs/stats` - Get log statistics
- `GET /api/logs/export` - Export logs (JSON/CSV)
- `POST /api/logs/bulk` - Bulk log operations

### Threat Detection
- `GET /api/threats` - Get all threats (paginated, filtered)
- `GET /api/threats/:id` - Get threat by ID
- `POST /api/threats` - Create new threat detection
- `PUT /api/threats/:id/status` - Update threat status
- `GET /api/threats/stats` - Get threat statistics
- `GET /api/threats/trends` - Get threat trends
- `GET /api/threats/patterns` - Analyze threat patterns
- `POST /api/threats/scan` - Run threat scan
- `POST /api/threats/bulk` - Bulk threat operations

### Alerts
- `GET /api/alerts` - Get all alerts (paginated, filtered)
- `GET /api/alerts/:id` - Get alert by ID
- `POST /api/alerts` - Create new alert
- `PUT /api/alerts/:id/status` - Update alert status
- `PUT /api/alerts/:id/acknowledge` - Acknowledge alert
- `GET /api/alerts/stats` - Get alert statistics
- `GET /api/alerts/trends` - Get alert trends
- `GET /api/alerts/config` - Get alert configuration
- `PUT /api/alerts/config` - Update alert configuration
- `POST /api/alerts/test` - Test alert configuration
- `POST /api/alerts/bulk` - Bulk alert operations

### System
- `GET /api/health` - Health check
- `GET /api/status` - System status and features

## 🔐 Authentication

### JWT Authentication
```javascript
// Include in request headers
Authorization: Bearer <access_token>
```

### Blockchain Wallet Authentication
```javascript
// POST /api/auth/login
{
  "walletAddress": "0x...",
  "signature": "0x..."
}
```

## 🌐 Real-time Features

### Socket.IO Events
```javascript
// Client connection
const socket = io('http://localhost:5000', {
  auth: {
    token: 'your_jwt_token'
  }
});

// Subscribe to organization alerts
socket.emit('subscribe_alerts');

// Listen for new alerts
socket.on('new_alert', (alert) => {
  console.log('New alert:', alert);
});

// Subscribe to threat updates
socket.emit('subscribe_threats');

// Subscribe to log updates
socket.emit('subscribe_logs');
```

## ⛓️ Blockchain Integration

### ChainShield Smart Contract
The platform integrates with a custom ChainShield smart contract for tamper-proof log anchoring:

- **Organization Management**: Multi-tenant support with organization registration
- **User Registration**: Blockchain-based user identity management
- **Log Anchoring**: Individual log anchoring with immediate verification
- **Integrity Verification**: On-chain log verification and tamper detection

### Key Blockchain Features
- Automatic blockchain registration for new users
- Immediate anchoring for high-priority security events
- Bulk log verification capabilities
- Cross-chain compatibility (Ethereum, Polygon)

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run specific test file
npm test -- auth.test.js
```

## 🚀 Deployment

### Environment Setup
1. Set `NODE_ENV=production`
2. Configure production MongoDB URI
3. Set up proper JWT secrets
4. Configure blockchain network settings
5. Set up email/SMS providers

### Docker Deployment
```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 5000
CMD ["npm", "start"]
```

### Production Considerations
- Use PM2 for process management
- Set up proper logging and monitoring
- Configure load balancing
- Implement proper backup strategies
- Set up SSL/TLS certificates

## 📊 Monitoring & Logging

The platform includes comprehensive logging and monitoring:

- **Winston Logger**: Structured logging with multiple transports
- **Morgan**: HTTP request logging
- **Health Checks**: Built-in health monitoring endpoints
- **Error Tracking**: Comprehensive error handling and reporting

## 🔒 Security Features

- **Rate Limiting**: Protection against brute force attacks
- **Helmet.js**: Security headers and protection
- **Input Validation**: Joi-based request validation
- **Password Hashing**: bcrypt with configurable salt rounds
- **JWT Security**: Secure token generation and validation
- **CORS Configuration**: Proper cross-origin resource sharing
- **Blockchain Security**: Cryptographic verification and tamper detection

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation

## 🔄 Version History

- **v1.0.0**: Initial release with core features
  - User management and authentication
  - Security log management
  - Threat detection system
  - Alert management
  - ChainShield blockchain integration
  - Real-time notifications

---

**Built with ❤️ by the Cybersecurity SaaS Team**
