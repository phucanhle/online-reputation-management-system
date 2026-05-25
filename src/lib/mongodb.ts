import { MongoClient, Db } from 'mongodb';
import dns from 'dns';
import { config } from '@/lib/config/config';
import { logger } from '@/lib/services/logger';

// Set DNS servers for SRV record resolutions in node environments where default servers fail
try {
  dns.setServers(['8.8.8.8', '8.8.4.4']);
  logger.info('[DB] Custom DNS servers set successfully.');
} catch (err) {
  logger.warn('[DB] Failed to set custom DNS servers, relying on environment defaults.', { error: String(err) });
}

const uri = config.mongodbUri;
const options = {};

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

if (!uri) {
  throw new Error('Please add your Mongo URI to .env');
}

logger.info('[DB] Initializing MongoDB connection client...');

if (config.isDev) {
  // Use global client preservation in dev for HMR (Hot Module Replacement)
  const globalWithMongo = global as typeof globalThis & {
    _mongoClientPromise?: Promise<MongoClient>;
  };

  if (!globalWithMongo._mongoClientPromise) {
    client = new MongoClient(uri, options);
    globalWithMongo._mongoClientPromise = client.connect()
      .then((conn) => {
        logger.info('[DB] MongoDB client connected successfully in development (HMR).');
        return conn;
      })
      .catch((err) => {
        logger.error('[DB] MongoDB connection failed in development', err);
        throw err;
      });
  }
  clientPromise = globalWithMongo._mongoClientPromise;
} else {
  client = new MongoClient(uri, options);
  clientPromise = client.connect()
    .then((conn) => {
      logger.info('[DB] MongoDB client connected successfully in production.');
      return conn;
    })
    .catch((err) => {
      logger.error('[DB] MongoDB connection failed in production', err);
      throw err;
    });
}

export default clientPromise;

export async function getDb(): Promise<Db> {
  const client = await clientPromise;
  // Use DB name from connection string or default to 'reviews'
  return client.db('reviews');
}
