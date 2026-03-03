const inventoryService = require('../services/inventoryService');
const catchAsync = require('../utils/catchAsync');

/**
 * Add book copies to inventory
 * POST /inventory
 */
exports.addBookCopies = catchAsync(async (req, res) => {
  const { bookId, branchId, quantity, condition } = req.body;
  
  const copies = await inventoryService.addBookCopies(bookId, branchId, quantity, condition);
  
  res.status(201).json({
    status: 'success',
    data: { copies }
  });
});

/**
 * Update copy status
 * PUT /inventory/:copyId
 */
exports.updateCopyStatus = catchAsync(async (req, res) => {
  const { status } = req.body;
  const copy = await inventoryService.updateCopyStatus(req.params.copyId, status);
  
  res.status(200).json({
    status: 'success',
    data: { copy }
  });
});

/**
 * Get inventory by branch
 * GET /inventory/branch/:branchId
 */
exports.getInventoryByBranch = catchAsync(async (req, res) => {
  const inventory = await inventoryService.getInventoryByBranch(req.params.branchId);
  
  res.status(200).json({
    status: 'success',
    results: inventory.length,
    data: { inventory }
  });
});

/**
 * Get branch inventory stats
 * GET /inventory/branch/:branchId/stats
 */
exports.getBranchStats = catchAsync(async (req, res) => {
  const stats = await inventoryService.getBranchInventoryStats(req.params.branchId);
  
  res.status(200).json({
    status: 'success',
    data: { stats }
  });
});
