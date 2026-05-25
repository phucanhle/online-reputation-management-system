/**
 * src/lib/config/config.ts
 * Centralized, validated environment configuration.
 */

export interface Config {
  mongodbUri: string;
  apiServerUrl: string;
  isDev: boolean;
  isProd: boolean;
}

function getEnv(key: string, defaultValue?: string): string {
  const val = process.env[key] || defaultValue;
  if (val === undefined) {
    throw new Error(`Configuration Error: Missing environment variable '${key}'.`);
  }
  return val;
}

export const config: Config = {
  mongodbUri: getEnv('MONGODB_URI'),
  apiServerUrl: getEnv('API_SERVER_URL', 'https://server-crawl.lpa.io.vn'),
  isDev: process.env.NODE_ENV === 'development',
  isProd: process.env.NODE_ENV === 'production',
};
