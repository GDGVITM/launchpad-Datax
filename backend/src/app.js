const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const path = require('path');
const http = require('http');
const socketIo = require('socket.io');

// Import configuration and middleware
const config = require('./config');
const database = require('./config/database');
const { errorHandler, notFound } = require('./middleware/errorHandling');
const { authenticateSocketToken } = require('./middleware/auth');

// Import routes
const routes = require('./routes');

// Create Express app
const app = express();

// Create HTTP server and Socket.IO instance
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: config.CORS_ORIGIN,
    credentials: true
  }
});

// Connect to MongoDB
database.connect();

// Trust proxy for accurate IP addresses
app.set('trust proxy', 1);

// Middleware setup
app.use(helmet({
  contentSecurityPolicy: false, // Allow for development
  crossOriginEmbedderPolicy: false
}));

app.use(compression());

app.use(cors({
  origin: config.CORS_ORIGIN,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key']
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: config.RATE_LIMIT_WINDOW_MS,
  max: config.RATE_LIMIT_MAX_REQUESTS,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.',
    timestamp: new Date().toISOString()
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api', limiter);

// Logging
if (config.NODE_ENV === 'production') {
  app.use(morgan('combined'));
} else {
  app.use(morgan('dev'));
}

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use('/reports', express.static(path.join(__dirname, '../reports')));

// Socket.IO authentication middleware
io.use(authenticateSocketToken);

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.user.email} (${socket.id})`);

  // Join organization room for real-time updates
  socket.join(`org_${socket.user.organizationId}`);

  // Handle client events
  socket.on('subscribe_alerts', () => {
    socket.join(`alerts_${socket.user.organizationId}`);
    console.log(`User ${socket.user.email} subscribed to alerts`);
  });

  socket.on('subscribe_threats', () => {
    socket.join(`threats_${socket.user.organizationId}`);
    console.log(`User ${socket.user.email} subscribed to threats`);
  });

  socket.on('subscribe_logs', () => {
    socket.join(`logs_${socket.user.organizationId}`);
    console.log(`User ${socket.user.email} subscribed to logs`);
  });

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.user.email} (${socket.id})`);
  });
});

// Make io accessible to other parts of the app
app.set('io', io);

// API routes
app.use('/api', routes);

// Serve static frontend files in production
if (config.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/build')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/build/index.html'));
  });
}

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
    process.exit(0);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  server.close(() => {
    process.exit(1);
  });
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
  server.close(() => {
    process.exit(1);
  });
});

module.exports = { app, server, io };
