const Book = require('../models/Book');
const BookCopy = require('../models/BookCopy');
const AppError = require('../utils/AppError');

/**
 * Get all books with filters
 */
exports.getAllBooks = async (filters = {}) => {
  const query = {};

  // Apply filters
  if (filters.ageGroup) {
    query.ageRating = filters.ageGroup;
  }

  if (filters.genre) {
    query.genre = { $in: Array.isArray(filters.genre) ? filters.genre : [filters.genre] };
  }

  if (filters.language) {
    query.language = filters.language;
  }

  // Text search
  if (filters.search) {
    query.$text = { $search: filters.search };
  }

  if (filters.daysAgo) {
    const date = new Date();
    date.setDate(date.getDate() - parseInt(filters.daysAgo));
    query.createdAt = { $gte: date };
  }

  const books = await Book.find(query)
    .sort(filters.sort || '-createdAt')
    .limit(parseInt(filters.limit) || 50);

  return books;
};

/**
 * Get book by ID
 */
exports.getBookById = async (bookId) => {
  const book = await Book.findById(bookId);

  if (!book) {
    throw new AppError('Book not found', 404);
  }

  return book;
};

/**
 * Create new book (Librarian/Admin only)
 */
exports.createBook = async (bookData) => {
  const book = await Book.create(bookData);
  return book;
};

/**
 * Update book (Librarian/Admin only)
 */
exports.updateBook = async (bookId, updateData) => {
  const book = await Book.findByIdAndUpdate(bookId, updateData, {
    new: true,
    runValidators: true
  });

  if (!book) {
    throw new AppError('Book not found', 404);
  }

  return book;
};

/**
 * Delete book (Admin only)
 */
exports.deleteBook = async (bookId) => {
  const book = await Book.findByIdAndDelete(bookId);

  if (!book) {
    throw new AppError('Book not found', 404);
  }

  // Also delete all copies
  await BookCopy.deleteMany({ bookId });

  return { message: 'Book deleted successfully' };
};

/**
 * Check book availability in nearby libraries
 */
exports.checkAvailability = async (bookId, userLocation) => {
  const LibraryBranch = require('../models/LibraryBranch');
  const { calculateDistance } = require('../utils/haversine');
  const config = require('../config');

  // Find all copies of this book
  const copies = await BookCopy.find({
    bookId,
    status: 'AVAILABLE'
  }).populate('branchId');

  // Filter branches within delivery radius
  const availableInBranches = [];

  for (const copy of copies) {
    if (!copy.branchId || copy.branchId.status !== 'ACTIVE') continue;

    const distance = calculateDistance(
      userLocation.latitude,
      userLocation.longitude,
      copy.branchId.location.coordinates[1], // latitude
      copy.branchId.location.coordinates[0]  // longitude
    );

    const isWithinReach = distance <= config.business.deliveryRadiusKm;

    const existingBranch = availableInBranches.find(
      b => b.branchId.toString() === copy.branchId._id.toString()
    );

    if (existingBranch) {
      existingBranch.availableCopies++;
    } else {
      availableInBranches.push({
        branchId: copy.branchId._id,
        branchName: copy.branchId.name,
        address: copy.branchId.address,
        distance: Math.round(distance * 10) / 10, // Round to 1 decimal
        availableCopies: 1,
        isWithinReach
      });
    }
  }

  // Sort by distance
  availableInBranches.sort((a, b) => a.distance - b.distance);

  return {
    bookId,
    totalAvailable: availableInBranches.reduce((sum, b) => sum + b.availableCopies, 0),
    branches: availableInBranches
  };
};

/**
 * Get books by age rating
 */
exports.getBooksByAge = async (ageGroup) => {
  const books = await Book.find({ ageRating: ageGroup }).sort('-createdAt');
  return books;
};
