const User = require("../models/User");
const AppError = require("../utils/AppError");
const mongoose = require("mongoose");

/**
 * Get user by ID
 */
exports.getUserById = async (userId) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new AppError("User not found", 404);
  }

  return user;
};

/**
 * Update user details
 */
exports.updateUser = async (userId, updateData) => {
  const allowedUpdates = ["phone", "deliveryAddress"];
  const updates = {};

  Object.keys(updateData).forEach((key) => {
    if (allowedUpdates.includes(key)) {
      updates[key] = updateData[key];
    }
  });

  const user = await User.findByIdAndUpdate(userId, updates, {
    new: true,
    runValidators: true,
  });

  if (!user) {
    throw new AppError("User not found", 404);
  }

  return user;
};

/**
 * Create child profile
 */
exports.createChildProfile = async (parentId, profileData) => {
  const user = await User.findById(parentId);

  if (!user) {
    throw new AppError("User not found", 404);
  }

  // Create new profile
  const newProfile = {
    profileId: new mongoose.Types.ObjectId(),
    name: profileData.name,
    accountType: "CHILD",
    ageGroup: profileData.ageGroup,
    preferredGenres: profileData.preferredGenres || [],
    preferredLanguages: profileData.preferredLanguages || [],
    userprofileURL: profileData.userprofileURL || undefined,
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
    throw new AppError("User not found", 404);
  }

  const childProfiles = user.profiles.filter((p) => p.accountType === "CHILD");
  return childProfiles;
};

/**
 * Update profile
 */
exports.updateProfile = async (userId, profileId, updateData) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new AppError("User not found", 404);
  }

  const profile = user.profiles.find(
    (p) => p.profileId.toString() === profileId.toString(),
  );

  if (!profile) {
    throw new AppError("Profile not found", 404);
  }

  // Update allowed fields
  const allowedUpdates = [
    "name",
    "ageGroup",
    "preferredGenres",
    "preferredLanguages",
    "userprofileURL",
  ];
  Object.keys(updateData).forEach((key) => {
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
    throw new AppError("User not found", 404);
  }

  // Don't allow deleting the last parent profile
  const parentProfiles = user.profiles.filter(
    (p) => p.accountType === "PARENT",
  );
  const profileToDelete = user.profiles.find(
    (p) => p.profileId.toString() === profileId.toString(),
  );

  if (!profileToDelete) {
    throw new AppError("Profile not found", 404);
  }

  if (profileToDelete.accountType === "PARENT" && parentProfiles.length === 1) {
    throw new AppError("Cannot delete the last parent profile", 400);
  }

  user.profiles = user.profiles.filter(
    (p) => p.profileId.toString() !== profileId.toString(),
  );
  await user.save();

  return { message: "Profile deleted successfully" };
};

/**
 * Get profile reading history
 */
exports.getReadingHistory = async (userId, profileId) => {
  const user = await User.findById(userId).populate(
    "profiles.readingHistory.bookId",
  );

  if (!user) {
    throw new AppError("User not found", 404);
  }

  const profile = user.profiles.find(
    (p) => p.profileId.toString() === profileId.toString(),
  );

  if (!profile) {
    throw new AppError("Profile not found", 404);
  }

  return profile.readingHistory;
};

/**
 * Add book to reading history
 */
exports.addToReadingHistory = async (userId, profileId, bookId) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new AppError("User not found", 404);
  }

  const profile = user.profiles.find(
    (p) => p.profileId.toString() === profileId.toString(),
  );

  if (!profile) {
    throw new AppError("Profile not found", 404);
  }

  profile.readingHistory.push({
    bookId,
    readAt: new Date(),
  });

  await user.save();
  return profile.readingHistory;
};

/**
 * Update user delivery location (GeoJSON Point)
 * Adds a new address to the deliveryAddresses array.
 * Also sets the legacy deliveryAddress field for backward compatibility.
 * Expects: { latitude, longitude, street, city, state, pincode, label }
 * Stores coordinates as [longitude, latitude] per MongoDB GeoJSON spec.
 */
