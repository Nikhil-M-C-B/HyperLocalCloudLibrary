'use strict';

/**
 * Book Metadata Service
 *
 * Fetches book metadata by ISBN from external APIs.
 * Strategy: Google Books first (better summaries and coverage),
 *            Open Library as fallback (free, no key required).
 *
 * Environment variables:
 *   GOOGLE_BOOKS_API_KEY  — optional; without it Google allows ~100 req/day
 *                           with it, 1000 req/day free
 */

const axios  = require('axios');
const config = require('../config');

// ─────────────────────────────────────────────────────────────────────────────
// Normalisation helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Map book categories / maturity rating to our "min-max" age range format.
 *
 * Sources:
 *   categories     — Google Books volumeInfo.categories  OR  Open Library subject names
 *   maturityRating — Google Books volumeInfo.maturityRating (NOT_MATURE | MATURE)
 *
 * Always returns a "min-max" string (e.g. "0-3", "8-12") or null.
 * null means the caller should fall back to a default (handled in bookService).
 */
function _mapAgeRating(categories = [], maturityRating = '') {
  const joined = categories.join(' ').toLowerCase();

  // ── Explicit numeric ranges ──────────────────────────────────────────────
  // "Ages 4-8", "Ages 9-12", "Ages 4 to 8"
  const rangeMatch = joined.match(/ages?\s+(\d+)\s*[-–to]+\s*(\d+)/i);
  if (rangeMatch) return `${rangeMatch[1]}-${rangeMatch[2]}`;

  // "4 and up", "8 years and up", "8+"
  const upMatch = joined.match(/(\d+)\s*(?:years?|yr)?\s*(?:(?:and|&)\s*(?:up|over|older)|\+)/);
  if (upMatch) {
    const min = parseInt(upMatch[1], 10);
    return `${min}-99`;
  }

  // ── Audience keywords (most specific → least specific) ──────────────────
  if (joined.includes('board book'))                                         return '0-3';
  if (joined.includes('baby') || joined.includes('toddler'))                 return '0-3';
  if (joined.includes('preschool'))                                          return '3-5';
  if (joined.includes('kindergarten'))                                       return '4-6';
  if (joined.includes('picture book'))                                       return '4-8';
  if (joined.includes('easy reader') || joined.includes('easy-to-read'))     return '4-8';
  if (joined.includes('beginning reader') || joined.includes('beginner reader') ||
      joined.includes('early reader'))                                        return '5-8';
  if (joined.includes('middle grade') || joined.includes('middle-grade'))    return '8-12';
  if (joined.includes('chapter book'))                                       return '6-10';
  // Young adult before generic "juvenile" because YA is more specific
  if (joined.includes('young adult') || joined.includes('ya fiction') ||
      joined.includes('teen fiction'))                                        return '12-18';
  if (joined.includes('teen'))                                               return '13-18';
  if (joined.includes('juvenile fiction') || joined.includes('juvenile nonfiction')) return '8-12';
  if (joined.includes('juvenile'))                                           return '6-12';
  if (joined.includes("children's fiction") || joined.includes("children's nonfiction") ||
      joined.includes("children's stories"))                                 return '4-10';
  if (joined.includes('children'))                                           return '4-10';

  // Mature / adult content
  if (maturityRating === 'MATURE')                                           return '16-99';

  // Generic adult categories — reasonable floor
  if (joined.includes('fiction') || joined.includes('nonfiction') ||
      joined.includes('biography') || joined.includes('history') ||
      joined.includes('science') || joined.includes('novel'))                return '14-99';

  return null; // truly unknown — caller applies fallback
}

function _truncate(str, max) {
  if (!str) return null;
  return str.length > max ? str.slice(0, max - 3) + '...' : str;
}

/**
 * Clean raw Google Books / Open Library category tags into human-readable genres.
 * Removes structured tags (Serie:..., nyt:...), list-like marketing strings,
 * and anything with = or / characters.
 */
