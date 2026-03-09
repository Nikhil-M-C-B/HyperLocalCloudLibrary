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
/**
 * Map book categories / maturity rating to our "min-max" age range format.
 *
 * Strategy (most-specific wins):
 *   1. Explicit numeric range in category text ("Ages 4-8", "8 and up")
 *   2. Well-known audience keywords (board book → juvenile)
 *   3. Explicit Google Books maturityRating signal
 *   4. Any non-empty categories without a children/teen label → '14-99' (adult)
 *   5. Completely empty input → null  (caller uses '16-99' as the safe fallback)
 *
 * SAFETY: when in doubt we always err adult-only so child profiles are protected.
 */
function _mapAgeRating(categories = [], maturityRating = '') {
  const joined = categories.join(' ').toLowerCase();

  // ── 1. Explicit numeric ranges ───────────────────────────────────────────
  const rangeMatch = joined.match(/ages?\s+(\d+)\s*[-–to]+\s*(\d+)/i);
  if (rangeMatch) return `${rangeMatch[1]}-${rangeMatch[2]}`;

  const upMatch = joined.match(/(\d+)\s*(?:years?|yr)?\s*(?:(?:and|&)\s*(?:up|over|older)|\+)/);
  if (upMatch) {
    const min = parseInt(upMatch[1], 10);
    return `${min}-99`;
  }

  // ── 2. Audience keywords (most-specific → least) ─────────────────────────

  // School reading-level annotations ("Reading Level-Grade 7") override generic
  // "Children's stories" subject tags that OL sometimes applies to YA/teen books.
  // Grade N ≈ age N+5 (Grade 7 → 12 years old).
  const gradeMatch = joined.match(/reading\s*level[- ]+grade\s*(\d+)/i);
  if (gradeMatch) {
    const minAge = parseInt(gradeMatch[1], 10) + 5;
    return `${minAge}-99`;
  }

  if (joined.includes('board book'))                                             return '0-3';
  if (joined.includes('baby') || joined.includes('toddler'))                    return '0-3';
  if (joined.includes('preschool'))                                              return '3-5';
  if (joined.includes('kindergarten'))                                           return '4-6';
  if (joined.includes('picture book'))                                           return '4-8';
  if (joined.includes('easy reader') || joined.includes('easy-to-read'))        return '4-8';
  if (joined.includes('beginning reader') || joined.includes('beginner reader')
      || joined.includes('early reader'))                                        return '5-8';
  if (joined.includes('middle grade') || joined.includes('middle-grade'))       return '8-12';
  if (joined.includes('chapter book'))                                           return '6-10';
  // young adult is more specific than generic "juvenile"
  if (joined.includes('young adult') || joined.includes('ya fiction')
      || joined.includes('ya literature') || joined.includes('teen fiction'))    return '12-18';
  if (joined.includes('teen') && joined.includes('fiction'))                    return '13-18';
  if (joined.includes('juvenile fiction') || joined.includes('juvenile nonfiction')) return '8-12';
  if (joined.includes('juvenile'))                                               return '6-12';
  if (joined.includes("children's fiction") || joined.includes("children's nonfiction")
      || joined.includes("children's stories") || joined.includes("children's books")) return '4-10';
  if (joined.includes('children'))                                               return '4-10';

  // ── 3. Explicit maturity signals from Google Books ────────────────────────
  if (maturityRating === 'MATURE')     return '16-99'; // restricted 18+
  if (maturityRating === 'NOT_MATURE') return '8-99';  // explicitly cleared as safe

  // ── 4. Non-empty categories that never matched a children/teen label ──────
  //    Anything here is academic, adult fiction, biography, etc.
  //    Default adult to protect children — better to under-serve than over-expose.
  if (categories.length > 0) return '14-99';

  // ── 5. Truly empty — caller will apply '16-99' safe fallback ─────────────
  return null;
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
    ageRating:       _mapAgeRating(info.categories || [], info.maturityRating || ''),
    _maturityRating: info.maturityRating || '', // passed through for merge
    source:          'google_books',
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
// Source 3: Open Library Search — different endpoint, often richer subjects
// ─────────────────────────────────────────────────────────────────────────────

async function _fetchFromOpenLibrarySearch(isbn) {
  const response = await axios.get(
    'https://openlibrary.org/search.json',
    {
      params: {
        isbn,
        limit: 1,
        fields: 'title,author_name,subject,first_publish_year,publisher,language',
      },
      timeout: 8000,
    }
  );

  const doc = response.data?.docs?.[0];
  if (!doc) return null;

  const allSubjects = doc.subject || [];

  return {
    title:         doc.title || null,
    author:        doc.author_name?.join(', ') || null,
    isbn,
    genre:         _cleanGenres(allSubjects.slice(0, 6)),
    language:      doc.language?.includes('eng') ? 'English' : (doc.language?.[0] || 'English'),
    summary:       null,
    coverImage:    null,
    pageCount:     null,
    publisher:     doc.publisher?.[0] || null,
    publishedDate: doc.first_publish_year ? String(doc.first_publish_year) : null,
    ageRating:     _mapAgeRating(allSubjects, ''),
    source:        'open_library_search',
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Source 4: Library of Congress Books API — free, authoritative, no key needed
// ─────────────────────────────────────────────────────────────────────────────

async function _fetchFromLibraryOfCongress(isbn) {
  const response = await axios.get(
    'https://www.loc.gov/books/',
    {
      params: { q: isbn, fo: 'json' },
      timeout: 10000,
      headers: { Accept: 'application/json' },
    }
  );

  const results = response.data?.results;
  if (!results?.length) return null;

  const item = results[0];

  const subjects = (item.subject || []).filter(s => typeof s === 'string');

  // LoC title sometimes contains " / Author Name" — strip it
  const rawTitle = Array.isArray(item.title) ? item.title[0] : (item.title || null);
  const title = rawTitle ? rawTitle.replace(/\s*\/.*$/, '').trim() : null;

  // LoC contributors may be "Roy, Arundhati, 1961-" — strip trailing dates
  const rawAuthor = (item.contributor || [])[0] || null;
  const author = typeof rawAuthor === 'string'
    ? rawAuthor.replace(/,?\s*\d{4}-?(\d{4})?\.?$/, '').trim()
    : null;

  return {
    title,
    author,
    isbn,
    genre:         _cleanGenres(subjects.slice(0, 5)),
    language:      'English',
    summary:       null,
    coverImage:    null,
    pageCount:     null,
    publisher:     null,
    publishedDate: null,
    ageRating:     _mapAgeRating(subjects, ''),
    source:        'loc',
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Fetch book metadata by ISBN using up to 4 free sources.
 *
 * Source priority:
 *   1. Google Books      — best cover URLs, maturityRating signal, publisher info
 *   2. Open Library bibkeys — series-enriched titles, primary OL endpoint
 *   3. Open Library Search  — broader subject list, better age classification
 *   4. Library of Congress  — authoritative headings; tried only when no age rating found yet
 *
 * Age-rating merge rules:
 *   - Collect all non-null ratings from every source.
 *   - If ANY source says child-appropriate (minAge < 12), pick the most permissive child rating.
 *   - If ALL sources say adult, pick the most conservative (highest minAge) to stay safe.
 *
 * Returns null if no source has the book.
 */
exports.fetchByISBN = async (isbn) => {
  const cleanISBN = String(isbn).replace(/[-\s]/g, '');

  let google = null, openLib = null, olSearch = null, loc = null;

  // 1. Google Books
  try {
    google = await _fetchFromGoogleBooks(cleanISBN);
  } catch (err) {
    console.warn(`[BookMetadata] Google Books THREW for ISBN ${cleanISBN}: ${err.message}`);
  }

  // 2. Open Library bibkeys — always try (free, reliable)
  try {
    openLib = await _fetchFromOpenLibrary(cleanISBN);
  } catch (err) {
    console.warn(`[BookMetadata] Open Library THREW for ISBN ${cleanISBN}: ${err.message}`);
  }

  // 3. OL Search — fetch when either primary is missing age or genre
  const needMoreAge   = !google?.ageRating   && !openLib?.ageRating;
  const needMoreGenre = !google?.genre?.length && !openLib?.genre?.length;
  if (needMoreAge || needMoreGenre) {
    try {
      olSearch = await _fetchFromOpenLibrarySearch(cleanISBN);
    } catch (err) {
      console.warn(`[BookMetadata] OL Search THREW for ISBN ${cleanISBN}: ${err.message}`);
    }
  }

  // 4. Library of Congress — only if still no age rating resolved
  const haveAge = google?.ageRating || openLib?.ageRating || olSearch?.ageRating;
  if (!haveAge) {
    try {
      loc = await _fetchFromLibraryOfCongress(cleanISBN);
    } catch (err) {
      console.warn(`[BookMetadata] LoC THREW for ISBN ${cleanISBN}: ${err.message}`);
    }
  }

  if (!google && !openLib && !olSearch && !loc) {
    console.warn('[fetchByISBN] All sources returned nothing for ISBN:', cleanISBN);
    return null;
  }

  // ── Merge ─────────────────────────────────────────────────────────────────
  const primary = google || openLib;
  if (!primary) return olSearch || loc;

  // Prefer longer title — OL often prepends the series name
  const bestTitle = (openLib?.title?.length ?? 0) > (primary.title?.length ?? 0)
    ? openLib.title
    : primary.title;

  // Gather all non-null age ratings from every source
  const allRatings = [
    google?.ageRating,
    openLib?.ageRating,
    olSearch?.ageRating,
    loc?.ageRating,
  ].filter(Boolean);

  // Last-chance: derive from Google's raw maturityRating if no subject-based rating exists
  const maturityRating = google?._maturityRating || '';
  if (!allRatings.length && maturityRating) {
    const derived = _mapAgeRating([], maturityRating);
    if (derived) allRatings.push(derived);
  }

  let bestAgeRating = allRatings[0] || null;
  if (allRatings.length > 1) {
    const parsed = allRatings.map(r => {
      const [mn, mx] = r.split('-').map(Number);
      return { r, mn, mx };
    });
    const hasChildRating = parsed.some(p => p.mn < 12);
    bestAgeRating = hasChildRating
      ? parsed.reduce((a, b) => a.mn <= b.mn ? a : b).r   // widest child window
      : parsed.reduce((a, b) => a.mn >= b.mn ? a : b).r;  // safest adult
  }

  return {
    ...primary,
    title:         bestTitle,
    summary:       primary.summary     || openLib?.summary    || null,
    genre:         primary.genre?.length ? primary.genre : (openLib?.genre || olSearch?.genre || []),
    coverImage:    primary.coverImage  || openLib?.coverImage || null,
    publisher:     primary.publisher   || openLib?.publisher  || null,
    pageCount:     primary.pageCount   || openLib?.pageCount  || null,
    ageRating:     bestAgeRating,
    publishedDate: primary.publishedDate || openLib?.publishedDate || olSearch?.publishedDate || loc?.publishedDate || null,
    source:        [google && 'google', openLib && 'open_library', olSearch && 'ol_search', loc && 'loc'].filter(Boolean).join('+'),
  };
};
