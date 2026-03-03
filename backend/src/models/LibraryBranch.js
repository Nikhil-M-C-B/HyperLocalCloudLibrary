const mongoose = require('mongoose');

const libraryBranchSchema = new mongoose.Schema({
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  address: {
    type: String,
    required: true
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
    }
  },
  librarian: {
    type: String,
  },
  serviceRadiusKm: {
    type: Number,
    default: 8
  },
  status: {
    type: String,
    enum: ['ACTIVE', 'INACTIVE'],
    default: 'ACTIVE'
  }
}, {
  timestamps: true
});

// Create geospatial index for location queries
libraryBranchSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('LibraryBranch', libraryBranchSchema);
