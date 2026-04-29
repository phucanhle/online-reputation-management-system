const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env' });
async function run() {
  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  const db = client.db('reviews');
  const collections = await db.listCollections().toArray();
  console.log('Collections:', collections.map(c => c.name));
  
  if (collections.some(c => c.name === 'places')) {
    const count = await db.collection('places').countDocuments();
    console.log('Places count:', count);
    const place = await db.collection('places').findOne();
    console.log('Sample place:', place);
  }
  client.close();
}
run().catch(console.dir);
