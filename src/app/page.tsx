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

    // 2. Fetch Global Aggregates
    const globalAgg = await reviewsColl.aggregate([
      {
        $group: {
          _id: null,
          totalReviews: { $sum: 1 },
          avgRating: { $avg: '$rating' }
        }
      }
    ]).toArray();
    
    if (globalAgg.length > 0) {
      globalMetrics = {
        totalReviews: globalAgg[0].totalReviews || 0,
        avgRating: globalAgg[0].avgRating || 0
      };
    }

    // 3. Fetch Per-branch Aggregates
    const branchAgg = await reviewsColl.aggregate([
      {
        $group: {
          _id: '$place_id',
          totalReviews: { $sum: 1 },
          avgRating: { $avg: '$rating' }
        }
      },
      {
        $project: {
          _id: 0,
          cinemaId: '$_id',
          _count: { _all: '$totalReviews' },
          _avg: { rating: '$avgRating' }
        }
      }
    ]).toArray();
    
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
