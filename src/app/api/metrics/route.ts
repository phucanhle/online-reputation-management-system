/**
 * src/app/api/metrics/route.ts
 * Next.js API Route for querying daily snapshots and deltas of cinema branches.
 */

import { NextResponse } from 'next/server';
import { MetricsService } from '@/lib/services/metricsService';
import { logger } from '@/lib/services/logger';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const cinemaId = searchParams.get('cinemaId');
  const start = searchParams.get('start') || undefined;
  const end = searchParams.get('end') || undefined;
  const includeDelta = searchParams.get('includeDelta') === 'true';

  try {
    // 1. Fetch latest branch snapshots for global view
    if (includeDelta && !cinemaId) {
      const latestSnapshots = await MetricsService.getLatestSnapshots();

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
      return NextResponse.json({ error: 'cinemaId parameter is required' }, { status: 400 });
    }

    // 2. Fetch specific branch metrics history
    const metrics = await MetricsService.getBranchMetrics(cinemaId, start, end);

    return NextResponse.json({
      cinemaId,
      count: metrics.length,
      metrics
    });
  } catch (error) {
    logger.error('[API/Metrics] Failed to fetch metrics', error);
    return NextResponse.json({ error: 'Failed to fetch metrics database records.' }, { status: 500 });
  }
}
