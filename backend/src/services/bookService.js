const Book = require("../models/Book");
const BookCopy = require("../models/BookCopy");
const AppError = require("../utils/AppError");
const bookMetadataService = require("./bookMetadataService");
const s3Service = require("./s3Service");

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
    query.genre = {
      $in: Array.isArray(filters.genre) ? filters.genre : [filters.genre],
    };
  }

  if (filters.language) {
    query.language = filters.language;
  }

  // Text search — use regex so stop words like "the", "a", "of" are not ignored
  if (filters.search) {
    const escapedSearch = filters.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const searchRegex = new RegExp(escapedSearch, 'i');
    query.$or = [
      { title: searchRegex },
      { author: searchRegex },
      { summary: searchRegex },
    ];
  }

  if (filters.daysAgo) {
    const date = new Date();
    date.setDate(date.getDate() - parseInt(filters.daysAgo));
    query.createdAt = { $gte: date };
  }

  const books = await Book.find(query)
    .sort(filters.sort || "-createdAt")
    .limit(parseInt(filters.limit) || 50)
    .lean();

  // Attach available copies count from BookCopy collection
  const bookIds = books.map((b) => b._id);
  const copiesAgg = await BookCopy.aggregate([
    { $match: { bookId: { $in: bookIds }, status: "AVAILABLE" } },
    { $group: { _id: "$bookId", count: { $sum: 1 } } },
  ]);
  const copiesMap = {};
  copiesAgg.forEach((c) => {
    copiesMap[c._id.toString()] = c.count;
  });
  books.forEach((b) => {
    b.availableCopies = copiesMap[b._id.toString()] || 0;
  });

  return books;
};

/**
 * Get book by ID
 */
exports.getBookById = async (bookId) => {
  const book = await Book.findById(bookId).lean();

  if (!book) {
    throw new AppError("Book not found", 404);
  }

  // Load actual available copies count
  const availableCopiesCount = await BookCopy.countDocuments({
    bookId,
    status: "AVAILABLE",
  });
  book.availableCopies = availableCopiesCount;

  return book;
};

/**
 * Create new book (Librarian/Admin only).
 * If an ISBN is provided and fields like title/summary/coverImage are missing,
 * they are auto-filled from Google Books / Open Library.
 * Librarian-supplied values always take priority over fetched data.
 */
exports.createBook = async (bookData) => {
  let data = { ...bookData };

  if (data.isbn) {
    // Check for duplicate ISBN first
    const existing = await Book.findOne({ isbn: data.isbn });
    if (existing) {
      throw new AppError(`A book with ISBN ${data.isbn} already exists`, 409);
    }

    // Auto-enrich missing fields from external APIs
    try {
      const metadata = await bookMetadataService.fetchByISBN(data.isbn);
      if (metadata) {
        // Only fill fields the librarian left blank
        data.title = data.title || metadata.title;
        data.author = data.author || metadata.author;
        data.genre = data.genre?.length ? data.genre : metadata.genre;
        data.language = data.language || metadata.language;
        data.summary = data.summary || metadata.summary;
        data.coverImage = data.coverImage || metadata.coverImage;
        data.ageRating = data.ageRating || metadata.ageRating;
        data.publishedDate = data.publishedDate || metadata.publishedDate;
        // Store extra metadata not in the form
        data._metadataSource = metadata.source;
      }
    } catch (err) {
      // Metadata fetch failure must never block book creation
      console.warn(`[createBook] Metadata enrichment THREW: ${err.message}`, err.stack);
    }
  }

  // Fallback genre so the array is never empty
  if (!data.genre || data.genre.length === 0) {
    data.genre = ['General'];
  }

  // Fallback summary — summary is required in the schema
  if (!data.summary) {
    data.summary = 'No description available.';
  }

  // Upload cover to S3 for permanent self-hosted storage
  if (data.coverImage) {
    data.coverImage = await s3Service.uploadCoverFromUrl(data.isbn, data.coverImage);
  }

  if (!data.title || !data.author) {
    console.error('[createBook] FAILING — missing title or author. title:', data.title, '| author:', data.author);
    throw new AppError(
      "Could not determine title and author from ISBN — please provide them manually",
      400,
    );
  }

  // Default age rating to all-ages if APIs couldn't determine it
  if (!data.ageRating) {
    data.ageRating = '0-99';
  }

  // Remove internal tracking field before saving
  delete data._metadataSource;

  const book = await Book.create(data);
  return book;
};

