/**
 * src/app/api/scrape/route.ts
 * Next.js API Route for triggering and monitoring Google Maps crawl operations.
 */

import { NextResponse } from 'next/server';
import { ScraperService, ScraperJobStatus } from '@/lib/services/scraperService';
import { MetricsService, SyncProgressUpdate } from '@/lib/services/metricsService';
import { config } from '@/lib/config/config';
import { logger } from '@/lib/services/logger';

export const dynamic = 'force-dynamic';

const POLL_INTERVAL = 3000;

interface TargetCinemaInput {
  id?: string;
  name?: string;
  url?: string;
}

export async function POST(req: Request) {
  const encoder = new TextEncoder();
  
  let body: { cinemas?: TargetCinemaInput[]; officialOnly?: boolean } = {};
  try {
    body = await req.json();
  } catch (err) {
    logger.warn('[API/Scrape] Failed to parse request body.', { error: String(err) });
  }

  const { cinemas = [], officialOnly = false } = body;

  const stream = new ReadableStream({
    async start(controller) {
      const send = (p: SyncProgressUpdate) => {
        controller.enqueue(encoder.encode(JSON.stringify(p) + '\n'));
      };

      try {
        const isExplicitAll = cinemas.length === 0;
        const targets = isExplicitAll ? [{ url: '', name: 'Tất cả', id: '' }] : cinemas;
        
        let pendingJobIds: { jobId: string; name: string }[] = [];

        // 1. Trigger jobs for all targets
        for (const target of targets) {
          const cinemaName = target.name || 'Unknown';
          const actionMsg = officialOnly ? 'Đang cập nhật thông số nhanh...' : 'Đang đặt lịch cào dữ liệu...';
          send({ cinema: cinemaName, status: 'loading', message: actionMsg });
          
          let resolvedUrl = target.url || '';
          
          // Lookup database URL from Crawler backend if not provided locally
          if (!resolvedUrl && target.id) {
            try {
              const placeRes = await fetch(`${config.apiServerUrl}/places/${encodeURIComponent(target.id)}`);
              if (placeRes.ok) {
                const placeData = await placeRes.json();
                resolvedUrl = placeData.original_url || placeData.resolved_url || '';
              }
            } catch (e) {
              logger.warn(`[API/Scrape] Could not resolve url for place ${target.id}`, { error: String(e) });
            }

            if (!resolvedUrl) {
              // Construct fallback Google Maps search link as last resort
              resolvedUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(cinemaName)}&query_place_id=${encodeURIComponent(target.id)}`;
              logger.info(`[API/Scrape] Fallback URL constructed for ${cinemaName}: ${resolvedUrl}`);
            }
          }

          if (!resolvedUrl && isExplicitAll) {
            const res = await ScraperService.triggerAll();
            if (res.details && res.details.length > 0) {
              res.details.forEach((d: any) => {
                if (d.job_id) {
                  pendingJobIds.push({ jobId: d.job_id, name: `Tất cả (${d.url})` });
                }
              });
            }
          } else if (!resolvedUrl) {
            send({ cinema: cinemaName, status: 'error', message: 'Không thể xác định URL. Hãy kiểm tra dữ liệu chi nhánh.' });
          } else {
            const res = await ScraperService.triggerCinema(resolvedUrl, officialOnly ? { official_only: true } : {});
            if (res.job_id) {
              pendingJobIds.push({ jobId: res.job_id, name: cinemaName });
            }
          }
        }

        // 2. Poll progress of pending scraper jobs
        while (pendingJobIds.length > 0) {
          const checkJobIds = [...pendingJobIds];
          pendingJobIds = []; // reset queue to accumulate active jobs

          for (const job of checkJobIds) {
            try {
              const statusRes: ScraperJobStatus = await ScraperService.getJobStatus(job.jobId);
              const currentStatus = statusRes.status;
              const progress = statusRes.progress || {};
              
              if (currentStatus === 'completed') {
                const reviewCount = statusRes.reviews_count || 0;
                send({ 
                  cinema: job.name, 
                  status: 'success', 
                  message: `Hoàn tất (cập nhật ${reviewCount} reviews)`,
                  jobId: job.jobId
                });
              } else if (currentStatus === 'failed' || currentStatus === 'cancelled') {
                send({ 
                  cinema: job.name, 
                  status: 'error', 
                  message: `Lỗi: ${statusRes.error_message || 'Đã bị huỷ'}`,
                  jobId: job.jobId
                });
              } else {
                // Job is running or pending - determine progress message
                const phase = progress.stage || (currentStatus === 'running' ? 'running' : 'pending');
                const reviewCount = progress.count || 0;
                
                let msg = 'Đang đợi tới lượt...';
                switch (phase) {
                  case 'navigating':
                    msg = '🔗 Đang kết nối tới Google Maps...';
                    break;
                  case 'analyzing':
                    msg = `🔍 Đã định vị: ${progress.message?.replace('Located Node: ', '') || job.name}`;
                    break;
                  case 'scraped':
                    msg = `📥 Đang cào dữ liệu — ${reviewCount} reviews`;
                    break;
                  case 'initializing':
                  case 'starting':
                    msg = '⚙️ Đang khởi tạo scraper...';
                    break;
                  case 'retrying':
                    msg = `🔄 Đang thử lại... ${progress.message || ''}`;
                    break;
                  case 'alert':
                    msg = `⚠️ ${progress.message || 'Cảnh báo'}`;
                    break;
                  default:
                    msg = currentStatus === 'running' ? 'Đang thực thi...' : 'Đang đợi tới lượt...';
                }
                
                send({ 
                  cinema: job.name, 
                  status: 'loading', 
                  message: msg, 
                  jobId: job.jobId
                });
                pendingJobIds.push(job); // re-queue active job
              }
            } catch (err) {
              logger.error(`[API/Scrape] Failed polling job status for ${job.name}`, err);
              send({ cinema: job.name, status: 'error', message: 'Lỗi kiểm tra tiến trình' });
            }
          }

          if (pendingJobIds.length > 0) {
            await new Promise(r => setTimeout(r, POLL_INTERVAL));
          }
        }

        // 3. Recalculate and update daily snapshot metrics
        send({ cinema: 'System', status: 'loading', message: 'Đang tổng hợp dữ liệu thống kê...' });
        await MetricsService.runMetricsAggregation((progressUpdate) => send(progressUpdate));

        send({ cinema: 'System', status: 'success', message: 'Tất cả các phiên đồng bộ đã hoàn tất!' });
        controller.close();
      } catch (err) {
        logger.error('[API/Scrape] Scrape operation pipeline crashed', err);
        send({ cinema: 'System', status: 'error', message: err instanceof Error ? err.message : String(err) });
        controller.close();
      }
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'application/x-ndjson',
      'Cache-Control': 'no-cache',
    }
  });
}
