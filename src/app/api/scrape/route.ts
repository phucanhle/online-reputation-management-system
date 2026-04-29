import { bgTriggerAllCinemas, bgTriggerCinema, getJobStatus, SyncProgress, API_SERVER_URL } from '@/lib/scraper';

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
        // Determine if user explicitly requested "all" (no specific cinemas provided)
        const isExplicitAll = !cinemas || cinemas.length === 0;
        const targets = isExplicitAll ? [{ url: null, name: 'Tất cả', id: null }] : cinemas;
        
        let pendingJobIds: { jobId: string, name: string }[] = [];

        // 1. Trigger jobs
        for (const target of targets) {
          const cinemaName = target.name || 'Unknown';
          const actionMsg = officialOnly ? 'Đang cập nhật thông số nhanh...' : 'Đang đặt lịch cào dữ liệu...';
          send({ cinema: cinemaName, status: 'loading', message: actionMsg });
          
          // Resolve URL: if url is empty but place_id (id) is available,
          // look it up from the Python backend's SQLite database
          let resolvedUrl = target.url || '';
          if (!resolvedUrl && target.id) {
            try {
              const placeRes = await fetch(`${API_SERVER_URL}/places/${encodeURIComponent(target.id)}`);
              if (placeRes.ok) {
                const placeData = await placeRes.json();
                resolvedUrl = placeData.original_url || placeData.resolved_url || '';
              }
            } catch (e) {
              console.warn(`Could not resolve URL for place ${target.id}:`, e);
            }

            // Last resort: construct a Google Maps search URL from place_id
            if (!resolvedUrl && target.id) {
              resolvedUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(cinemaName)}&query_place_id=${encodeURIComponent(target.id)}`;
              console.log(`Constructed fallback URL for ${cinemaName}: ${resolvedUrl}`);
            }
          }

          if (!resolvedUrl && isExplicitAll) {
            // Only trigger all when user explicitly requested "all" (no cinemas selected)
            const res = await bgTriggerAllCinemas();
            if (res.details && res.details.length > 0) {
                res.details.forEach((d: any) => {
                    if(d.job_id) pendingJobIds.push({ jobId: d.job_id, name: `Tất cả (${d.url})` });
                });
            }
          } else if (!resolvedUrl) {
            // Specific cinema selected but no URL could be resolved — report error
            send({ cinema: cinemaName, status: 'error', message: 'Không thể xác định URL. Hãy kiểm tra dữ liệu chi nhánh.' });
          } else {
            // trigger single with potential officialOnly flag
            const res = await bgTriggerCinema(resolvedUrl, officialOnly ? { official_only: true } : {});
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
              const progress = statusRes.progress || {};
              
              if (currentStatus === 'completed') {
                 const reviewCount = statusRes.reviews_count || 0;
                 send({ 
                   cinema: job.name, 
                   status: 'success', 
                   message: `Hoàn tất (cập nhật ${reviewCount} reviews)`,
                   reviewCount,
                   phase: 'completed',
                 });
              } else if (currentStatus === 'failed' || currentStatus === 'cancelled') {
                 send({ 
                   cinema: job.name, 
                   status: 'error', 
                   message: `Lỗi: ${statusRes.error_message || 'Đã bị huỷ'}`,
                   phase: 'failed',
                 });
              } else {
                 // still running or pending — forward rich progress
                 const phase = progress.stage || (currentStatus === 'running' ? 'running' : 'pending');
                 const reviewCount = progress.count || 0;
                 
                 // Build a descriptive Vietnamese message based on scraper phase
                 let msg: string;
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
                   jobId: job.jobId,
                   reviewCount,
                   phase,
                   placeName: progress.message?.replace('Located Node: ', ''),
                 });
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
