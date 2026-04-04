import { PrismaClient } from '@prisma/client';
import DashboardClient from '@/components/DashboardClient';

const prisma = new PrismaClient();

export default async function Dashboard() {
  let cinemas: any[] = [];

  try {
    cinemas = await prisma.cinema.findMany({
      include: {
        reviews: {
          orderBy: { isoDate: 'desc' },
          take: 50
        },
        metrics: {
          orderBy: { date: 'asc' }
        }
      }
    });
  } catch (error) {
    console.error('Failed to load reviews from Prisma:', error);
  }

  return (
    <main className="">
      <DashboardClient cinemas={cinemas} />
    </main>
  );
}
