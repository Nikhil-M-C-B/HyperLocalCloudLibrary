const userService = require('../services/userService');
const catchAsync = require('../utils/catchAsync');

/**
 * Get user by ID
 * GET /users/:id
 */
exports.getUser = catchAsync(async (req, res) => {
  const user = await userService.getUserById(req.params.id);
  
  res.status(200).json({
    status: 'success',
    data: { user }
  });
});

/**
 * Update user
 * PUT /users/:id
 */
exports.updateUser = catchAsync(async (req, res) => {
  const user = await userService.updateUser(req.params.id, req.body);
  
  res.status(200).json({
    status: 'success',
    data: { user }
  });
});

/**
 * Create child profile
 * POST /users/:parentId/children
 */
exports.createChildProfile = catchAsync(async (req, res) => {
  const profile = await userService.createChildProfile(req.params.parentId, req.body);
  
  res.status(201).json({
    status: 'success',
    data: { profile }
  });
});

/**
 * Get child profiles
 * GET /users/:parentId/children
 */
exports.getChildProfiles = catchAsync(async (req, res) => {
  const profiles = await userService.getChildProfiles(req.params.parentId);
  
  res.status(200).json({
    status: 'success',
    data: { profiles }
  });
});

/**
 * Update profile
 * PUT /users/:userId/profiles/:profileId
 */
exports.updateProfile = catchAsync(async (req, res) => {
  const profile = await userService.updateProfile(
    req.params.userId,
    req.params.profileId,
    req.body
  );
  
  res.status(200).json({
    status: 'success',
    data: { profile }
  });
});

/**
 * Delete profile
 * DELETE /users/:userId/profiles/:profileId
 */
exports.deleteProfile = catchAsync(async (req, res) => {
  const result = await userService.deleteProfile(req.params.userId, req.params.profileId);
  
  res.status(200).json({
    status: 'success',
    data: result
  });
});

/**
 * Get reading history
 * GET /users/:userId/profiles/:profileId/history
 */
exports.getReadingHistory = catchAsync(async (req, res) => {
  const history = await userService.getReadingHistory(
    req.params.userId,
    req.params.profileId
  );
  
  res.status(200).json({
    status: 'success',
    data: { history }
  });
});
