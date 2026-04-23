const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);
const { MongoClient } = require('mongodb');

async function run() {
  const client = new MongoClient('mongodb+srv://Vercel-Admin-reviews:H07yaOQ8zCa6u1b0@reviews.uvnjanm.mongodb.net/?retryWrites=true&w=majority');
  await client.connect();
  const db = client.db('reviews');
  const agg = await db.collection('reviews').aggregate([
    {
      $group: {
        _id: '$place_id',
        company: { $first: '$company' },
        avg_rating: { $avg: '$rating' },
        total_reviews: { $sum: 1 }
      }
    }
  ]).toArray();
  console.log(JSON.stringify(agg, null, 2));
  await client.close();
}

run().catch(console.error);
