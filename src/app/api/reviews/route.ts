import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const cinemaId = searchParams.get('cinemaId');
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '50');
  const skip = (page - 1) * limit;

  try {
    const where = cinemaId ? { cinemaId } : {};

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where,
        orderBy: { isoDate: 'desc' } as any,
        skip,
        take: limit,
      }),
      prisma.review.count({ where }),
    ]);

    return NextResponse.json({
      reviews,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 });
  }
}
