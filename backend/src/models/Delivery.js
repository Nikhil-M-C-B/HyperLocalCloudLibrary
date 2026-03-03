const mongoose = require('mongoose');

const deliverySchema = new mongoose.Schema({
  issueId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Issue',
    required: true
  },
  branchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LibraryBranch',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  deliveryAddress: {
    type: String,
    required: true
  },
  scheduledAt: {
    type: Date,
    required: true
  },
  deliveredAt: {
    type: Date
  },
  status: {
    type: String,
    enum: ['SCHEDULED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'FAILED'],
    default: 'SCHEDULED'
  },
  trackingId: {
    type: String
  }
}, {
  timestamps: true
});

// Indexes
deliverySchema.index({ issueId: 1 });
deliverySchema.index({ userId: 1, status: 1 });
deliverySchema.index({ status: 1 });

module.exports = mongoose.model('Delivery', deliverySchema);
