require('dotenv').config();

module.exports = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // MongoDB
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/hyper-local-library',
    testUri: process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/hyper-local-library-test'
  },
  
  // MySQL
  mysql: {
    host: process.env.MYSQL_HOST || 'localhost',
    port: parseInt(process.env.MYSQL_PORT) || 3306,
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || 'library_transactions'
  },
  
  // JWT
  jwt: {
    secret: process.env.JWT_SECRET || 'default-secret-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  },
  
  // Business Rules
  business: {
    deliveryRadiusKm: parseFloat(process.env.DELIVERY_RADIUS_KM) || 8,
    lateFeePerDay: parseFloat(process.env.LATE_FEE_PER_DAY) || 10,
    gracePeriodDays: parseInt(process.env.GRACE_PERIOD_DAYS) || 2,
    defaultBorrowPeriodDays: parseInt(process.env.DEFAULT_BORROW_PERIOD_DAYS) || 14
  },
  
  // AI API
  ai: {
    apiUrl: process.env.AI_API_URL || 'http://localhost:8000/recommend',
    apiKey: process.env.AI_API_KEY || ''
  },
  
  // Payment Gateway
  razorpay: {
    keyId: process.env.RAZORPAY_KEY_ID || '',
    keySecret: process.env.RAZORPAY_KEY_SECRET || ''
  },
  
  // Delivery Service
  delivery: {
    apiUrl: process.env.DELIVERY_API_URL || '',
    apiKey: process.env.DELIVERY_API_KEY || ''
  }
};
