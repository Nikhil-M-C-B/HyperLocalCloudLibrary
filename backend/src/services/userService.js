const User = require('../models/User');
const AppError = require('../utils/AppError');
const mongoose = require('mongoose');

/**
 * Get user by ID
 */
exports.getUserById = async (userId) => {
  const user = await User.findById(userId);
  
  if (!user) {
    throw new AppError('User not found', 404);
  }
  
  return user;
};

/**
 * Update user details
 */
exports.updateUser = async (userId, updateData) => {
  const allowedUpdates = ['phone', 'deliveryAddress'];
  const updates = {};
  
  Object.keys(updateData).forEach(key => {
    if (allowedUpdates.includes(key)) {
      updates[key] = updateData[key];
    }
  });
  
  const user = await User.findByIdAndUpdate(userId, updates, {
    new: true,
    runValidators: true
  });
  
  if (!user) {
    throw new AppError('User not found', 404);
  }
  
  return user;
};

/**
 * Create child profile
 */
exports.createChildProfile = async (parentId, profileData) => {
  const user = await User.findById(parentId);
  
  if (!user) {
    throw new AppError('User not found', 404);
  }
  
  // Create new profile
  const newProfile = {
    profileId: new mongoose.Types.ObjectId(),
    name: profileData.name,
    accountType: 'CHILD',
    ageGroup: profileData.ageGroup,
    preferredGenres: profileData.preferredGenres || []
  };
  
  user.profiles.push(newProfile);
  await user.save();
  
  return newProfile;
};

/**
 * Get all child profiles
 */
exports.getChildProfiles = async (parentId) => {
  const user = await User.findById(parentId);
  
  if (!user) {
    throw new AppError('User not found', 404);
  }
  
  const childProfiles = user.profiles.filter(p => p.accountType === 'CHILD');
  return childProfiles;
};

/**
 * Update profile
 */
exports.updateProfile = async (userId, profileId, updateData) => {
  const user = await User.findById(userId);
  
  if (!user) {
    throw new AppError('User not found', 404);
  }
  
  const profile = user.profiles.id(profileId);
  
  if (!profile) {
    throw new AppError('Profile not found', 404);
  }
  
  // Update allowed fields
  const allowedUpdates = ['name', 'ageGroup', 'preferredGenres'];
  Object.keys(updateData).forEach(key => {
    if (allowedUpdates.includes(key)) {
      profile[key] = updateData[key];
    }
  });
  
  await user.save();
  return profile;
};

/**
 * Delete profile
 */
exports.deleteProfile = async (userId, profileId) => {
  const user = await User.findById(userId);
  
  if (!user) {
    throw new AppError('User not found', 404);
  }
  
  // Don't allow deleting the last parent profile
  const parentProfiles = user.profiles.filter(p => p.accountType === 'PARENT');
  const profileToDelete = user.profiles.id(profileId);
  
  if (!profileToDelete) {
    throw new AppError('Profile not found', 404);
  }
  
  if (profileToDelete.accountType === 'PARENT' && parentProfiles.length === 1) {
    throw new AppError('Cannot delete the last parent profile', 400);
  }
  
  user.profiles.pull(profileId);
  await user.save();
  
  return { message: 'Profile deleted successfully' };
};

/**
 * Get profile reading history
 */
exports.getReadingHistory = async (userId, profileId) => {
  const user = await User.findById(userId).populate('profiles.readingHistory.bookId');
  
  if (!user) {
    throw new AppError('User not found', 404);
  }
  
  const profile = user.profiles.id(profileId);
  
  if (!profile) {
    throw new AppError('Profile not found', 404);
  }
  
  return profile.readingHistory;
};

/**
 * Add book to reading history
 */
exports.addToReadingHistory = async (userId, profileId, bookId) => {
  const user = await User.findById(userId);
  
  if (!user) {
    throw new AppError('User not found', 404);
  }
  
  const profile = user.profiles.id(profileId);
  
  if (!profile) {
    throw new AppError('Profile not found', 404);
  }
  
  profile.readingHistory.push({
    bookId,
    readAt: new Date()
  });
  
  await user.save();
  return profile.readingHistory;
};
