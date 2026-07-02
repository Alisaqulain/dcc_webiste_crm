import Lead from '@/models/Lead';

let indexesEnsured = false;

/** Drop legacy TTL index that deleted all leads (including approved/paid). */
export async function ensureLeadIndexes() {
  if (indexesEnsured) return;

  const collection = Lead.collection;
  const indexes = await collection.indexes();
  const legacyTtl = indexes.find(
    (idx) =>
      idx.key?.createdAt === 1 &&
      idx.expireAfterSeconds === 2592000 &&
      !idx.partialFilterExpression
  );

  if (legacyTtl?.name) {
    await collection.dropIndex(legacyTtl.name);
  }

  await Lead.syncIndexes();
  indexesEnsured = true;
}
