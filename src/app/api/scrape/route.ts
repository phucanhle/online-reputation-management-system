import { runScraper, SyncProgress } from '@/lib/scraper';

export const dynamic = 'force-dynamic';

export async function POST() {
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
        async start(controller) {
            const sendUpdate = (p: SyncProgress) => {
                controller.enqueue(encoder.encode(JSON.stringify(p) + '\n'));
            };

            try {
                await runScraper(sendUpdate);
                controller.close();
            } catch (err) {
                const error = err as Error;
                controller.enqueue(encoder.encode(JSON.stringify({ error: error.message }) + '\n'));
                controller.close();
            }
        },
    });

    return new Response(stream, {
        headers: {
            'Content-Type': 'application/x-ndjson',
            'Cache-Control': 'no-cache',
        },
    });
}
