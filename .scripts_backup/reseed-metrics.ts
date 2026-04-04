import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function main() {
  // Look for JSON in current dir and parent then root
  let jsonPath = path.join(process.cwd(), 'lotte_cinema_reviews.json');
  if (!fs.existsSync(jsonPath)) {
    jsonPath = path.join(process.cwd(), '..', 'lotte_cinema_reviews.json');
  }
  
  if (!fs.existsSync(jsonPath)) {
    console.error("Could not find lotte_cinema_reviews.json in current or parent dir.");
    process.exit(1);
  }

  const rawData = fs.readFileSync(jsonPath, 'utf-8');
  const cinemasData = JSON.parse(rawData);
  const dateStr = new Date().toISOString().split('T')[0];

  console.log(`Re-seeding metrics for ${cinemasData.length} cinemas from ${jsonPath}...`);

  for (const branch of cinemasData) {
    const dbCinema = await prisma.cinema.findUnique({
      where: { placeId: branch.placeId }
    });

    if (!dbCinema) continue;

    await prisma.branchDailyMetrics.upsert({
      where: {
        cinemaId_date: {
          cinemaId: dbCinema.id,
          date: dateStr,
        }
      },
      update: {
        totalReviews: branch.totalReviews || 0,
        averageRating: branch.averageRating || 0,
      },
      create: {
        cinemaId: dbCinema.id,
        date: dateStr,
        totalReviews: branch.totalReviews || 0,
        averageRating: branch.averageRating || 0,
      }
    });
  }

  console.log("Success: Fact-table metrics re-seeded.");
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
