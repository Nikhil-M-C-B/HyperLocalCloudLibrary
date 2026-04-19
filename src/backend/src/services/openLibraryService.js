const Book = require('../models/Book');
const AppError = require('../utils/AppError');

const escapeRegex = (value) => String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const toArray = (value) => (Array.isArray(value) ? value : []);

const buildAuthorKey = (name) => encodeURIComponent(String(name || '').trim());

const authorNameFromKey = (authorKey) => {
  const cleaned = String(authorKey || '').trim().replace(/^\/authors\//, '');
  if (!cleaned) return '';
  try {
    return decodeURIComponent(cleaned).trim();
  } catch (error) {
    return cleaned;
  }
};

const parseYear = (value) => {
  if (!value) return null;
  const match = String(value).match(/\b(\d{4})\b/);
  return match ? Number(match[1]) : null;
};

const topSubjectsFromBooks = (books, limit = 10) => {
  const frequency = new Map();
  for (const book of books) {
    for (const genre of toArray(book.genre)) {
      const normalized = String(genre || '').trim();
      if (!normalized) continue;
      frequency.set(normalized, (frequency.get(normalized) || 0) + 1);
    }
  }

  return [...frequency.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([genre]) => genre);
};

exports.searchAuthors = async (query, limit = 10) => {
  const q = String(query || '').trim();
  if (!q) {
    throw new AppError('Query parameter q is required', 400);
  }

  const safeLimit = Math.min(Math.max(parseInt(limit, 10) || 10, 1), 25);

  const regex = new RegExp(escapeRegex(q), 'i');
  const authors = await Book.aggregate([
    {
      $match: {
        author: { $type: 'string', $ne: '', $regex: regex },
      },
    },
    {
      $group: {
        _id: { $toLower: '$author' },
        name: { $first: '$author' },
        workCount: { $sum: 1 },
        topWork: { $min: '$title' },
      },
    },
    { $sort: { workCount: -1, name: 1 } },
    { $limit: safeLimit },
  ]);

  return authors.map((author) => ({
    key: buildAuthorKey(author.name),
    name: String(author.name || 'Unknown Author'),
    topWork: author.topWork || null,
    workCount: Number(author.workCount || 0),
    birthDate: null,
    deathDate: null,
    ratingsAverage: 0,
    ratingsCount: 0,
  }));
};

exports.getAuthorDetails = async (authorKey) => {
  const authorName = authorNameFromKey(authorKey);
  if (!authorName) {
    throw new AppError('Author key is required', 400);
  }

  const authorRegex = new RegExp(`^${escapeRegex(authorName)}$`, 'i');
  const books = await Book.find({ author: authorRegex })
    .select('title publishedDate genre')
    .sort({ createdAt: -1 })
    .limit(25)
    .lean();

  if (!books.length) {
    throw new AppError('Author not found in catalog', 404);
  }

  const works = books.map((book) => ({
    key: null,
    title: book.title || 'Untitled',
    firstPublishYear: parseYear(book.publishedDate),
    subjects: toArray(book.genre).slice(0, 5),
  }));

  return {
    key: buildAuthorKey(books[0].author || authorName),
    name: books[0].author || authorName,
    bio: null,
    birthDate: null,
    deathDate: null,
    alternateNames: [],
    topSubjects: topSubjectsFromBooks(books, 10),
    works,
  };
};

exports.searchPublishers = async (query, limit = 12) => {
  const q = String(query || '').trim();
  if (!q) {
    throw new AppError('Query parameter q is required', 400);
  }

  const safeLimit = Math.min(Math.max(parseInt(limit, 10) || 12, 1), 30);

  // This project stores publisher-like information under collectionName.
  const regex = new RegExp(escapeRegex(q), 'i');
  const books = await Book.find({ collectionName: { $type: 'string', $ne: '', $regex: regex } })
    .select('collectionName title')
    .limit(500)
    .lean();

  const map = new Map();

  for (const book of books) {
    const normalized = String(book.collectionName || '').trim();
    if (!normalized) continue;

    if (!map.has(normalized)) {
      map.set(normalized, {
        name: normalized,
        mentions: 0,
        sampleTitles: [],
      });
    }

    const item = map.get(normalized);
    item.mentions += 1;
    if (book.title && item.sampleTitles.length < 3 && !item.sampleTitles.includes(book.title)) {
      item.sampleTitles.push(book.title);
    }
  }

  return [...map.values()]
    .sort((a, b) => b.mentions - a.mentions)
    .slice(0, safeLimit);
};

exports.getPublisherDetails = async (publisherName) => {
  const name = String(publisherName || '').trim();
  if (!name) {
    throw new AppError('Publisher name is required', 400);
  }

  const publisherRegex = new RegExp(`^${escapeRegex(name)}$`, 'i');
  const publisherBooks = await Book.find({ collectionName: publisherRegex })
    .select('title publishedDate author')
    .sort({ createdAt: -1 })
    .limit(20)
    .lean();

  if (!publisherBooks.length) {
    throw new AppError('Publisher not found in catalog', 404);
  }

  const books = publisherBooks.map((book) => ({
    title: book.title || 'Untitled',
    firstPublishYear: parseYear(book.publishedDate),
    authorNames: book.author ? [book.author] : [],
  }));

  return {
    name: publisherBooks[0].collectionName || name,
    location: null,
    founded: null,
    website: null,
    description: null,
    books,
  };
};
