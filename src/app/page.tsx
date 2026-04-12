import { getDb } from '@/lib/mongodb';
import DashboardClient from '@/components/DashboardClient';
import { Cinema, Review } from '@/types/database';
import { mapCinema, mapReview } from '@/lib/mappers';

export const dynamic = 'force-dynamic';

export default async function Dashboard() {
  let cinemas: any[] = [];
  let globalMetrics = { totalReviews: 0, avgRating: 0 };
  let branchAggregates: any[] = [];

  try {
    const db = await getDb();
    const cinemasColl = db.collection<Cinema>('places');
    const reviewsColl = db.collection<Review>('reviews');

    // 1. Fetch cinemas with their top 50 recent reviews
    const cinemasList = await cinemasColl.find().toArray();
    
    // We map each cinema to include its recent reviews to match the previous Prisma schema shape natively
    cinemas = await Promise.all(cinemasList.map(async (c: any) => {
        // Find reviews by place_id since that's what the raw mongo documents have
        const branchReviews = await reviewsColl.find({ place_id: c.place_id || c.placeId } as any).sort({ review_date: -1, isoDate: -1 } as any).limit(50).toArray();
        const mappedCinema = mapCinema(c);
        return {
          ...mappedCinema,
          reviews: branchReviews.map(r => mapReview(r))
        };
    }));

    // 2. Compute Global Metrics from Official Stats (Network-wide reality)
    const validCinemas = cinemasList.filter(c => (c as any).avg_rating > 0 && (c as any).total_reviews > 0);
    const totalNetworkReviews = cinemasList.reduce((acc, c: any) => acc + (c.total_reviews || 0), 0);
    const weightedSum = cinemasList.reduce((acc, c: any) => acc + ((c.avg_rating || 0) * (c.total_reviews || 0)), 0);
    
    const bg = cinemasList.find(c => ((c as any).place_name || '').includes('Bắc Giang'));
    console.log(`[DEBUG] Network Total: ${totalNetworkReviews}, Weighted Avg: ${weightedSum / totalNetworkReviews}`);
    console.log(`[DEBUG] Bắc Giang in DB: rating=${(bg as any)?.avg_rating}, total=${(bg as any)?.total_reviews}`);

    globalMetrics = {
      totalReviews: totalNetworkReviews,
      avgRating: totalNetworkReviews > 0 ? weightedSum / totalNetworkReviews : 0
    };
    
    // 3. Fetch Per-branch Aggregates from Daily Metrics (Latest snapshot for each)
    const metricsColl = db.collection('branch_daily_metrics');
    
    const branchAgg = await Promise.all(cinemasList.map(async (c: any) => {
        const pid = c.place_id || c.placeId;
        const latestMetric = await metricsColl.find({ place_id: pid }).sort({ date: -1 }).limit(1).toArray();
        
        // Base structure from places (authoritative source for headline numbers)
        const base = {
          cinemaId: pid,
          _count: { _all: c.total_reviews ?? 0 },
          _avg: { rating: c.avg_rating ?? 0 },
          sentiment_score: 0,
          density_30d: 0,
          star_distribution: null
        };

        if (latestMetric.length > 0) {
            const m = latestMetric[0];
            return {
                ...base,
                // Update with snapshot specific metrics if available
                sentiment_score: m.sentiment_score ?? 0,
                density_30d: m.density_30d ?? 0,
                star_distribution: m.star_distribution ?? null
            };
        }
        
        return base;
    }));
    
    branchAggregates = branchAgg;

  } catch (error) {
    console.error('Failed to load dashboard data:', error);
  }

  return (
    <main className="">
      <DashboardClient 
        cinemas={cinemas} 
        globalMetrics={globalMetrics} 
        branchAggregates={branchAggregates}
      />
    </main>
  );
}
