import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const cinemas = await prisma.cinema.findMany();
  const dateStr = new Date().toISOString().split('T')[0];
  
  console.log(`Migrating metrics for ${cinemas.length} cinemas...`);
  
  for (const c of cinemas) {
    if (c.totalReviews === null || c.averageRating === null) continue;
    
    await prisma.branchDailyMetrics.upsert({
      where: {
        cinemaId_date: {
          cinemaId: c.id,
          date: dateStr,
        }
      },
      update: {
        totalReviews: c.totalReviews,
        averageRating: c.averageRating,
      },
      create: {
        cinemaId: c.id,
        date: dateStr,
        totalReviews: c.totalReviews,
        averageRating: c.averageRating,
      }
    });
  }
  
  console.log("Migration finished.");
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
