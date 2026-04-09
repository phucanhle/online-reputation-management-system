import { NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';
import { Review } from '@/types/database';
import { mapReview } from '@/lib/mappers';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const cinemaId = searchParams.get('cinemaId');
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '50');
  const skip = (page - 1) * limit;

  try {
    const db = await getDb();
    const reviewsColl = db.collection<Review>('reviews');

    const filter = cinemaId ? { place_id: cinemaId } : {}; // The DB has place_id, not cinemaId

    const [reviews, total] = await Promise.all([
      reviewsColl.find(filter as any).sort({ review_date: -1, isoDate: -1 } as any).skip(skip).limit(limit).toArray(),
      reviewsColl.countDocuments(filter),
    ]);

    // Map raw documents using the shared mapper
    const serializedReviews = reviews.map(r => mapReview(r));

    return NextResponse.json({
      reviews: serializedReviews,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 });
  }
}
