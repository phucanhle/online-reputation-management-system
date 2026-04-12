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
      // Fetch specific place
      const place = await placesColl.findOne({ place_id: placeId });

      if (!place) {
        return NextResponse.json({ error: 'Place not found in database' }, { status: 404 });
      }

      // Đếm số lượng review thực tế đã cào được trong DB cho rạp này
      const capturedCount = await reviewsColl.countDocuments({ place_id: placeId });

      return NextResponse.json({
        placeId: place.place_id,
        name: place.place_name || place.name,
        avgRating: place.avg_rating ?? 0,
        totalReviews: place.total_reviews ?? 0,
        capturedReviews: capturedCount,
        source: 'database',
        lastScraped: place.last_scraped || place.updated_at
      });
    } else {
      // Fetch all places
      const places = await placesColl.find({}).toArray();
      
      const results = await Promise.all(places.map(async (place) => {
        const capturedCount = await reviewsColl.countDocuments({ place_id: place.place_id });
        return {
          placeId: place.place_id,
          name: place.place_name || place.name,
          avgRating: place.avg_rating ?? 0,
          totalReviews: place.total_reviews ?? 0,
          capturedReviews: capturedCount,
          source: 'database',
          lastScraped: place.last_scraped || place.updated_at
        };
      }));

      return NextResponse.json({ data: results });
    }

  } catch (error) {
    const err = error as Error;
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
