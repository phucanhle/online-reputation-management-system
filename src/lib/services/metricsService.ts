/**
 * src/lib/services/metricsService.ts
 * Metrics Service encapsulating MongoDB aggregations and analytical snapshots.
 */

import { getDb } from '@/lib/mongodb';
import { logger } from '@/lib/services/logger';
import { BranchDailyMetrics } from '@/types/database';

export interface SyncProgressUpdate {
  cinema: string;
  status: 'loading' | 'success' | 'error';
  message?: string;
  jobId?: string;
}

export interface MetricAggregationResult {
  place_id: string;
  place_name: string;
  avg_rating: number;
  total_reviews: number;
}

export class MetricsService {
  /**
   * Helper to partition arrays into processing chunks.
   */
  private static chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  /**
   * Generates Daily Snapshot statistics for all branches based on reviews database.
   */
  public static async runMetricsAggregation(onProgress?: (p: SyncProgressUpdate) => void): Promise<void> {
    logger.info('[Metrics] Running Metrics Aggregation Pipeline...');
    try {
      const db = await getDb();
      const reviewsColl = db.collection('reviews');
      const metricsColl = db.collection<BranchDailyMetrics>('branch_daily_metrics');

      // Group reviews to get official metrics per place_id
      const branches = await reviewsColl.aggregate<any>([
        {
          $group: {
            _id: '$place_id',
            place_name: { $first: '$company' },
            avg_rating: { $avg: '$rating' },
            total_reviews: { $sum: 1 }
          }
        }
      ]).toArray();

      if (branches.length === 0) {
        logger.info('[Metrics] No review branches found to aggregate.');
        return;
      }

      const formattedBranches: MetricAggregationResult[] = branches.map(b => ({
        place_id: b._id,
        place_name: b.place_name || b._id,
        avg_rating: b.avg_rating || 0,
        total_reviews: b.total_reviews || 0
      }));

      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const thirtyDaysAgo = new Date(todayStart.getTime() - 30 * 24 * 60 * 60 * 1000);

      // Process in batches of 5 for speed and efficiency
      const batches = this.chunkArray(formattedBranches, 5);

      for (const batch of batches) {
        await Promise.all(batch.map(async (branch) => {
          const pid = branch.place_id;
          const name = branch.place_name;

          if (onProgress) {
            onProgress({ cinema: name, status: 'loading', message: 'Đang tổng hợp metrics...' });
          }

          try {
            // 1. Calculate star distribution and average sentiment rating from captured reviews
            const distResult = await reviewsColl.aggregate<any>([
              { $match: { place_id: pid } },
              {
                $group: {
                  _id: null,
                  star1: { $sum: { $cond: [{ $eq: ['$rating', 1] }, 1, 0] } },
                  star2: { $sum: { $cond: [{ $eq: ['$rating', 2] }, 1, 0] } },
                  star3: { $sum: { $cond: [{ $eq: ['$rating', 3] }, 1, 0] } },
                  star4: { $sum: { $cond: [{ $eq: ['$rating', 4] }, 1, 0] } },
                  star5: { $sum: { $cond: [{ $eq: ['$rating', 5] }, 1, 0] } },
                  capturedTotal: { $sum: 1 },
                  ratingSum: { $sum: '$rating' }
                }
              }
            ]).toArray();

            // 2. Count reviews in last 30 days
            const recent30dResult = await reviewsColl.aggregate<any>([
              {
                $match: {
                  place_id: pid,
                  review_date: { $gte: thirtyDaysAgo.toISOString() }
                }
              },
              { $count: 'count' }
            ]).toArray();

            const dist = distResult[0] ?? { star1: 0, star2: 0, star3: 0, star4: 0, star5: 0, capturedTotal: 0, ratingSum: 0 };
            const sentimentScore = dist.capturedTotal > 0 ? (dist.ratingSum / dist.capturedTotal) : 0;
            const recent30d = recent30dResult[0]?.count ?? 0;
            const density = recent30d / 30.0;

            // 3. Compute day-over-day review delta
            const prevSnapshot = await metricsColl.findOne(
              { place_id: pid, date: { $lt: todayStart } },
              { sort: { date: -1 }, projection: { total_reviews: 1 } }
            );
            const prevTotal = prevSnapshot?.total_reviews ?? branch.total_reviews;
            const reviewDelta = branch.total_reviews - prevTotal;

            // 4. Upsert snapshot daily metric record
            await metricsColl.updateOne(
              { place_id: pid, date: todayStart },
              {
                $set: {
                  avg_rating: branch.avg_rating,
                  total_reviews: branch.total_reviews,
                  sentiment_score: Number(sentimentScore.toFixed(2)),
                  density_30d: Number(density.toFixed(3)),
                  reviews_last_30d: recent30d,
                  review_delta: reviewDelta,
                  captured_reviews: dist.capturedTotal,
                  star_distribution: {
                    1: dist.star1,
                    2: dist.star2,
                    3: dist.star3,
                    4: dist.star4,
                    5: dist.star5,
                  },
                  updated_at: now,
                },
                $setOnInsert: {
                  place_id: pid,
                  date: todayStart,
                }
              },
              { upsert: true }
            );

            if (onProgress) {
              onProgress({ cinema: name, status: 'success', message: 'Tổng hợp metrics hoàn tất' });
            }
          } catch (err) {
            logger.error(`[Metrics] Snapshot processing failed for ${name}`, err);
            if (onProgress) {
              onProgress({ cinema: name, status: 'error', message: err instanceof Error ? err.message : String(err) });
            }
          }
        }));
      }
      logger.info('[Metrics] Metrics aggregation finished successfully.');
    } catch (err) {
      logger.error('[Metrics] Aggregation pipeline crashed', err);
      throw err;
    }
  }

  /**
   * Fetches historical metrics for a given cinema, optionally filtered by range.
   */
  public static async getBranchMetrics(cinemaId: string, start?: string, end?: string): Promise<BranchDailyMetrics[]> {
    const db = await getDb();
    const metricsColl = db.collection<BranchDailyMetrics>('branch_daily_metrics');

    const filter: any = { place_id: cinemaId };
    if (start || end) {
      filter.date = {};
      if (start) filter.date.$gte = new Date(start);
      if (end) filter.date.$lte = new Date(end);
    }

    return await metricsColl.find(filter)
      .sort({ date: 1 })
      .toArray();
  }

  /**
   * Fetches latest metrics per place_id to calculate daily deltas.
   */
  public static async getLatestSnapshots(): Promise<any[]> {
    const db = await getDb();
    const metricsColl = db.collection('branch_daily_metrics');

    return await metricsColl.aggregate([
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
  }
}
