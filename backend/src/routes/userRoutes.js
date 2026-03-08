const express = require("express");
const userController = require("../controllers/userController");
const { protect, restrictTo } = require("../middleware/auth");
const validate = require("../middleware/validate");
const Joi = require("joi");

const router = express.Router();

// Validation schemas
const updateUserSchema = Joi.object({
  phone: Joi.string(),
  deliveryAddress: Joi.object({
    street: Joi.string(),
    city: Joi.string(),
    state: Joi.string(),
    pincode: Joi.string(),
    location: Joi.object({
      type: Joi.string().valid("Point"),
      coordinates: Joi.array().items(Joi.number()).length(2),
    }),
  }),
});

const updateLocationSchema = Joi.object({
  latitude: Joi.number().min(-90).max(90).required(),
  longitude: Joi.number().min(-180).max(180).required(),
  street: Joi.string().allow(""),
  city: Joi.string().allow(""),
  state: Joi.string().allow(""),
  pincode: Joi.string().allow(""),
  label: Joi.string().allow(""),
});

const createProfileSchema = Joi.object({
  name: Joi.string().required(),
  accountType: Joi.string().valid("PARENT", "CHILD").default("PARENT"),
  ageGroup: Joi.string()
    .valid("0-3", "4-6", "6-8", "8-10", "10-12", "12-15", "15+")
    .required(),
  preferredGenres: Joi.array().items(Joi.string()),
  preferredLanguages: Joi.array().items(Joi.string()),
  userprofileURL: Joi.string().uri().optional(),
});

const updateProfileSchema = Joi.object({
  name: Joi.string(),
  ageGroup: Joi.string().valid(
    "0-3",
    "4-6",
    "6-8",
    "8-10",
    "10-12",
    "12-15",
    "15+",
  ),
  preferredGenres: Joi.array().items(Joi.string()),
  preferredLanguages: Joi.array().items(Joi.string()),
  userprofileURL: Joi.string().uri().optional(),
});

// All routes require authentication
router.use(protect);

// User routes
router.get("/:id", userController.getUser);
router.put("/:id", validate(updateUserSchema), userController.updateUser);
router.put(
  "/:id/location",
  validate(updateLocationSchema),
  userController.updateDeliveryLocation,
);
router.get("/:id/addresses", userController.getDeliveryAddresses);
router.delete(
  "/:id/addresses/:addressId",
  userController.deleteDeliveryAddress,
);
router.put(
  "/:id/addresses/:addressId/default",
  userController.setDefaultDeliveryAddress,
);
router.get(
  "/:id/delivery-eligibility",
  userController.checkDeliveryEligibility,
);

// Profile routes
router.post(
  "/:parentId/children",
  validate(createProfileSchema),
  userController.createChildProfile,
);
router.get("/:parentId/children", userController.getChildProfiles);
router.put(
  "/:userId/profiles/:profileId",
  validate(updateProfileSchema),
  userController.updateProfile,
);
router.delete("/:userId/profiles/:profileId", userController.deleteProfile);
router.get(
  "/:userId/profiles/:profileId/history",
  userController.getReadingHistory,
);

module.exports = router;
