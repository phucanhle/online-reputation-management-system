import { bgTriggerAllCinemas, bgTriggerCinema, getJobStatus, SyncProgress } from '@/lib/scraper';

export const dynamic = 'force-dynamic';

// Polling interval in ms
const POLL_INTERVAL = 3000;

export async function POST(req: Request) {
  const encoder = new TextEncoder();
  const { cinemas, officialOnly } = await req.json().catch(() => ({ cinemas: [], officialOnly: false }));

  const stream = new ReadableStream({
    async start(controller) {
      const send = (p: SyncProgress) => {
        controller.enqueue(encoder.encode(JSON.stringify(p) + '\n'));
      };

      try {
        const targets = cinemas && cinemas.length > 0 ? cinemas : [{ url: null, name: 'Tất cả' }];
        
        let pendingJobIds: { jobId: string, name: string }[] = [];

        // 1. Trigger jobs
        for (const target of targets) {
          const cinemaName = target.name || 'Unknown';
          const actionMsg = officialOnly ? 'Đang cập nhật thông số nhanh...' : 'Đang đặt lịch cào dữ liệu...';
          send({ cinema: cinemaName, status: 'loading', message: actionMsg });
          
          if (!target.url) {
            // trigger all (FastAPI trigger-all doesn't support overrides easily yet, 
            // but we usually trigger selected ones from UI)
            const res = await bgTriggerAllCinemas();
            if (res.details && res.details.length > 0) {
                res.details.forEach((d: any) => {
                    if(d.job_id) pendingJobIds.push({ jobId: d.job_id, name: `Tất cả (${d.url})` });
                });
            }
          } else {
            // trigger single with potential officialOnly flag
            const res = await bgTriggerCinema(target.url, officialOnly ? { official_only: true } : {});
            if (res.job_id) {
              pendingJobIds.push({ jobId: res.job_id, name: cinemaName });
            }
          }
        }

        // 2. Poll jobs until completion
        while (pendingJobIds.length > 0) {
          const checkJobIds = [...pendingJobIds];
          pendingJobIds = []; // clear and only add back unfinished ones

          for (const job of checkJobIds) {
            try {
              const statusRes = await getJobStatus(job.jobId);
              const currentStatus = statusRes.status; // pending, running, completed, failed, cancelled
              
              if (currentStatus === 'completed') {
                 const reviewCount = statusRes.reviews_count || 0;
                 send({ cinema: job.name, status: 'success', message: `Hoàn tất (cập nhật ${reviewCount} reviews)` });
              } else if (currentStatus === 'failed' || currentStatus === 'cancelled') {
                 send({ cinema: job.name, status: 'error', message: `Lỗi: ${statusRes.error_message || 'Đã bị huỷ'}` });
              } else {
                 // still running or pending
                 let msg = currentStatus === 'running' ? 'Đang thực thi...' : 'Đang đợi tới lượt...';
                 if (statusRes.progress && statusRes.progress.phase) {
                     msg += ` (${statusRes.progress.phase})`;
                 }
                 send({ cinema: job.name, status: 'loading', message: msg, jobId: job.jobId });
                 pendingJobIds.push(job);
              }
            } catch (err) {
              console.error(`Failed to poll status for job ${job.jobId}`, err);
              send({ cinema: job.name, status: 'error', message: `Lỗi kiểm tra tiến trình` });
              // We drop it from pendingJobIds to avoid infinite loop on broken job
            }
          }

          if (pendingJobIds.length > 0) {
             // Wait before next polling
             await new Promise(r => setTimeout(r, POLL_INTERVAL));
          }
        }

        // 3. Tính lại metrics từ dữ liệu mới
        send({ cinema: 'System', status: 'loading', message: 'Đang tổng hợp dữ liệu thống kê...' });
        const { runMetricsAggregation } = await import('@/lib/metrics');
        await runMetricsAggregation((p) => send(p));

        send({ cinema: 'System', status: 'success', message: 'Tất cả các phiên đồng bộ đã hoàn tất!' });
        controller.close();

      } catch (err) {
        const error = err as Error;
        console.error('[/api/scrape] Error:', error.message);
        controller.enqueue(
          encoder.encode(JSON.stringify({
            cinema: 'System',
            status: 'error',
            message: error.message
          }) + '\n')
        );
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
