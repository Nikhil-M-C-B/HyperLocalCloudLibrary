const express = require('express');
const inventoryController = require('../controllers/inventoryController');
const { protect, restrictTo } = require('../middleware/auth');
const validate = require('../middleware/validate');
const Joi = require('joi');

const router = express.Router();

// Validation schemas
const addCopiesSchema = Joi.object({
  bookId: Joi.string().required(),
  branchId: Joi.string().required(),
  quantity: Joi.number().integer().min(1).required(),
  condition: Joi.string().valid('GOOD', 'FAIR', 'POOR').default('GOOD')
});

const updateStatusSchema = Joi.object({
  status: Joi.string().valid('AVAILABLE', 'ISSUED', 'LOST', 'DAMAGED').required()
});

// All routes require authentication and LIBRARIAN/ADMIN role
router.use(protect);
router.use(restrictTo('LIBRARIAN', 'ADMIN'));

router.post('/', validate(addCopiesSchema), inventoryController.addBookCopies);
router.put('/:copyId', validate(updateStatusSchema), inventoryController.updateCopyStatus);
router.get('/book/:bookId', inventoryController.getBookInventory);
router.get('/branch/:branchId', inventoryController.getInventoryByBranch);
router.get('/branch/:branchId/stats', inventoryController.getBranchStats);

module.exports = router;
