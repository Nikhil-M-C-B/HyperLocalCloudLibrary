const LibraryBranch = require('../models/LibraryBranch');
const Organization = require('../models/Organization');
const AppError = require('../utils/AppError');

/**
 * Get all libraries
 */
exports.getAllLibraries = async (filters = {}) => {
  const query = {};

  // By default only return active libraries; admins can request all
  if (!filters.includeInactive) {
    query.status = 'ACTIVE';
  }
  
  if (filters.organizationId) {
    query.organizationId = filters.organizationId;
  }
  
  const libraries = await LibraryBranch.find(query).populate('organizationId');
  return libraries;
};

/**
 * Get library by ID
 */
exports.getLibraryById = async (libraryId) => {
  const library = await LibraryBranch.findById(libraryId).populate('organizationId');
  
  if (!library) {
    throw new AppError('Library not found', 404);
  }
  
  return library;
};

/**
 * Create new library (Admin only)
 */
exports.createLibrary = async (libraryData) => {
  const library = await LibraryBranch.create(libraryData);
  return library;
};

/**
 * Update library
 */
exports.updateLibrary = async (libraryId, updateData) => {
  const library = await LibraryBranch.findByIdAndUpdate(libraryId, updateData, {
    new: true,
    runValidators: true
  });
  
  if (!library) {
    throw new AppError('Library not found', 404);
  }
  
  return library;
};

/**
 * Get nearby libraries
 */
exports.getNearbyLibraries = async (userLocation, maxDistance = 10) => {
  const libraries = await LibraryBranch.find({
    status: 'ACTIVE',
    location: {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [userLocation.longitude, userLocation.latitude]
        },
        $maxDistance: maxDistance * 1000 // Convert km to meters
      }
    }
  }).populate('organizationId');
  
  return libraries;
};
