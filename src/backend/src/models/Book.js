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
  ageRating: {
    type: String,
    required: true,
    validate: {
      validator: function (v) {
        return /^\d+-\d+$/.test(v); // Ensures format like "2-10"
      },
      message: props => `${props.value} is not a valid age rating format. Use "min-max" (e.g., "4-6").`
    }
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
  }
}, {
  timestamps: true
});

// Indexes for search
bookSchema.index({ title: 'text', author: 'text' });
bookSchema.index({ genre: 1 });
bookSchema.index({ ageRating: 1 });

module.exports = mongoose.model('Book', bookSchema);
