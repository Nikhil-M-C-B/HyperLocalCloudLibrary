const express = require('express');
const cors = require('cors');
const errorHandler = require('./middleware/errorHandler');
const AppError = require('./utils/AppError');

// Import routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const bookRoutes = require('./routes/bookRoutes');
const libraryRoutes = require('./routes/libraryRoutes');
const inventoryRoutes = require('./routes/inventoryRoutes');
const circulationRoutes = require('./routes/circulationRoutes');
// Temporarily disabled for prototype - uncomment when MySQL is set up
// const paymentRoutes = require('./routes/paymentRoutes');
// const penaltyRoutes = require('./routes/penaltyRoutes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

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
// Payment and penalty routes disabled for prototype (require MySQL)
// Uncomment when MySQL is set up
// app.use('/api/v1/payments', paymentRoutes);
// app.use('/api/v1/penalties', penaltyRoutes);

// Handle undefined routes
app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// Global error handler
app.use(errorHandler);

module.exports = app;
