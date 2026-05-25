/**
 * src/app/api/health/route.ts
 * Next.js API Route for monitoring database connectivity and scraper API server status.
 */

import { NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';
import { config } from '@/lib/config/config';
import { logger } from '@/lib/services/logger';

export const dynamic = 'force-dynamic';

export async function GET() {
  const healthStatus: {
    status: 'UP' | 'DOWN';
    timestamp: string;
    services: {
      database: { status: 'UP' | 'DOWN'; latencyMs?: number; error?: string };
      scraper_backend: { status: 'UP' | 'DOWN'; error?: string };
    };
  } = {
    status: 'UP',
    timestamp: new Date().toISOString(),
    services: {
      database: { status: 'DOWN' },
      scraper_backend: { status: 'DOWN' }
    }
  };

  // 1. Check MongoDB connectivity
  const dbStart = Date.now();
  try {
    const db = await getDb();
    await db.command({ ping: 1 });
    healthStatus.services.database = {
      status: 'UP',
      latencyMs: Date.now() - dbStart
    };
  } catch (err) {
    healthStatus.status = 'DOWN';
    healthStatus.services.database = {
      status: 'DOWN',
      error: err instanceof Error ? err.message : String(err)
    };
    logger.error('[HealthCheck] Database status check failed.', err);
  }

  // 2. Check Crawler backend connectivity
  try {
    const scraperPing = await fetch(config.apiServerUrl, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(3000) // 3s timeout
    });
    
    healthStatus.services.scraper_backend = {
      status: scraperPing.ok ? 'UP' : 'DOWN',
      error: scraperPing.ok ? undefined : `HTTP status ${scraperPing.status}`
    };
    if (!scraperPing.ok) {
      healthStatus.status = 'DOWN';
    }
  } catch (err) {
    healthStatus.status = 'DOWN';
    healthStatus.services.scraper_backend = {
      status: 'DOWN',
      error: err instanceof Error ? err.message : String(err)
    };
    logger.warn('[HealthCheck] Scraper backend connectivity check failed.', { error: String(err) });
  }

  const responseCode = healthStatus.status === 'UP' ? 200 : 503;
  return NextResponse.json(healthStatus, { status: responseCode });
}