/**
 * Update book (Librarian/Admin only)
 */
exports.updateBook = async (bookId, updateData) => {
  const book = await Book.findByIdAndUpdate(bookId, updateData, {
    new: true,
    runValidators: true,
  });

  if (!book) {
    throw new AppError("Book not found", 404);
  }

  return book;
};

/**
 * Delete book (Admin only)
 */
exports.deleteBook = async (bookId) => {
  const book = await Book.findByIdAndDelete(bookId);

  if (!book) {
    throw new AppError("Book not found", 404);
  }

  // Delete S3 cover if it was uploaded there
  if (book.coverImage) {
    await s3Service.deleteCover(book.coverImage);
  }

  // Also delete all copies
  await BookCopy.deleteMany({ bookId });

  return { message: "Book deleted successfully" };
};

/**
 * Look up book metadata by ISBN without creating a book record.
 * Used by the frontend to preview data before the librarian confirms.
 */
exports.lookupByISBN = async (isbn) => {
  if (!isbn) throw new AppError("ISBN is required", 400);

  const existing = await Book.findOne({ isbn: String(isbn).replace(/[-\s]/g, "") });

  const metadata = await bookMetadataService.fetchByISBN(isbn);
  if (!metadata) {
    throw new AppError(`No metadata found for ISBN: ${isbn}`, 404);
  }

  return {
    metadata,
    alreadyInCatalog: !!existing,
    existingBookId: existing?._id || null,
  };
};

/**
 * Check book availability in nearby libraries
 */
exports.checkAvailability = async (bookId, userLocation) => {
  const LibraryBranch = require("../models/LibraryBranch");
  const { calculateDistance } = require("../utils/haversine");
  const config = require("../config");

  // Find all copies of this book
  const copies = await BookCopy.find({
    bookId,
    status: "AVAILABLE",
  }).populate("branchId");

  // Filter branches within delivery radius
  const availableInBranches = [];

  for (const copy of copies) {
    if (!copy.branchId || copy.branchId.status !== "ACTIVE") continue;
    if (!copy.branchId.location || !copy.branchId.location.coordinates)
      continue;

    let distance = 0;
    let isWithinReach = true;

    // Only calculate distance if user location is valid
    if (
      userLocation.latitude &&
      userLocation.longitude &&
      !isNaN(userLocation.latitude) &&
      !isNaN(userLocation.longitude)
    ) {
      distance = calculateDistance(
        userLocation.latitude,
        userLocation.longitude,
        copy.branchId.location.coordinates[1], // latitude
        copy.branchId.location.coordinates[0], // longitude
      );
      isWithinReach = distance <= config.business.deliveryRadiusKm;
    } else {
      // No user location — show all branches, mark distance as unknown
      distance = 0;
      isWithinReach = true;
    }

    const existingBranch = availableInBranches.find(
      (b) => b.branchId.toString() === copy.branchId._id.toString(),
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
        isWithinReach,
      });
    }
  }

  // Sort by distance
  availableInBranches.sort((a, b) => a.distance - b.distance);

  return {
    bookId,
    totalAvailable: availableInBranches.reduce(
      (sum, b) => sum + b.availableCopies,
      0,
    ),
    branches: availableInBranches,
  };
};

/**
 * Get books by age rating
 */
exports.getBooksByAge = async (ageGroup) => {
  const books = await Book.find({ ageRating: ageGroup }).sort("-createdAt");
  return books;
};
