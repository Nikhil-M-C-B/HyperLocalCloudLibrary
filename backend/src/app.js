const express = require('express');
const cors = require('cors');
const errorHandler = require('./middleware/errorHandler');
const AppError = require('./utils/AppError');

// ── Platform Services Layer — Aryan 2 (Security) ──────
const {
  helmetMiddleware,
  apiLimiter,
  authLimiter,
  enforceHTTPS
} = require('./middleware/security');

// Import routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const bookRoutes = require('./routes/bookRoutes');
const libraryRoutes = require('./routes/libraryRoutes');
const inventoryRoutes = require('./routes/inventoryRoutes');
const circulationRoutes = require('./routes/circulationRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
// Stub routes enabled for prototype - controllers use stub services (no MySQL)
const paymentRoutes  = require('./routes/paymentRoutes');
const penaltyRoutes  = require('./routes/penaltyRoutes');
const deliveryRoutes = require('./routes/deliveryRoutes');
const app = express();

// ── Security Middleware (Platform Services — Aryan 2) ──
app.use(helmetMiddleware);       // Helmet: HSTS, CSP, X-Frame, etc.
app.use(enforceHTTPS);           // HTTPS redirect in production
app.use('/api/', apiLimiter);         // 100 req / 15 min (passthrough in test)
app.use('/api/v1/auth', authLimiter); // 10 req / 15 min (passthrough in test)

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Hyper Local Cloud Library API is running',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/books', bookRoutes);
app.use('/api/v1/libraries', libraryRoutes);
app.use('/api/v1/inventory', inventoryRoutes);
app.use('/api/v1/issues', circulationRoutes);
app.use('/api/v1/notifications', notificationRoutes); // Platform Services — Aryan
// Stub routes - validate & log data without MySQL
app.use('/api/v1/payments',  paymentRoutes);
app.use('/api/v1/penalties', penaltyRoutes);
// Delivery routes (stub mode - gig API calls are logged, not sent)
app.use('/api/v1/delivery',  deliveryRoutes);

// Handle undefined routes
app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// Global error handler
app.use(errorHandler);

module.exports = app;
