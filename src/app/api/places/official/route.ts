import { NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const placeId = searchParams.get('placeId');

  try {
    const db = await getDb();
    const placesColl = db.collection<any>('places');
    const reviewsColl = db.collection<any>('reviews');
    
    if (placeId) {
      // Fetch specific place — prefer official stats from places collection
      const placeDoc = await placesColl.findOne({ place_id: placeId });

      if (placeDoc) {
        const capturedCount = await reviewsColl.countDocuments({ place_id: placeId, is_deleted: { $ne: 1 } });
        return NextResponse.json({
          placeId: placeDoc.place_id,
          name: placeDoc.place_name,
          avgRating: placeDoc.avg_rating ?? 0,
          totalReviews: placeDoc.total_reviews ?? 0,
          capturedReviews: capturedCount,
          source: 'places',
          lastScraped: placeDoc.last_scraped
        });
      }

      // Fallback: aggregate from reviews collection
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
      const capturedCount = await reviewsColl.countDocuments({ place_id: placeId, is_deleted: { $ne: 1 } });

      return NextResponse.json({
        placeId: place._id,
        name: place.place_name,
        avgRating: place.avg_rating ?? 0,
        totalReviews: place.total_reviews ?? 0,
        capturedReviews: capturedCount,
        source: 'reviews_fallback',
        lastScraped: place.last_scraped
      });
    } else {
      // Fetch all places — prefer official stats from places collection
      const allPlaces = await placesColl.find().toArray();

      if (allPlaces.length > 0) {
        const results = await Promise.all(allPlaces.map(async (placeDoc) => {
          const pid = placeDoc.place_id;
          const capturedCount = await reviewsColl.countDocuments({ place_id: pid, is_deleted: { $ne: 1 } });
          return {
            placeId: pid,
            name: placeDoc.place_name,
            avgRating: placeDoc.avg_rating ?? 0,
            totalReviews: placeDoc.total_reviews ?? 0,
            capturedReviews: capturedCount,
            source: 'places',
            lastScraped: placeDoc.last_scraped
          };
        }));

        return NextResponse.json({ data: results });
      }

      // Fallback: aggregate from reviews collection
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
      
      const results = await Promise.all(places.map(async (place) => {
        const pid = place._id;
        const capturedCount = await reviewsColl.countDocuments({ place_id: pid, is_deleted: { $ne: 1 } });
        return {
          placeId: pid,
          name: place.place_name,
          avgRating: place.avg_rating ?? 0,
          totalReviews: place.total_reviews ?? 0,
          capturedReviews: capturedCount,
          source: 'reviews_fallback',
          lastScraped: place.last_scraped
        };
      }));

      return NextResponse.json({ data: results });
    }

  } catch (error) {
    const err = error as Error;
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
