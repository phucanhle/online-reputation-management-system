import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function main() {
  const jsonPath = path.join(process.cwd(), '..', 'lotte_cinema_reviews.json');
  
  if (!fs.existsSync(jsonPath)) {
    console.error(`Error: JSON file not found at ${jsonPath}`);
    return;
  }

  console.log("Reading JSON data...");
  const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  console.log(`Found ${data.length} cinemas in JSON.`);

  for (const cinemaData of data) {
    console.log(`Processing cinema: ${cinemaData.cinemaName || cinemaData.placeId}`);
    
    // 1. Upsert Cinema
    const cinema = await prisma.cinema.upsert({
      where: { placeId: cinemaData.placeId },
      update: {
        name: cinemaData.cinemaName,
        totalReviews: cinemaData.totalReviews || 0,
        averageRating: cinemaData.averageRating || 0,
      },
      create: {
        placeId: cinemaData.placeId,
        name: cinemaData.cinemaName,
        totalReviews: cinemaData.totalReviews || 0,
        averageRating: cinemaData.averageRating || 0,
      },
    });

    console.log(`- Cinema ${cinema.name} ready. Importing ${cinemaData.reviews?.length || 0} reviews...`);

    // 2. Batch Create Reviews
    const reviews = cinemaData.reviews || [];
    let count = 0;
    
    for (const r of reviews) {
      if (!r.review_id) continue;

      try {
        await prisma.review.upsert({
          where: { reviewId: r.review_id },
          update: {
             rating: r.rating || 0,
             text: r.snippet || r.extracted_snippet?.original || "",
             translated: r.extracted_snippet?.translated || "",
             authorName: r.user?.name || "Unknown",
             authorThumbnail: r.user?.thumbnail || null,
             authorLink: r.user?.link || null,
             contributorId: r.user?.contributor_id || null,
             localGuide: r.user?.local_guide || false,
             likes: r.likes || 0,
             link: r.link || null,
             source: r.source || "Google",
             date: r.date || "",
             isoDate: r.iso_date ? new Date(r.iso_date) : null,
             position: r.position || null,
          },
          create: {
             reviewId: r.review_id,
             cinemaId: cinema.id,
             rating: r.rating || 0,
             text: r.snippet || r.extracted_snippet?.original || "",
             translated: r.extracted_snippet?.translated || "",
             authorName: r.user?.name || "Unknown",
             authorThumbnail: r.user?.thumbnail || null,
             authorLink: r.user?.link || null,
             contributorId: r.user?.contributor_id || null,
             localGuide: r.user?.local_guide || false,
             likes: r.likes || 0,
             link: r.link || null,
             source: r.source || "Google",
             date: r.date || "",
             isoDate: r.iso_date ? new Date(r.iso_date) : null,
             position: r.position || null,
          }
        });
        count++;
      } catch (err) {
        console.error(`  - Failed to import review ${r.review_id}:`, err);
      }
    }
    console.log(`  - Successfully imported ${count} reviews for ${cinema.name}`);
  }

  console.log("Seeding complete!");
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
