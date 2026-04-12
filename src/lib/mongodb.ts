import { MongoClient } from 'mongodb';
import dns from 'dns';

// Proactively fix DNS resolution issues for MongoDB SRV records
dns.setServers(['8.8.8.8', '8.8.4.4']);

const uri = process.env.MONGODB_URI as string;
const options = {};

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

if (!process.env.MONGODB_URI) {
  throw new Error('Please add your Mongo URI to .env');
}

console.log(`[DB] Attempting connection to MongoDB cluster...`);

if (process.env.NODE_ENV === 'development') {
  // In development mode, use a global variable so that the value
  // is preserved across module reloads caused by HMR (Hot Module Replacement).
  let globalWithMongo = global as typeof globalThis & {
    _mongoClientPromise?: Promise<MongoClient>;
  };

  if (!globalWithMongo._mongoClientPromise) {
    client = new MongoClient(uri, options);
    globalWithMongo._mongoClientPromise = client.connect();
  }
  clientPromise = globalWithMongo._mongoClientPromise;
} else {
  // In production mode, it's best to not use a global variable.
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

// Export a module-scoped MongoClient promise.
export default clientPromise;

export async function getDb() {
  const client = await clientPromise;
  // Explicitly connect to the 'reviews_clean' database cluster
  return client.db('reviews');
}
