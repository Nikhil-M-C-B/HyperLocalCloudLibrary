const BookCopy = require('../models/BookCopy');
const LibraryBranch = require('../models/LibraryBranch');
const AppError = require('../utils/AppError');

/**
 * Add book copies to inventory
 */
exports.addBookCopies = async (bookId, branchId, quantity, condition = 'GOOD') => {
  const branch = await LibraryBranch.findById(branchId);
  
  if (!branch) {
    throw new AppError('Library branch not found', 404);
  }
  
  const copies = [];
  
  for (let i = 0; i < quantity; i++) {
    const barcode = `${branchId}-${bookId}-${Date.now()}-${i}`;
    
    const copy = await BookCopy.create({
      bookId,
      branchId,
      barcode,
      condition
    });
    
    copies.push(copy);
  }
  
  return copies;
};

/**
 * Update book copy status
 */
exports.updateCopyStatus = async (copyId, status) => {
  const copy = await BookCopy.findByIdAndUpdate(
    copyId,
    { status },
    { new: true, runValidators: true }
  );
  
  if (!copy) {
    throw new AppError('Book copy not found', 404);
  }
  
  return copy;
};

/**
 * Get inventory by branch
 */
exports.getInventoryByBranch = async (branchId) => {
  const inventory = await BookCopy.find({ branchId })
    .populate('bookId')
    .sort('-createdAt');
  
  return inventory;
};

/**
 * Get available copies for a book at a branch
 */
exports.getAvailableCopies = async (bookId, branchId) => {
  const copies = await BookCopy.find({
    bookId,
    branchId,
    status: 'AVAILABLE'
  });
  
  return copies;
};

/**
 * Mark copy as issued
 */
exports.markAsIssued = async (copyId) => {
  const copy = await BookCopy.findById(copyId);
  
  if (!copy) {
    throw new AppError('Book copy not found', 404);
  }
  
  if (copy.status !== 'AVAILABLE') {
    throw new AppError('Book copy is not available', 400);
  }
  
  copy.status = 'ISSUED';
  copy.lastIssuedAt = new Date();
  await copy.save();
  
  return copy;
};

/**
 * Mark copy as returned
 */
exports.markAsReturned = async (copyId) => {
  const copy = await BookCopy.findById(copyId);
  
  if (!copy) {
    throw new AppError('Book copy not found', 404);
  }
  
  copy.status = 'AVAILABLE';
  copy.lastReturnedAt = new Date();
  await copy.save();
  
  return copy;
};

/**
 * Get inventory stats for a branch
 */
exports.getBranchInventoryStats = async (branchId) => {
  const totalBooks = await BookCopy.countDocuments({ branchId });
  const availableBooks = await BookCopy.countDocuments({ branchId, status: 'AVAILABLE' });
  const issuedBooks = await BookCopy.countDocuments({ branchId, status: 'ISSUED' });
  const damagedBooks = await BookCopy.countDocuments({ branchId, status: 'DAMAGED' });
  const lostBooks = await BookCopy.countDocuments({ branchId, status: 'LOST' });
  
  return {
    total: totalBooks,
    available: availableBooks,
    issued: issuedBooks,
    damaged: damagedBooks,
    lost: lostBooks
  };
};
