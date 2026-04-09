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
    questionnaireResponses: {
      age: {
        type: Number,
        min: 0,
        max: 120,
      },
      favoriteActivity: {
        type: String,
        trim: true,
      },
      favoriteCharacter: {
        type: String,
        trim: true,
      },
      favoriteAnimal: {
        type: String,
        trim: true,
      },
      readingFrequency: {
        type: String,
        trim: true,
      },
      primaryReadingGoal: {
        type: String,
        trim: true,
      },
      accountType: {
        type: String,
        enum: ["PARENT", "CHILD"],
      },
    },
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
    recentActivity: [
      {
        bookId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Book",
        },
        action: {
          type: String,
          enum: ["VIEW", "SEARCH"],
          default: "VIEW"
        },
        timestamp: {
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
