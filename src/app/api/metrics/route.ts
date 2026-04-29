import { NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';
import { BranchDailyMetrics } from '@/types/database';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const cinemaId = searchParams.get('cinemaId');
  const start = searchParams.get('start');
  const end = searchParams.get('end');
  const includeDelta = searchParams.get('includeDelta') === 'true';

  try {
    const db = await getDb();
    const metricsColl = db.collection<BranchDailyMetrics>('branch_daily_metrics');

    // If requesting deltas for all cinemas (global view)
    if (includeDelta && !cinemaId) {
      // Get the latest snapshot per place_id with review_delta
      const latestSnapshots = await metricsColl.aggregate([
        { $sort: { date: -1 } },
        {
          $group: {
            _id: '$place_id',
            date: { $first: '$date' },
            total_reviews: { $first: '$total_reviews' },
            avg_rating: { $first: '$avg_rating' },
            review_delta: { $first: '$review_delta' },
            sentiment_score: { $first: '$sentiment_score' },
            density_30d: { $first: '$density_30d' },
          }
        }
      ]).toArray();

      return NextResponse.json({
        type: 'deltas',
        count: latestSnapshots.length,
        snapshots: latestSnapshots.map(s => ({
          placeId: s._id,
          date: s.date,
          totalReviews: s.total_reviews,
          avgRating: s.avg_rating,
          reviewDelta: s.review_delta ?? 0,
          sentimentScore: s.sentiment_score,
          density30d: s.density_30d,
        })),
      });
    }

    if (!cinemaId) {
      return NextResponse.json({ error: 'cinemaId is required' }, { status: 400 });
    }

    const filter: any = { place_id: cinemaId };

    if (start || end) {
      filter.date = {};
      if (start) filter.date.$gte = new Date(start);
      if (end) filter.date.$lte = new Date(end);
    }

    const metrics = await metricsColl.find(filter)
      .sort({ date: 1 }) // Chronological order for charts
      .toArray();

    return NextResponse.json({
      cinemaId,
      count: metrics.length,
      metrics
    });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Failed to fetch metrics' }, { status: 500 });
  }
}
