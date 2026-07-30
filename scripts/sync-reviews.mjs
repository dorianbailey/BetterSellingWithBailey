const API_KEY = process.env.GOOGLE_PLACES_API_KEY;
const PLACE_ID = process.env.GOOGLE_PLACE_ID;

if (!API_KEY || !PLACE_ID) {
    console.error('Missing GOOGLE_PLACES_API_KEY or GOOGLE_PLACE_ID repository secret. Skipping sync.');
    process.exit(0);
}

const fs = await import('node:fs/promises');

const url = 'https://maps.googleapis.com/maps/api/place/details/json' +
    '?place_id=' + encodeURIComponent(PLACE_ID) +
    '&fields=name,rating,user_ratings_total,reviews' +
    '&reviews_sort=newest' +
    '&key=' + encodeURIComponent(API_KEY);

const res = await fetch(url);
const data = await res.json();

if (data.status !== 'OK') {
    console.error('Google Places API error:', data.status, data.error_message || '');
    process.exit(1);
}

const result = data.result || {};
const rawReviews = result.reviews || [];

// The Google Places API only ever returns up to 5 reviews for a place.
// We sort the ones it gives us so the highest-rated reviews are shown
// first in the on-site carousel (ties broken by most recent).
const sorted = rawReviews
  .slice()
  .sort(function (a, b) {
        if (b.rating !== a.rating) return b.rating - a.rating;
        return (b.time || 0) - (a.time || 0);
  })
  .map(function (r) {
        return {
                author: r.author_name || 'Google User',
                rating: r.rating,
                text: r.text || '',
                relativeTime: r.relative_time_description || '',
                time: r.time
        };
  });

const output = {
    lastUpdated: new Date().toISOString(),
    rating: result.rating || null,
    userRatingsTotal: result.user_ratings_total || null,
    reviews: sorted
};

await fs.writeFile('reviews.json', JSON.stringify(output, null, 2) + '\n');
console.log('Synced ' + sorted.length + ' reviews from Google.');
