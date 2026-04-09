import { PrismaClient } from '@prisma/client';
import DashboardClient from '@/components/DashboardClient';

const prisma = new PrismaClient();

export default async function Dashboard() {
  let cinemas: any[] = [];
  let globalMetrics = { totalReviews: 0, avgRating: 0 };
  let branchAggregates: any[] = [];

  try {
    // 1. Fetch cinemas
    cinemas = await prisma.cinema.findMany({
      include: {
        reviews: {
          orderBy: { isoDate: 'desc' } as any,
          take: 50
        }
      }
    });

    // 2. Fetch Global Aggregates (53k+ reviews)
    const globalAgg: any = await prisma.review.aggregate({
      _count: { _all: true },
      _avg: { rating: true }
    });
    
    globalMetrics = {
      totalReviews: globalAgg._count._all || 0,
      avgRating: globalAgg._avg.rating || 0
    };

    // 3. Fetch Per-branch Aggregates
    const branchAgg: any = await prisma.review.groupBy({
      by: ['cinemaId'],
      _count: { _all: true },
      _avg: { rating: true }
    } as any);
    branchAggregates = branchAgg as any[];

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
