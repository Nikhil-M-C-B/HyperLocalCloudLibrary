const { ChatGoogleGenerativeAI } = require("@langchain/google-genai");
const { StructuredOutputParser } = require('@langchain/core/output_parsers');
const { HumanMessage, AIMessage, SystemMessage } = require('@langchain/core/messages');
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
      maxRetries: 0,
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

const smartRecCache = new Map();

/**
 * Generate Smart Recommendations based on algorithmic matching (Bypassing LLM to save quotas)
 */
exports.getSmartRecommendations = async (userId, profileId, branchId) => {
  if (!branchId) throw new AppError('Library branchId is required for recommendations', 400);

  const cacheKey = `algo_${userId}_${profileId}_${branchId}`;
  if (smartRecCache.has(cacheKey)) {
    const cached = smartRecCache.get(cacheKey);
    if (Date.now() - cached.timestamp < 1000 * 60 * 30) return cached.data;
  }

  // 1. Fetch user's preferred genres
  const User = require('../models/User');
  const user = await User.findOne({ _id: userId, "profiles.profileId": profileId }).lean();
  let preferredGenres = [];
  
  if (user) {
    const profile = user.profiles.find(p => p.profileId.toString() === profileId);
    if (profile && profile.preferredGenres) {
      preferredGenres = profile.preferredGenres;
    }
  }

  // 2. Fetch locally AVAILABLE catalog strictly at this physical branch
  const BookCopy = require('../models/BookCopy');
  const validBookIds = await BookCopy.find({ branchId, status: "AVAILABLE" }).distinct("bookId");
  if (validBookIds.length === 0) return []; 
  
  const availableBooks = await Book.find({ _id: { $in: validBookIds } }).lean();
  if (availableBooks.length === 0) return [];

  // 3. Algorithmic Match: Prioritize books fighting their preferred genres
  let matchedBooks = availableBooks.filter(book => 
    book.genre && book.genre.some(g => preferredGenres.includes(g))
  );

  // Fallback to purely random branch books if they don't have enough genre overlaps
  if (matchedBooks.length < 4) {
    matchedBooks = availableBooks;
  }

  // Shuffle and pick 4
  let hydratedBooks = matchedBooks.sort(() => 0.5 - Math.random()).slice(0, 4);

  // 4. Pre-load available branch counts to match the bookController output layout
  hydratedBooks = hydratedBooks.map(b => {
    b.aiReason = "A fantastic pick available at your local branch right now!";
    b.availableCopies = 1; 
    b.availableAtSelectedBranch = true;
    return b;
  });

  smartRecCache.set(cacheKey, { timestamp: Date.now(), data: hydratedBooks });
  return hydratedBooks;
};

/**
 * Process interactive Chat sequences with the Owl AI.
 */
exports.chatWithOwl = async (userId, profileId, branchId, messages = []) => {
  // 1. Fetch user profile activity
  const User = require('../models/User');
  let historySummary = 'User is exploring the library anonymously.';
  if (userId && profileId) {
    const user = await User.findOne({ _id: userId, "profiles.profileId": profileId }).lean();
    if (user) {
      const p = user.profiles.find(x => x.profileId.toString() === profileId);
      if (p && p.recentActivity?.length > 0) {
        const recentBookIds = p.recentActivity.map(a => a.bookId);
        const recentBooks = await Book.find({ _id: { $in: recentBookIds } }, 'title genre author').limit(5).lean();
        historySummary = `The user recently viewed these books: ` + recentBooks.map(b => `${b.title} (${b.genre.join(', ')})`).join('; ');
      }
    }
  }

  // 2. Fetch locally AVAILABLE catalog
  let catalogStr = 'Unknown availability.';
  if (branchId) {
    const BookCopy = require('../models/BookCopy');
    const validBookIds = await BookCopy.find({ branchId, status: "AVAILABLE" }).distinct("bookId");
    const availableBooks = await Book.find({ _id: { $in: validBookIds } }, 'title author summary genre ageRating').lean();
    if (availableBooks.length > 0) {
      catalogStr = availableBooks.map(b => `Title:"${b.title}" by ${b.author} | Genre:${b.genre.join(',')} | Details:${b.summary.substring(0, 80)}...`).join('\n');
    } else {
      catalogStr = 'There are no books currently available at this local branch.';
    }
  }

  // 3. Prompt Engineering
  const systemPrompt = `You are "Owl", an intelligent, extremely warm, and friendly AI librarian working at a local community library.
You help humans find books, navigate the library, and answer reading-related questions.
You MUST keep your answers concise, conversational, and highly helpful. Use emojis! 🦉
If they ask for recommendations, prioritize the CURRENTLY AVAILABLE physical catalog over all else.

User Browsing Context: ${historySummary}

----- CURRENTLY AVAILABLE PHYSICAL CATALOG ON SHELVES IN THEIR LOCAL BRANCH -----
${catalogStr}
---------------------------------------------------------------------------------

Do not output raw JSON, act human. Never recommend a specific book unless you are highly confident it matches their request.`;

  try {
    const langchainMessages = [
      new SystemMessage(systemPrompt),
      ...messages.map(m => m.role === 'user' ? new HumanMessage(m.text) : new AIMessage(m.text))
    ];

    const res = await getLLM().invoke(langchainMessages);
    return typeof res.content === 'string' ? res.content : String(res.content);
  } catch (error) {
    console.error("[Owl Chat Error]:", error.message);
    return "Hoot! I'm sorry, I'm having a little trouble thinking right now. Could you ask me again later? 🦉";
  }
};

