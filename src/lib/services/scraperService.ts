/**
 * src/lib/services/scraperService.ts
 * Scraper/Crawler Integration Service with retries and logging.
 */

import { config } from '@/lib/config/config';
import { logger } from '@/lib/services/logger';

export interface ScraperJobProgress {
  stage?: string;
  count?: number;
  message?: string;
}

export interface ScraperJobStatus {
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  progress?: ScraperJobProgress;
  reviews_count?: number;
  error_message?: string;
}

export class ScraperService {
  private static baseUrl = config.apiServerUrl;

  /**
   * Helper to perform fetches with basic retry/backoff logic for resilience.
   */
  private static async fetchWithRetry(url: string, options: RequestInit, retries = 3, delay = 1000): Promise<Response> {
    try {
      const response = await fetch(url, options);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${await response.text()}`);
      }
      return response;
    } catch (err) {
      if (retries > 0) {
        logger.warn(`[Scraper] Request failed, retrying in ${delay}ms...`, { url, retriesLeft: retries, error: String(err) });
        await new Promise(res => setTimeout(res, delay));
        return this.fetchWithRetry(url, options, retries - 1, delay * 2);
      }
      logger.error(`[Scraper] Request failed after maximum retries.`, err, { url });
      throw err;
    }
  }

  /**
   * Trigger scraping for all branches.
   */
  public static async triggerAll(): Promise<{ details: { url: string; job_id?: string }[] }> {
    logger.info('[Scraper] Triggering scrapes for all branches...');
    const res = await this.fetchWithRetry(`${this.baseUrl}/trigger-all`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    return await res.json();
  }

  /**
   * Trigger scraping for a specific branch.
   */
  public static async triggerCinema(url: string, overrides: Record<string, any> = {}): Promise<{ job_id: string }> {
    logger.info('[Scraper] Triggering single cinema scrape...', { url, overrides });
    const res = await this.fetchWithRetry(`${this.baseUrl}/scrape`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url,
        scrape_mode: 'update',
        headless: true,
        ...overrides,
      }),
    });
    return await res.json();
  }

  /**
   * Get job progress or status.
   */
  public static async getJobStatus(jobId: string): Promise<ScraperJobStatus> {
    const res = await this.fetchWithRetry(`${this.baseUrl}/jobs/${jobId}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    return await res.json();
  }
}
