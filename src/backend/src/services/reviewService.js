const axios = require('axios');
const cheerio = require('cheerio');

exports.fetchAggregatedReviews = async (isbn) => {
  const aggregated = [];
  
  if (!isbn || isbn.length < 10) return aggregated;

  try {
    const url = `https://www.goodreads.com/book/isbn/${isbn}`;
    const { data } = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'en-US,en;q=0.5'
      },
      timeout: 8000
    });

    const $ = cheerio.load(data);
    const reviews = [];
    
    // Modern UI class
    $('.ReviewText__content').each((i, el) => {
      if (i < 5) reviews.push($(el).text().trim());
    });
    
    // Legacy UI class
    if (reviews.length === 0) {
      $('.reviewText span.readable').each((i, el) => {
        if (i < 5) reviews.push($(el).text().trim());
      });
    }

    reviews.forEach(text => {
      if (text.length > 20) {
         aggregated.push({ source: 'Goodreads', text });
      }
    });
  } catch (error) {
    console.warn(`[ReviewService] Failed to scrape Goodreads for ${isbn}`, error.message);
  }

  // Fallback so the pipeline visibly proves it's working even if Goodreads 404s the ISBN
  if (aggregated.length === 0) {
    aggregated.push({ 
      source: 'System', 
      text: "We couldn't find live text reviews for this exact ISBN on Goodreads. If this is a newly added test book with a dummy ISBN (or if Goodreads blocked the local fetch), live community reviews won't attach!" 
    });
  }

  return aggregated;
};
