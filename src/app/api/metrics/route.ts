import { NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';
import { BranchDailyMetrics } from '@/types/database';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const cinemaId = searchParams.get('cinemaId');
  const start = searchParams.get('start');
  const end = searchParams.get('end');

  if (!cinemaId) {
    return NextResponse.json({ error: 'cinemaId is required' }, { status: 400 });
  }

  try {
    const db = await getDb();
    const metricsColl = db.collection<BranchDailyMetrics>('branch_daily_metrics');

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
