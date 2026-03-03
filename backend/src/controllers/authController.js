const authService = require('../services/authService');
const catchAsync = require('../utils/catchAsync');

/**
 * Register new user
 * POST /auth/register
 */
exports.register = catchAsync(async (req, res) => {
  const result = await authService.register(req.body);
  
  res.status(201).json({
    status: 'success',
    data: result
  });
});

/**
 * Login user
 * POST /auth/login
 */
exports.login = catchAsync(async (req, res) => {
  const { email, password } = req.body;
  const result = await authService.login(email, password);
  
  res.status(200).json({
    status: 'success',
    data: result
  });
});

/**
 * Get current user
 * GET /auth/me
 */
exports.getMe = catchAsync(async (req, res) => {
  const user = await authService.getCurrentUser(req.user._id);
  
  res.status(200).json({
    status: 'success',
    data: { user }
  });
});

/**
 * Logout user
 * POST /auth/logout
 */
exports.logout = catchAsync(async (req, res) => {
  // In JWT-based auth, logout is handled client-side by removing the token
  res.status(200).json({
    status: 'success',
    message: 'Logged out successfully'
  });
});

/**
 * Change password
 * PUT /auth/change-password
 */
exports.changePassword = catchAsync(async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const result = await authService.changePassword(req.user._id, oldPassword, newPassword);
  
  res.status(200).json({
    status: 'success',
    data: result
  });
});
