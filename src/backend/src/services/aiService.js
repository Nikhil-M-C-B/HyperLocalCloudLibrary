const { ChatGoogleGenerativeAI } = require("@langchain/google-genai");
const { StructuredOutputParser } = require('@langchain/core/output_parsers');
const { z } = require('zod');
const AppError = require('../utils/AppError');
const QuizAttempt = require('../models/QuizAttempt');
const Book = require('../models/Book');

// Initialize Gemini lazily so we don't crash the server on boot if the API key is missing
let llm = null;
const getLLM = () => {
  if (!llm) {
    const key = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    if (!key) {
      console.warn("⚠️ AI Quiz Engine requires GEMINI_API_KEY in .env");
    }
    llm = new ChatGoogleGenerativeAI({
      model: "gemini-flash-latest",
      apiKey: key || "missing_key_to_prevent_boot_crash",
      temperature: 0.7,
    });
  }
  return llm;
};

exports.generateQuiz = async (bookId) => {
  const book = await Book.findById(bookId);
  if (!book) throw new AppError('Book not found', 404);

  const parser = StructuredOutputParser.fromZodSchema(
    z.object({
      questions: z.array(
        z.object({
          question: z.string().describe("The quiz question about the book"),
          options: z.array(z.string()).describe("Four possible answers"),
          correctAnswer: z.string().describe("The exact correct option string"),
        })
      ).length(5),
    })
  );

  const formatInstructions = parser.getFormatInstructions();

  const prompt = `You are a friendly librarian creating a reading comprehension quiz for a child who just read the book "${book.title}" by ${book.author}. 
  The book's summary is: ${book.summary}. The target age group is ${book.minAge ? book.minAge + '+' : 'children'}. 
  Generate 5 engaging multiple-choice questions about the book's plot or concepts.
  
  ${formatInstructions}
  `;

  try {
    const res = await getLLM().invoke(prompt);
    const parsed = await parser.parse(typeof res.content === 'string' ? res.content : String(res.content));
    return parsed;
  } catch (error) {
    console.error("AI Quiz generation failed:", error);
    throw new AppError('Failed to generate quiz. Please try again later.', 500);
  }
};

exports.submitQuiz = async (userId, bookId, answers) => {
  // answers: [{ question, selectedAnswer, correctAnswer, isCorrect }]
  const totalQuestions = answers.length;
  const score = answers.filter(a => a.isCorrect).length;

  const attempt = await QuizAttempt.create({
    userId,
    bookId,
    score,
    totalQuestions,
    questions: answers,
  });

  return attempt;
};

exports.getQuizHistory = async (userId) => {
  return await QuizAttempt.find({ userId })
    .populate('bookId', 'title coverImage')
    .sort('-createdAt')
    .lean();
};
