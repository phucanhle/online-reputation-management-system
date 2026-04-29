/**
 * scraper.ts
 * 
 * Helper functions to communicate with the FastAPI api_server.py
 */

export const API_SERVER_URL = process.env.API_SERVER_URL || 'http://localhost:8000';

export type SyncProgress = {
  cinema: string;
  status: 'loading' | 'success' | 'error';
  message?: string;
  jobId?: string;
  /** Live count of reviews scraped so far */
  reviewCount?: number;
  /** Current scraper phase: navigating, analyzing, scraped, completed, failed */
  phase?: string;
  /** Resolved place name from Google Maps */
  placeName?: string;
};

/**
 * Trigger scrape for all cinemas
 */
export async function bgTriggerAllCinemas() {
  const res = await fetch(`${API_SERVER_URL}/trigger-all`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) {
    throw new Error(`Failed to trigger all: ${await res.text()}`);
  }
  return await res.json();
}

/**
 * Trigger scrape for a specific cinema
 */
export async function bgTriggerCinema(url: string, overrides: Record<string, any> = {}) {
  const res = await fetch(`${API_SERVER_URL}/scrape`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      url,
      scrape_mode: 'update',
      headless: true,
      ...overrides
    }),
  });
  if (!res.ok) {
    throw new Error(`Failed to trigger cinema: ${await res.text()}`);
  }
  return await res.json();
}

/**
 * Get job status
 */
export async function getJobStatus(jobId: string) {
  const res = await fetch(`${API_SERVER_URL}/jobs/${jobId}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) {
    throw new Error(`Failed to get job status for ${jobId}: ${await res.text()}`);
  }
  return await res.json();
}
