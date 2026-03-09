const express = require('express');
const bookController = require('../controllers/bookController');
const { protect, restrictTo } = require('../middleware/auth');
const validate = require('../middleware/validate');
const Joi = require('joi');

const router = express.Router();

// Validation schemas
// Only isbn is required — all other fields are auto-filled from Google Books /
// Open Library. Librarian-supplied values always override fetched metadata.
const createBookSchema = Joi.object({
  isbn: Joi.alternatives().try(Joi.string(), Joi.number()).required(),
  title: Joi.string().optional(),
  author: Joi.string().optional(),
  genre: Joi.array().items(Joi.string()).min(1).optional(),
  language: Joi.string().optional(),
  ageRating: Joi.string().pattern(/^\d+-\d+$/).optional().messages({
    'string.pattern.base': 'ageRating must be in "min-max" format (e.g. "4-6").'
  }),
  collectionName: Joi.string().optional(),
  bookURL: Joi.string().uri().optional(),
  summary: Joi.string().max(1000).optional(),
  coverImage: Joi.string().optional(),
  pageCount: Joi.number().integer().optional(),
  publisher: Joi.string().optional(),
});

const updateBookSchema = Joi.object({
  title: Joi.string(),
  author: Joi.string(),
  isbn: Joi.number().required(),
  genre: Joi.array().items(Joi.string()).min(1).required(),
  language: Joi.string(),
  ageRating: Joi.string().pattern(/^\d+-\d+$/).messages({
    'string.pattern.base': 'ageRating must be in "min-max" format (e.g. "4-6").'
  }),
  collectionName: Joi.string(),
  bookURL: Joi.string().uri().optional(),
  summary: Joi.string().max(1000).required(),
  coverImage: Joi.string()
});

// Public routes (anyone can browse books)
router.get('/', bookController.getAllBooks);
router.get('/lookup', protect, restrictTo('LIBRARIAN', 'ADMIN'), bookController.lookupByISBN);
router.get('/:bookId', bookController.getBook);
router.get('/:bookId/availability', protect, bookController.checkAvailability);

// Protected routes (Librarian/Admin only)
router.post('/', protect, restrictTo('LIBRARIAN', 'ADMIN'), validate(createBookSchema), bookController.createBook);
router.put('/:bookId', protect, restrictTo('LIBRARIAN', 'ADMIN'), validate(updateBookSchema), bookController.updateBook);
router.delete('/:bookId', protect, restrictTo('ADMIN'), bookController.deleteBook);

module.exports = router;
