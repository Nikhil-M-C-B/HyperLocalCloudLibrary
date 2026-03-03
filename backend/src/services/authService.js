const jwt = require('jsonwebtoken');
const Auth = require('../models/Auth');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const config = require('../config');

/**
 * Generate JWT token
 */
const signToken = (id) => {
  return jwt.sign({ id }, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn
  });
};

/**
 * Register new user
 */
exports.register = async (userData) => {
  const { email, password, phone, name, preferredGenres, role } = userData;
  
  // Check if user already exists
  const existingAuth = await Auth.findOne({ email });
  if (existingAuth) {
    throw new AppError('Email already registered', 400);
  }
  
  // Create user (role defaults to USER if not provided)
  const user = await User.create({
    email,
    phone,
    role: role || 'USER',
    profiles: [{
      name,
      accountType: 'PARENT',
      preferredGenres: preferredGenres || []
    }]
  });
  
  // Create auth record
  const auth = await Auth.create({
    email,
    password,
    userId: user._id
  });
  
  // Generate token
  const token = signToken(user._id);
  
  return {
    token,
    user: {
      id: user._id,
      email: user.email,
      phone: user.phone,
      role: user.role,
      profiles: user.profiles
    }
  };
};

/**
 * Login user
 */
exports.login = async (email, password) => {
  // Check if email and password exist
  if (!email || !password) {
    throw new AppError('Please provide email and password', 400);
  }
  
  // Find auth record
  const auth = await Auth.findOne({ email }).select('+password');
  
  if (!auth) {
    throw new AppError('Incorrect email or password', 401);
  }
  
  // Check if password is correct
  const isPasswordCorrect = await auth.comparePassword(password);
  
  if (!isPasswordCorrect) {
    throw new AppError('Incorrect email or password', 401);
  }
  
  // Get user details
  const user = await User.findById(auth.userId);
  
  if (!user) {
    throw new AppError('User not found', 404);
  }
  
  if (user.status !== 'ACTIVE') {
    throw new AppError('Your account has been blocked', 403);
  }
  
  // Generate token
  const token = signToken(user._id);
  
  return {
    token,
    user: {
      id: user._id,
      email: user.email,
      phone: user.phone,
      profiles: user.profiles,
      role: user.role
    }
  };
};

/**
 * Get current user
 */
exports.getCurrentUser = async (userId) => {
  const user = await User.findById(userId);
  
  if (!user) {
    throw new AppError('User not found', 404);
  }
  
  return {
    id: user._id,
    email: user.email,
    phone: user.phone,
    profiles: user.profiles,
    role: user.role,
    deliveryAddress: user.deliveryAddress
  };
};

/**
 * Change password
 */
exports.changePassword = async (userId, oldPassword, newPassword) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError('User not found', 404);
  }
  
  const auth = await Auth.findOne({ userId });
  
  // Verify old password
  const isPasswordCorrect = await auth.comparePassword(oldPassword);
  if (!isPasswordCorrect) {
    throw new AppError('Current password is incorrect', 401);
  }
  
  // Update password
  auth.password = newPassword;
  await auth.save();
  
  return { message: 'Password changed successfully' };
};
