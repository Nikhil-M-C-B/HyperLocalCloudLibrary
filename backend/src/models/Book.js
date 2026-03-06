const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  author: {
    type: String,
    required: true,
    trim: true
  },
  isbn: {
    type: String,
    unique: true,
    sparse: true
  },
  genre: [{
    type: String,
    trim: true
  }],
  language: {
    type: String,
    default: 'English'
  },
  ageRating: {
    type: String,
    enum: ['0-3', '4-6', '6-8', '8-10', '10-12', '12-15', '15+'],
    required: true
  },
  collectionName: {
    type: String,
    trim: true
  },
  bookURL: {
    type: String,
    trim: true
  },
  summary: {
    type: String,
    maxlength: 1000
  },
  coverImage: {
    type: String
  }
}, {
  timestamps: true
});

// Indexes for search
bookSchema.index({ title: 'text', author: 'text' });
bookSchema.index({ genre: 1 });
bookSchema.index({ ageRating: 1 });

module.exports = mongoose.model('Book', bookSchema);
