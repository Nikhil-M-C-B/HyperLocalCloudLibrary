const aiService = require('../services/aiService');
const catchAsync = require('../utils/catchAsync');

exports.generateQuiz = catchAsync(async (req, res) => {
  const quiz = await aiService.generateQuiz(req.params.bookId);

  res.status(200).json({
    status: 'success',
    data: { quiz },
  });
});

exports.submitQuiz = catchAsync(async (req, res) => {
  const { bookId, answers } = req.body;
  const userId = req.user._id;

  const attempt = await aiService.submitQuiz(userId, bookId, answers);

  res.status(201).json({
    status: 'success',
    data: { attempt },
  });
});

exports.getQuizHistory = catchAsync(async (req, res) => {
  // Using params userId for history
  const userId = req.params.userId || req.user._id;
  const history = await aiService.getQuizHistory(userId);

  res.status(200).json({
    status: 'success',
    data: { history },
  });
});
