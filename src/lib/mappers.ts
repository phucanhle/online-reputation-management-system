import { Cinema, Review } from '@/types/database';

export function mapCinema(doc: any): Cinema {
  return {
    ...doc,
    _id: doc._id?.toString(),
    placeId: doc.place_id || doc.placeId,
    name: doc.place_name || doc.name,
    originalUrl: doc.original_url || doc.originalUrl,
    resolvedUrl: doc.resolved_url || doc.resolvedUrl,
    latitude: doc.latitude,
    longitude: doc.longitude,
    firstSeen: doc.first_seen || doc.firstSeen,
    lastScraped: doc.last_scraped || doc.lastScraped,
    totalReviews: doc.total_reviews || doc.totalReviews,
    avgRating: doc.avg_rating || doc.avgRating,
  };
}

export function mapReview(doc: any): Review {
  // Python scraper stores text as {vi: "...", en: "..."} in `description`
  // SQLite scraper stores text as JSON string in `review_text`
  let text = '';
  if (doc.description && typeof doc.description === 'object') {
    text = doc.description.vi || doc.description.en || Object.values(doc.description)[0] as string || '';
  } else if (typeof doc.review_text === 'string' && doc.review_text) {
    if (doc.review_text.trim().startsWith('{')) {
      try {
        const parsed = JSON.parse(doc.review_text);
        text = parsed.vi || parsed.en || Object.values(parsed)[0] as string || '';
      } catch (e) {
        text = doc.review_text;
      }
    } else {
      text = doc.review_text;
    }
  } else {
    text = doc.text || '';
  }

  return {
    ...doc,
    _id: doc._id?.toString(),
    reviewId: doc.review_id || doc.reviewId,
    cinemaId: doc.place_id || doc.cinemaId,
    authorName: doc.author || doc.authorName,
    authorThumbnail: doc.profile_picture || doc.authorThumbnail,
    rating: doc.rating,
    text: text,
    isoDate: doc.review_date || doc.isoDate,
    date: doc.raw_date || doc.date,
    likes: doc.likes,
    createdDate: doc.created_date || doc.createdDate,
    lastModified: doc.last_modified || doc.lastModified,
  };
}
