const jwt = require('jsonwebtoken');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');
const User = require('../models/User');
const config = require('../config');

/**
 * Protect routes - verify JWT token
 */
exports.protect = catchAsync(async (req, res, next) => {
  // 1) Get token from header
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
  
  if (!token) {
    return next(new AppError('You are not logged in. Please log in to get access.', 401));
  }
  
  // 2) Verify token
  let decoded;
  try {
    decoded = jwt.verify(token, config.jwt.secret);
  } catch (error) {
    return next(new AppError('Invalid token. Please log in again.', 401));
  }
  
  // 3) Check if user still exists
  const user = await User.findById(decoded.id);
  if (!user) {
    return next(new AppError('The user belonging to this token no longer exists.', 401));
  }
  
  // 4) Check if user is active
  if (user.status !== 'ACTIVE') {
    return next(new AppError('Your account has been blocked. Please contact support.', 403));
  }
  
  // Grant access to protected route
  req.user = user;
  next();
});

/**
 * Restrict routes to specific roles
 */
exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('You do not have permission to perform this action', 403)
      );
    }
    next();
  };
};

/**
 * Check if profile belongs to logged-in user
 */
exports.verifyProfileOwnership = catchAsync(async (req, res, next) => {
  const profileId = req.params.profileId || req.body.profileId;
  
  if (!profileId) {
    return next();
  }
  
  const userProfile = req.user.profiles.find(
    p => p.profileId.toString() === profileId.toString()
  );
  
  if (!userProfile && req.user.role !== 'ADMIN') {
    return next(new AppError('You do not have access to this profile', 403));
  }
  
  req.profile = userProfile;
  next();
});
