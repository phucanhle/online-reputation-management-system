import { NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const placeId = searchParams.get('placeId');

  try {
    const db = await getDb();
    const reviewsColl = db.collection<any>('reviews');
    
    if (placeId) {
      // Fetch specific place
      const places = await reviewsColl.aggregate([
        { $match: { place_id: placeId } },
        { 
          $group: { 
            _id: '$place_id', 
            place_name: { $first: '$company' }, 
            avg_rating: { $avg: '$rating' }, 
            total_reviews: { $sum: 1 },
            last_scraped: { $max: '$created_date' }
          } 
        }
      ]).toArray();

      if (places.length === 0) {
        return NextResponse.json({ error: 'Place not found in database' }, { status: 404 });
      }

const place = places[0];
// Use pre-computed captured_reviews if available, otherwise count live
      const capturedCount = place.captured_reviews
        ?? await reviewsColl.countDocuments({ place_id: placeId, is_deleted: { $ne: 1 } });

      return NextResponse.json({
        placeId: place._id,
        name: place.place_name,
        avgRating: place.avg_rating ?? 0,
totalReviews: place.total_reviews ?? 0,
        capturedReviews: place.total_reviews,
totalReviews: place.total_reviews ?? 0,   // Official Google count
        capturedReviews: capturedCount,             // What's in our DB
        source: 'database',
        lastScraped: place.last_scraped
      });
    } else {
      // Fetch all places
      const places = await reviewsColl.aggregate([
        { 
          $group: { 
            _id: '$place_id', 
            place_name: { $first: '$company' }, 
            avg_rating: { $avg: '$rating' }, 
            total_reviews: { $sum: 1 },
            last_scraped: { $max: '$created_date' }
          } 
        }
      ]).toArray();
      
const results = places.map((place) => {
const results = await Promise.all(places.map(async (place) => {
        const capturedCount = place.captured_reviews
          ?? await reviewsColl.countDocuments({ place_id: place.place_id, is_deleted: { $ne: 1 } });
        return {
          placeId: place._id,
          name: place.place_name,
          avgRating: place.avg_rating ?? 0,
totalReviews: place.total_reviews ?? 0,
          capturedReviews: place.total_reviews,
totalReviews: place.total_reviews ?? 0,   // Official Google count
          capturedReviews: capturedCount,             // What's in our DB
          source: 'database',
          lastScraped: place.last_scraped
        };
      });

      return NextResponse.json({ data: results });
    }

  } catch (error) {
    const err = error as Error;
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
