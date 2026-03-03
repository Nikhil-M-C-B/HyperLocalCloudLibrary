const bookService = require('../services/bookService');
const catchAsync = require('../utils/catchAsync');

/**
 * Get all books
 * GET /books
 */
exports.getAllBooks = catchAsync(async (req, res) => {
  const filters = {
    ageGroup: req.query.age,
    genre: req.query.genre,
    language: req.query.language,
    search: req.query.search,
    sort: req.query.sort,
    limit: req.query.limit
  };
  
  const books = await bookService.getAllBooks(filters);
  
  res.status(200).json({
    status: 'success',
    results: books.length,
    data: { books }
  });
});

/**
 * Get book by ID
 * GET /books/:bookId
 */
exports.getBook = catchAsync(async (req, res) => {
  const book = await bookService.getBookById(req.params.bookId);
  
  res.status(200).json({
    status: 'success',
    data: { book }
  });
});

/**
 * Create new book
 * POST /books
 */
exports.createBook = catchAsync(async (req, res) => {
  const book = await bookService.createBook(req.body);
  
  res.status(201).json({
    status: 'success',
    data: { book }
  });
});

/**
 * Update book
 * PUT /books/:bookId
 */
exports.updateBook = catchAsync(async (req, res) => {
  const book = await bookService.updateBook(req.params.bookId, req.body);
  
  res.status(200).json({
    status: 'success',
    data: { book }
  });
});

/**
 * Delete book
 * DELETE /books/:bookId
 */
exports.deleteBook = catchAsync(async (req, res) => {
  await bookService.deleteBook(req.params.bookId);
  
  res.status(204).json({
    status: 'success',
    data: null
  });
});

/**
 * Check book availability
 * GET /books/:bookId/availability
 */
exports.checkAvailability = catchAsync(async (req, res) => {
  // User location should be from user's delivery address or profile
  const userLocation = {
    latitude: parseFloat(req.query.lat),
    longitude: parseFloat(req.query.lng)
  };
  
  if (!userLocation.latitude || !userLocation.longitude) {
    // Get from user's delivery address
    const user = req.user;
    if (user.deliveryAddress && user.deliveryAddress.location) {
      userLocation.latitude = user.deliveryAddress.location.coordinates[1];
      userLocation.longitude = user.deliveryAddress.location.coordinates[0];
    }
  }
  
  const availability = await bookService.checkAvailability(req.params.bookId, userLocation);
  
  res.status(200).json({
    status: 'success',
    data: availability
  });
});
