import { PrismaClient } from '@prisma/client';

import { getJson } from 'serpapi';

const prisma = new PrismaClient();
const API_KEY = process.env.SERP_API_KEY || process.env.API_KEY || "";

function chunkArray<T>(array: T[], size: number): T[][] {
    const chunked: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
        chunked.push(array.slice(i, i + size));
    }
    return chunked;
}

export type SyncProgress = { cinema: string, status: 'loading' | 'success' | 'error', message?: string };

export async function runScraper(onProgress?: (p: SyncProgress) => void) {
    console.log("Starting scrape...");
    
    // 1. Fetch cinemas from Database instead of CSV
    const branches = await prisma.cinema.findMany({
        select: { name: true, placeId: true },
    });

    if (branches.length === 0) {
        throw new Error("No branches found in database to scrape. Please ensure the Cinema table has data.");
    }

    console.log(`Loaded ${branches.length} branches from Database.`);

    let totalNewReviews = 0;
    let totalSkippedReviews = 0;

    const batches = chunkArray(branches, 5);

    for (let i = 0; i < batches.length; i++) {
        const batch = batches[i];
        console.log(`Processing Batch ${i + 1} of ${batches.length}...`);

        const batchPromises = batch.map(async (branch) => {
            if (onProgress) onProgress({ cinema: branch.name, status: 'loading' });
            try {
                // Ensure cinema exists in DB with latest stats from Google
                const response = await getJson({
                    engine: "google_maps_reviews",
                    place_id: branch.placeId,
                    hl: "en",
                    sort_by: "newestFirst",
                    api_key: API_KEY
                });

                const totalReviewsCount = response.place_info?.reviews || response.search_information?.total_results || 0;
                
                // Robust extraction: some results might have rating as string or in different place
                let avgRating = 0;
                const rawRating = response.place_info?.rating;
                if (rawRating !== undefined && rawRating !== null) {
                    avgRating = typeof rawRating === 'string' ? parseFloat(rawRating) : Number(rawRating);
                }
                
                if (isNaN(avgRating)) avgRating = 0;

                const safeName = branch.name || response.place_info?.title || `Unknown Cinema (${branch.placeId})`;
                console.log(`[DATA] ${safeName}: Official Google Rating = ${avgRating}, Total Reviews = ${totalReviewsCount}`);

                // 3. Upsert cinema (Static Dimension)
                const cinema = await prisma.cinema.upsert({
                    where: { placeId: branch.placeId },
                    update: { 
                        name: safeName
                    },
                    create: { 
                        placeId: branch.placeId, 
                        name: safeName
                    },
                });

                const dateStr = new Date().toISOString().split('T')[0];

                // 4. Upsert daily metrics snapshot (Fact Table - 1 record per day per cinema)
                await prisma.branchDailyMetrics.upsert({
                    where: {
                        cinemaId_date: {
                            cinemaId: cinema.id,
                            date: dateStr,
                        }
                    },
                    update: {
                        totalReviews: totalReviewsCount,
                        averageRating: avgRating
                    },
                    create: {
                        cinemaId: cinema.id,
                        date: dateStr,
                        totalReviews: totalReviewsCount,
                        averageRating: avgRating
                    }
                });

                const reviews = response.reviews || [];
                let newCount = 0;
                let skipCount = 0;

                for (const r of reviews) {
                    if (!r.review_id) continue;
                    
                    const existing = await prisma.review.findUnique({
                        where: { reviewId: r.review_id }
                    });

                    if (existing) {
                        // Update existing review stats like "likes" if they changed
                        await prisma.review.update({
                            where: { reviewId: r.review_id },
                            data: {
                                likes: r.likes || 0,
                                rating: r.rating || 0,
                            }
                        });
                        skipCount++;
                    } else {
                        await prisma.review.create({
                            data: {
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
                        newCount++;
                    }
                }

                if (onProgress) onProgress({ cinema: branch.name, status: 'success' });
                return { cinema: branch.name, newCount, skipCount, error: false };
            } catch (err) {
                const e = err as Error;
                console.error(`Error processing ${branch.name}:`, e.message);
                if (onProgress) onProgress({ cinema: branch.name, status: 'error', message: e.message });
                return { cinema: branch.name, newCount: 0, skipCount: 0, error: true, message: e.message };
            }
        });

        const results = await Promise.all(batchPromises);
        results.forEach(res => {
            if (!res.error) {
                console.log(`- ${res.cinema}: Added ${res.newCount}, Skipped ${res.skipCount} duplicates.`);
                totalNewReviews += res.newCount;
                totalSkippedReviews += res.skipCount;
            } else {
                console.log(`- ${res.cinema}: Error - ${res.message}`);
            }
        });

        if (i < batches.length - 1) {
            await new Promise(res => setTimeout(res, 2000));
        }
    }

    return { totalNewReviews, totalSkippedReviews };
}
