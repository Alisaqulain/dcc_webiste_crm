import connectDB from '@/lib/mongodb';
import mongoose from 'mongoose';
import { persistUserCrmFilesState } from '@/lib/services/crmFilePersist';
import { storageService } from '@/lib/storage';

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Remove CRM file subdocuments older than maxAgeDays; delete local files when possible.
 * Uses the native Mongo driver via persistUserCrmFilesState (same as admin delete).
 */
export async function cleanupExpiredCrmFiles(maxAgeDays = 30) {
  const cutoff = new Date(Date.now() - maxAgeDays * DAY_MS);
  let usersTouched = 0;
  let filesRemoved = 0;

  await connectDB();
  const col = mongoose.connection.db.collection('users');

  const users = await col
    .find({
      $or: [
        { crmFiles: { $elemMatch: { uploadedAt: { $lt: cutoff } } } },
        { 'crmFile.uploadedAt': { $lt: cutoff }, 'crmFile.url': { $exists: true, $ne: '' } },
      ],
    })
    .toArray();

  for (const user of users) {
    const uid = user._id;
    let keep = [];
    let removedThisUser = 0;

    for (const f of user.crmFiles || []) {
      const uploaded = f.uploadedAt ? new Date(f.uploadedAt) : null;
      if (uploaded && uploaded < cutoff && f.url) {
        try {
          const r = await storageService.deletePublicPath(f.url);
          if (r.deleted) removedThisUser += 1;
        } catch {
          /* still drop metadata */
        }
      } else {
        keep.push(f);
      }
    }

    const leg = user.crmFile;
    if (leg?.url && leg.uploadedAt && new Date(leg.uploadedAt) < cutoff) {
      try {
        const r = await storageService.deletePublicPath(leg.url);
        if (r.deleted) removedThisUser += 1;
      } catch {
        /* ignore */
      }
      keep = keep.filter((f) => f.url !== leg.url);
    }

    const prevCount = (user.crmFiles || []).length;
    const legacyExpired = !!(leg?.uploadedAt && new Date(leg.uploadedAt) < cutoff);
    const changed = keep.length !== prevCount || legacyExpired;

    if (changed) {
      await persistUserCrmFilesState(uid, keep);
      usersTouched += 1;
      filesRemoved += removedThisUser;
    }
  }

  return { usersTouched, filesRemoved };
}
