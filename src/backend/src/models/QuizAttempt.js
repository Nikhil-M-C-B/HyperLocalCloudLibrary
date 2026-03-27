const mongoose = require('mongoose');

const quizAttemptSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  bookId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Book',
    required: true,
  },
  score: {
    type: Number,
    required: true,
  },
  totalQuestions: {
    type: Number,
    required: true,
  },
  questions: [
    {
      question: String,
      selectedAnswer: String,
      correctAnswer: String,
      isCorrect: Boolean,
    }
  ],
}, { timestamps: true });

// Optionally, add an index to easily query a user's past quizzes
quizAttemptSchema.index({ userId: 1, createdAt: -1 });
quizAttemptSchema.index({ bookId: 1 });

module.exports = mongoose.model('QuizAttempt', quizAttemptSchema);
