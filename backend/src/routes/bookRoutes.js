const express = require('express');
const bookController = require('../controllers/bookController');
const { protect, restrictTo } = require('../middleware/auth');
const validate = require('../middleware/validate');
const Joi = require('joi');

const router = express.Router();

// Validation schemas
const createBookSchema = Joi.object({
  title: Joi.string().required(),
  author: Joi.string().required(),
  isbn: Joi.number().required(),
  genre: Joi.array().items(Joi.string()).min(1).required(),
  language: Joi.string(),
  ageRating: Joi.string().pattern(/^\d+-\d+$/).required().messages({
    'string.pattern.base': 'ageRating must be in "min-max" format (e.g. "4-6").'
  }),
  collectionName: Joi.string(),
  bookURL: Joi.string().uri().optional(),
  summary: Joi.string().max(1000).required(),
  coverImage: Joi.string()
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
router.get('/:bookId', bookController.getBook);
router.get('/:bookId/availability', protect, bookController.checkAvailability);

// Protected routes (Librarian/Admin only)
router.post('/', protect, restrictTo('LIBRARIAN', 'ADMIN'), validate(createBookSchema), bookController.createBook);
router.put('/:bookId', protect, restrictTo('LIBRARIAN', 'ADMIN'), validate(updateBookSchema), bookController.updateBook);
router.delete('/:bookId', protect, restrictTo('ADMIN'), bookController.deleteBook);

module.exports = router;
