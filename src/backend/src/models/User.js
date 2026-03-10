const mongoose = require("mongoose");

const profileSchema = new mongoose.Schema(
  {
    profileId: {
      type: mongoose.Schema.Types.ObjectId,
      default: () => new mongoose.Types.ObjectId(),
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    accountType: {
      type: String,
      enum: ["PARENT", "CHILD"],
      required: true,
    },
    ageGroup: {
      type: String,
      enum: ["0-3", "4-6", "6-8", "8-10", "10-12", "12-15", "15+"],
    },
    preferredGenres: [
      {
        type: String,
      },
    ],
    preferredLanguages: [
      {
        type: String,
      },
    ],
    userprofileURL: {
      type: String,
    },
    readingHistory: [
      {
        bookId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Book",
        },
        readAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    screenTime: {
      type: Number,
      default: 0, // in minutes
    },
  },
  {
    _id: false,
  },
);

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ["ACTIVE", "BLOCKED"],
      default: "ACTIVE",
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
    profiles: [profileSchema],
    deliveryAddresses: [
      {
        label: { type: String, default: "Home" },
        street: String,
        city: String,
        state: String,
        pincode: String,
        location: {
          type: {
            type: String,
            enum: ["Point"],
          },
          coordinates: [Number], // [longitude, latitude]
        },
        isDefault: { type: Boolean, default: false },
      },
    ],
    // Keep legacy single field for backward compat
    deliveryAddress: {
      street: String,
      city: String,
      state: String,
      pincode: String,
      location: {
        type: {
          type: String,
          enum: ["Point"],
        },
        coordinates: [Number], // [longitude, latitude]
      },
    },
    role: {
      type: String,
      enum: ["USER", "LIBRARIAN", "ADMIN"],
      default: "USER",
    },
    // ── Platform Services Layer — Aryan ──────────────────
    // FCM device tokens for push notifications
    fcmTokens: [
      {
        token: { type: String, required: true },
        platform: {
          type: String,
          enum: ["android", "ios", "web"],
          default: "android",
        },
        updatedAt: { type: Date, default: Date.now },
      },
    ],
  },
  {
    timestamps: true,
  },
);

// Index for geospatial queries (sparse index only for documents with location data)
userSchema.index({ "deliveryAddress.location": "2dsphere" }, { sparse: true });

module.exports = mongoose.model("User", userSchema);
