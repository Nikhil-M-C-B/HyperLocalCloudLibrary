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
    type: Number,
    unique: true,
    required: true,
    sparse: true
  },
  genre: {
    type: [{
      type: String,
      trim: true
    }],
    default: [],
  },
  language: {
    type: String,
    default: 'English'
  },
  minAge: {
    type: Number,
    required: true,
    min: 0,
    default: 0
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
    required: true,
    maxlength: 1000
  },
  coverImage: {
    type: String
  },
  pageCount: {
    type: Number,
    min: 1
  },
  publishedDate: {
    type: String,
    trim: true
  },
  generatedTags: {
    type: [{
      type: String,
      trim: true,
      lowercase: true
    }],
    default: []
  },
  chatbotTags: {
    type: [{
      type: String,
      trim: true,
      lowercase: true
    }],
    default: []
  }
}, {
  timestamps: true
});

// Indexes for search
bookSchema.index({ title: 'text', author: 'text' }, { language_override: 'textSearchLang' });
bookSchema.index({ genre: 1 });
bookSchema.index({ minAge: 1 });
bookSchema.index({ generatedTags: 1 });
bookSchema.index({ chatbotTags: 1 });

module.exports = mongoose.model('Book', bookSchema);
