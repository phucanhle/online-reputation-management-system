import { getDb } from '@/lib/mongodb';

export type SyncProgress = {
  cinema: string;
  status: 'loading' | 'success' | 'error';
  message?: string;
  jobId?: string;
};

function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

/**
 * Tính toán và ghi branch_daily_metrics cho các chi nhánh sau khi scrape chạy xong.
 * Hàm này đọc avg_rating và total_reviews chính thức từ places collection.
 */
export async function runMetricsAggregation(onProgress?: (p: SyncProgress) => void) {
  const db = await getDb();

  const placesColl = db.collection<any>('places');
  const reviewsColl = db.collection<any>('reviews');
  const metricsColl = db.collection<any>('branch_daily_metrics');

  const branches = await placesColl.find({}, {
    projection: { place_id: 1, place_name: 1, avg_rating: 1, total_reviews: 1 }
  }).toArray();

  if (branches.length === 0) {
    return; // Nothing to do
  }

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const thirtyDaysAgo = new Date(todayStart.getTime() - 30 * 24 * 60 * 60 * 1000);

  const batches = chunkArray(branches, 5);

  for (const batch of batches) {
    await Promise.all(batch.map(async (branch) => {
      const pid = branch.place_id;
      const name = branch.place_name || pid;

      if (onProgress) onProgress({ cinema: name, status: 'loading', message: 'Đang tổng hợp metrics...' });

      try {
        // 1. Số liệu chính thức từ Google (Python scraper đã ghi vào places)
        const officialAvgRating = branch.avg_rating ?? 0;
        const officialTotalReviews = branch.total_reviews ?? 0;

        // 2. Tính star distribution và Sentiment Score từ reviews đã cào
        const distResult = await reviewsColl.aggregate([
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

        // 3. Đếm reviews 30 ngày gần nhất (Xử lý so sánh ngày)
        const recent30dResult = await reviewsColl.aggregate([
          {
            $match: {
              place_id: pid,
              review_date: { $gte: thirtyDaysAgo.toISOString() } // MongoDB string compare
            }
          },
          { $count: 'count' }
        ]).toArray();

        const dist = distResult[0] ?? { star1: 0, star2: 0, star3: 0, star4: 0, star5: 0, capturedTotal: 0, ratingSum: 0 };
        const sentimentScore = dist.capturedTotal > 0 ? (dist.ratingSum / dist.capturedTotal) : 0;
        const recent30d = recent30dResult[0]?.count ?? 0;
        const density = recent30d / 30.0;

        // 4. Ghi snapshot vào branch_daily_metrics
        await metricsColl.updateOne(
          { place_id: pid, date: todayStart },
          {
            $set: {
              avg_rating: officialAvgRating,
              total_reviews: officialTotalReviews,
              sentiment_score: Number(sentimentScore.toFixed(2)),
              density_30d: Number(density.toFixed(3)),
              reviews_last_30d: recent30d,
              captured_reviews: dist.capturedTotal,
              star_distribution: {
                '1': dist.star1,
                '2': dist.star2,
                '3': dist.star3,
                '4': dist.star4,
                '5': dist.star5,
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

        if (onProgress) onProgress({ cinema: name, status: 'success', message: 'Tổng hợp metrics hoàn tất' });
      } catch (err) {
        const e = err as Error;
        console.error(`Lỗi xử lý ${name}:`, e.message);
        if (onProgress) onProgress({ cinema: name, status: 'error', message: e.message });
      }
    }));
  }
}
