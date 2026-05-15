/**
 * One-time: mark post-purchase reward coupons as shareable in MongoDB.
 * Run: node scripts/backfill-shareable-coupons.js
 */
require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI missing');
    process.exit(1);
  }
  await mongoose.connect(uri);
  const db = mongoose.connection.db;
  const res = await db.collection('coupons').updateMany(
    {
      code: { $not: /^GIFT/i },
      $or: [{ createdBy: 'user' }, { code: /P20/i }],
    },
    { $set: { isShareable: true } }
  );
  console.log('Updated coupons:', res.modifiedCount);
  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