exports.updateDeliveryLocation = async (userId, locationData) => {
  const { latitude, longitude, street, city, state, pincode, label } =
    locationData;

  if (latitude == null || longitude == null) {
    throw new AppError("Latitude and longitude are required", 400);
  }

  const addressObj = {
    label: label || "Home",
    street: street || "",
    city: city || "",
    state: state || "",
    pincode: pincode || "",
    location: {
      type: "Point",
      coordinates: [longitude, latitude], // MongoDB GeoJSON: [lng, lat]
    },
    isDefault: false,
  };

  const user = await User.findById(userId);
  if (!user) {
    throw new AppError("User not found", 404);
  }

  // If this is the first address, make it default
  if (!user.deliveryAddresses || user.deliveryAddresses.length === 0) {
    addressObj.isDefault = true;
  }

  user.deliveryAddresses.push(addressObj);

  // Also update legacy single deliveryAddress field (always latest)
  user.deliveryAddress = {
    street: addressObj.street,
    city: addressObj.city,
    state: addressObj.state,
    pincode: addressObj.pincode,
    location: addressObj.location,
  };

  await user.save();
  return user;
};

/**
 * Get all delivery addresses for a user
 */
exports.getDeliveryAddresses = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError("User not found", 404);
  }
  return user.deliveryAddresses || [];
};

/**
 * Delete a delivery address by its subdoc _id
 */
exports.deleteDeliveryAddress = async (userId, addressId) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError("User not found", 404);
  }

  const idx = user.deliveryAddresses.findIndex(
    (a) => a._id.toString() === addressId,
  );
  if (idx === -1) {
    throw new AppError("Address not found", 404);
  }

  const wasDefault = user.deliveryAddresses[idx].isDefault;
  user.deliveryAddresses.splice(idx, 1);

  // If we deleted the default, make the first remaining address the default
  if (wasDefault && user.deliveryAddresses.length > 0) {
    user.deliveryAddresses[0].isDefault = true;
  }

  // Update legacy field
  const def = user.deliveryAddresses.find((a) => a.isDefault);
  if (def) {
    user.deliveryAddress = {
      street: def.street,
      city: def.city,
      state: def.state,
      pincode: def.pincode,
      location: def.location,
    };
  } else {
    user.deliveryAddress = undefined;
  }

  await user.save();
  return user.deliveryAddresses;
};

/**
 * Set a delivery address as default
 */
exports.setDefaultDeliveryAddress = async (userId, addressId) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError("User not found", 404);
  }

  let found = false;
  user.deliveryAddresses.forEach((a) => {
    if (a._id.toString() === addressId) {
      a.isDefault = true;
      found = true;
      // Update the legacy field
      user.deliveryAddress = {
        street: a.street,
        city: a.city,
        state: a.state,
        pincode: a.pincode,
        location: a.location,
      };
    } else {
      a.isDefault = false;
    }
  });

  if (!found) {
    throw new AppError("Address not found", 404);
  }

  await user.save();
  return user.deliveryAddresses;
};

/**
 * Check if a user is within delivery radius of a library branch
 * Uses MongoDB $near geospatial query.
 */
exports.isUserWithinDeliveryZone = async (
  userId,
  branchId,
  radiusMeters = 8000,
) => {
  const branch = await require("../models/LibraryBranch").findById(branchId);
  if (!branch || !branch.location || !branch.location.coordinates) {
    throw new AppError("Library branch location not configured", 400);
  }

  const eligible = await User.findOne({
    _id: userId,
    "deliveryAddress.location": {
      $near: {
        $geometry: {
          type: "Point",
          coordinates: branch.location.coordinates,
        },
        $maxDistance: radiusMeters,
      },
    },
  });

  return !!eligible;
};
