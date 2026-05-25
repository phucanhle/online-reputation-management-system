/**
 * src/app/api/places/official/route.ts
 * Next.js API Route for querying place information from places and reviews.
 */

import { NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';
import { logger } from '@/lib/services/logger';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const placeId = searchParams.get('placeId');

  try {
    const db = await getDb();
    const placesColl = db.collection('places');
    const reviewsColl = db.collection('reviews');
    
    if (placeId) {
      // 1. Fetch specific place
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

      // 2. Fallback: Aggregate from reviews collection if place record is missing
      const fallbackResult = await reviewsColl.aggregate<any>([
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

      if (fallbackResult.length === 0) {
        return NextResponse.json({ error: 'Place not found in database records' }, { status: 404 });
      }

      const place = fallbackResult[0];
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
      // 3. Fetch all places
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

      // 4. Fallback: Aggregate all places from reviews collection
      const fallbackPlaces = await reviewsColl.aggregate<any>([
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
      
      const results = await Promise.all(fallbackPlaces.map(async (place) => {
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
    logger.error('[API/Places] Failed to query official places statistics', error);
    return NextResponse.json({ error: 'Failed to retrieve places statistics' }, { status: 500 });
  }
}
