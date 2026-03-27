const express = require('express');
const quizController = require('../controllers/quizController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect); // All quiz routes require authentication

router.get('/generate/:bookId', quizController.generateQuiz);
router.post('/submit', quizController.submitQuiz);
router.get('/history/:userId', quizController.getQuizHistory);

module.exports = router;