function _cleanGenres(raw = []) {
  return raw
    .flatMap(g => g.split(',').map(s => s.trim()))   // split comma-separated entries
    .filter(g =>
      g.length > 0 &&
      !g.includes(':') &&          // removes "Serie:...", "nyt:..."
      !g.includes('=') &&          // removes "nyt:chapter_books=2010-11-06"
      !g.includes('/') &&          // removes path-like strings
      !/^\d/.test(g) &&            // removes strings starting with a digit
      g.split(' ').length <= 4     // removes long marketing phrases
    )
    .map(g => g.charAt(0).toUpperCase() + g.slice(1)); // capitalise first letter
}

// ─────────────────────────────────────────────────────────────────────────────
// Google Books
// ─────────────────────────────────────────────────────────────────────────────

async function _fetchFromGoogleBooks(isbn) {
  const params = { q: `isbn:${isbn}` };
  if (config.googleBooks?.apiKey) {
    params.key = config.googleBooks.apiKey;
  }

  const response = await axios.get(
    'https://www.googleapis.com/books/v1/volumes',
    { params, timeout: 8000 }
  );

  const items = response.data?.items;
  if (!items?.length) return null;

  const info = items[0].volumeInfo;

  // Get the best available cover (prefer higher-res)
  const cover =
    info.imageLinks?.extraLarge ||
    info.imageLinks?.large      ||
    info.imageLinks?.medium     ||
    info.imageLinks?.thumbnail  ||
    null;

  // Strip Google's tracking query params from cover URL and force HTTPS
  const coverImage = cover
    ? cover.replace(/^http:\/\//, 'https://').replace(/&edge=curl/, '')
    : null;

  // Combine title + subtitle so "The Son of Neptune" + "Heroes of Olympus, Book 2"
  // becomes "The Son of Neptune: Heroes of Olympus, Book 2", preserving the full name.
  const fullTitle = info.subtitle
    ? `${info.title}: ${info.subtitle}`
    : (info.title || null);

  return {
    title:       fullTitle,
    author:      info.authors?.join(', ') || null,
    isbn,
    genre:       _cleanGenres(info.categories),
    language:    info.language === 'en' ? 'English' : (info.language || 'English'),
    summary:     _truncate(info.description, 1000),
    coverImage,
    pageCount:   info.pageCount   || null,
    publisher:   info.publisher   || null,
    publishedDate: info.publishedDate || null,
    ageRating:   _mapAgeRating(info.categories || [], info.maturityRating || ''),
    source:      'google_books',
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Open Library (fallback)
// ─────────────────────────────────────────────────────────────────────────────

async function _fetchFromOpenLibrary(isbn) {
  // Step 1: ISBN endpoint — fast, gives us basic info + works key
  const bibResponse = await axios.get(
    'https://openlibrary.org/api/books',
    {
      params: {
        bibkeys:  `ISBN:${isbn}`,
        format:   'json',
        jscmd:    'data',
      },
      timeout: 8000,
    }
  );

  const entry = bibResponse.data?.[`ISBN:${isbn}`];
  if (!entry) return null;

  // Step 2: Fetch description from the works record.
  // The 'data' endpoint may omit the 'works' array — fall back to fetching the
  // edition's own JSON (/books/OL...M.json) which always includes a works array.
  let summary = null;
  try {
    let worksKey = entry.works?.[0]?.key;

    if (!worksKey) {
      // Extract just the edition key (e.g. /books/OL26939404M) from the url field
      const editionPath = entry.url?.replace('https://openlibrary.org', '');
      const editionKey = editionPath?.match(/\/books\/OL\w+/)?.[0];
      if (editionKey) {
        const editionResp = await axios.get(
          `https://openlibrary.org${editionKey}.json`,
          { timeout: 6000 }
        );
        worksKey = editionResp.data?.works?.[0]?.key;
      }
    }

    if (worksKey && worksKey.startsWith('/works/')) {
      const worksResponse = await axios.get(
        `https://openlibrary.org${worksKey}.json`,
        { timeout: 6000 }
      );
      const desc = worksResponse.data?.description;
      summary = typeof desc === 'string' ? desc
              : typeof desc === 'object' ? desc.value
              : null;
      summary = _truncate(summary, 1000);
    }
  } catch {
    // description is optional — continue without it
  }

  const authors = entry.authors?.map(a => a.name).join(', ') || null;
  const genres  = _cleanGenres(entry.subjects?.slice(0, 5).map(s => s.name) || []);
  // If the data endpoint didn't give us a cover, fall back to the Open Library
  // covers CDN which returns a 404 (triggering onError in the app) when absent.
  const coverFromApi = entry.cover?.large || entry.cover?.medium || entry.cover?.small || null;
  const cover = coverFromApi || `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg`;

  // Open Library stores series as a subject named "Serie:Series_Name_With_Underscores".
  // Extract it and prepend to the title so e.g. "The Mark of Athena" becomes
  // "The Heroes of Olympus: The Mark of Athena".
  const seriesSubject = entry.subjects?.find(s => /^serie:/i.test(s.name));
  const seriesName = seriesSubject
    ? seriesSubject.name.replace(/^serie:/i, '').replace(/_/g, ' ').trim()
    : null;
  const olTitle = seriesName && entry.title && !entry.title.includes(':')
    ? `${seriesName}: ${entry.title}`
    : (entry.title || null);

  return {
    title:       olTitle,
    author:      authors,
    isbn,
    genre:       genres,
    language:    entry.language?.[0]?.key?.replace('/languages/', '') || 'English',
    summary,
    coverImage:  cover,
    pageCount:   entry.number_of_pages || null,
    publisher:   entry.publishers?.[0]?.name || null,
    publishedDate: entry.publish_date || null,
    ageRating:   _mapAgeRating(entry.subjects?.map(s => s.name) || [], ''),
    source:      'open_library',
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Fetch book metadata by ISBN.
 * Always tries both sources and merges results:
 *   - Google Books is primary (better title casing, cover URLs)
 *   - Open Library fills any null/empty fields Google Books couldn't provide
 *     (subjects/genre and descriptions are often richer there)
 * Returns null if neither source has the book.
 */
exports.fetchByISBN = async (isbn) => {
  // Normalise ISBN — strip hyphens and spaces
  const cleanISBN = String(isbn).replace(/[-\s]/g, '');

  let google = null;
  let openLib = null;

  // 1. Try Google Books
  try {
    google = await _fetchFromGoogleBooks(cleanISBN);
  } catch (err) {
    console.warn(`[BookMetadata] Google Books THREW for ISBN ${cleanISBN}: ${err.message}`);
  }

  // 2. Try Open Library — always fetch when Google Books returned sparse data
  //    (no summary, no genre, or no cover) or returned nothing at all
  const googleIsSparse = !google || !google.summary || !google.genre?.length || !google.coverImage;
  if (googleIsSparse) {
    try {
      openLib = await _fetchFromOpenLibrary(cleanISBN);
    } catch (err) {
      console.warn(`[BookMetadata] Open Library THREW for ISBN ${cleanISBN}: ${err.message}`);
    }
  }

  // 3. Nothing found at all
  if (!google && !openLib) {
    console.warn('[fetchByISBN] Both sources returned nothing for ISBN:', cleanISBN);
    return null;
  }

  // 4. Merge: Google Books primary, Open Library fills gaps
  if (!google) return openLib;
  if (!openLib) return google;

  // Prefer whichever title is longer — OL enriches with the series prefix
  // (e.g. "The Heroes of Olympus: The Mark of Athena") while Google Books may
  // only return the bare title when no subtitle field is present.
  const bestTitle = (openLib.title?.length ?? 0) > (google.title?.length ?? 0)
    ? openLib.title
    : google.title;

  return {
    ...google,
    title:         bestTitle,
    summary:       google.summary    || openLib.summary,
    genre:         google.genre?.length ? google.genre : openLib.genre,
    coverImage:    google.coverImage    || openLib.coverImage,
    publisher:     google.publisher     || openLib.publisher,
    pageCount:     google.pageCount     || openLib.pageCount,
    ageRating:     google.ageRating     || openLib.ageRating,
    publishedDate: google.publishedDate || openLib.publishedDate,
    source:        'google_books+open_library',
  };
};