/**
 * Stream interactive Chat sequences with the Owl AI.
 * Yields raw text chunks as they are generated by Gemini.
 */
exports.streamChatWithOwl = async function* (userId, profileId, branchId, messages = []) {
  const User = require('../models/User');
  let historySummary = 'User is exploring the library anonymously.';
  if (userId && profileId) {
    const user = await User.findOne({ _id: userId, "profiles.profileId": profileId }).lean();
    if (user) {
      const p = user.profiles.find(x => x.profileId.toString() === profileId);
      if (p && p.recentActivity?.length > 0) {
        const recentBookIds = p.recentActivity.map(a => a.bookId);
        const recentBooks = await Book.find({ _id: { $in: recentBookIds } }, 'title genre author').limit(5).lean();
        historySummary = `The user recently viewed these books: ` + recentBooks.map(b => `${b.title} (${b.genre.join(', ')})`).join('; ');
      }
    }
  }

  let catalogStr = 'Unknown availability.';
  if (branchId) {
    const BookCopy = require('../models/BookCopy');
    const validBookIds = await BookCopy.find({ branchId, status: "AVAILABLE" }).distinct("bookId");
    const availableBooks = await Book.find({ _id: { $in: validBookIds } }, 'title author summary genre ageRating').lean();
    if (availableBooks.length > 0) {
      catalogStr = availableBooks.map(b => `Title:"${b.title}" by ${b.author} | Genre:${b.genre.join(',')} | Details:${b.summary.substring(0, 80)}...`).join('\n');
    } else {
      catalogStr = 'There are no books currently available at this local branch.';
    }
  }

  const systemPrompt = `You are "Owl", an intelligent, extremely warm, and friendly AI librarian working at a local community library.
You help humans find books, navigate the library, and answer reading-related questions.
You MUST keep your answers concise, conversational, and highly helpful. Use emojis! 🦉
If they ask for recommendations, prioritize the CURRENTLY AVAILABLE physical catalog over all else.

User Browsing Context: ${historySummary}

----- CURRENTLY AVAILABLE PHYSICAL CATALOG ON SHELVES IN THEIR LOCAL BRANCH -----
${catalogStr}
---------------------------------------------------------------------------------

Do not output raw JSON, act human. Never recommend a specific book unless you are highly confident it matches their request.`;

  try {
    const langchainMessages = [
      new SystemMessage(systemPrompt),
      ...messages.map(m => m.role === 'user' ? new HumanMessage(m.text) : new AIMessage(m.text))
    ];

    const stream = await getLLM().stream(langchainMessages);
    for await (const chunk of stream) {
      yield typeof chunk.content === 'string' ? chunk.content : String(chunk.content);
    }
  } catch (error) {
    console.error("[Owl Stream Error]:", error.message);
    yield "Hoot! I'm sorry, my magical connection was interrupted. Please ask me again! 🪴";
  }
};

