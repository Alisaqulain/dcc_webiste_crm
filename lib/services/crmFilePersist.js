import connectDB from '@/lib/mongodb';
import mongoose from 'mongoose';

/**
 * Write CRM file fields with the native driver so admin uploads (native) and deletes stay consistent.
 */
export async function persistUserCrmFilesState(userId, nextFiles) {
  await connectDB();
  const col = mongoose.connection.db.collection('users');
  const oid = new mongoose.Types.ObjectId(String(userId));
  const now = new Date();

  const serialized = (nextFiles || []).map((f) => {
    const doc = {
      filename: f.filename,
      originalName: f.originalName,
      url: f.url,
      uploadedAt: f.uploadedAt ? new Date(f.uploadedAt) : f.uploadedAt,
      size: f.size,
      type: f.type,
      downloaded: f.downloaded === true,
      downloadedAt: f.downloadedAt ? new Date(f.downloadedAt) : f.downloadedAt,
    };
    if (f._id != null) {
      doc._id =
        f._id instanceof mongoose.Types.ObjectId
          ? f._id
          : new mongoose.Types.ObjectId(String(f._id));
    }
    return doc;
  });

  if (!serialized.length) {
    await col.updateOne(
      { _id: oid },
      {
        $set: {
          crmFiles: [],
          crmFileDownloaded: false,
          crmFileDownloadedAt: null,
          updatedAt: now,
        },
        $unset: { crmFile: '' },
      }
    );
    return;
  }

  const last = serialized[serialized.length - 1];
  await col.updateOne(
    { _id: oid },
    {
      $set: {
        crmFiles: serialized,
        crmFile: {
          filename: last.filename,
          originalName: last.originalName,
          url: last.url,
          uploadedAt: last.uploadedAt,
          size: last.size,
          type: last.type,
        },
        updatedAt: now,
      },
    }
  );
}

/**
 * Remove one CRM file by subdocument _id or url, or legacy-only crmFile. Deletes are persisted natively.
 */
export async function removeUserCrmFileEntry(userId, { fileId, fileUrl, legacy }) {
  await connectDB();
  const col = mongoose.connection.db.collection('users');
  const oid = new mongoose.Types.ObjectId(String(userId));
  const user = await col.findOne({ _id: oid });
  if (!user) {
    const err = new Error('User not found');
    err.statusCode = 404;
    throw err;
  }

  const { storageService } = await import('@/lib/storage');

  if (legacy) {
    const leg = user.crmFile;
    if (!leg?.url) {
      const err = new Error('No legacy CRM file to remove');
      err.statusCode = 404;
      throw err;
    }
    try {
      await storageService.deletePublicPath(leg.url);
    } catch {
      /* still drop metadata */
    }
    const remaining = (user.crmFiles || []).filter((f) => f.url !== leg.url);
    await persistUserCrmFilesState(userId, remaining);
    return { ok: true };
  }

  const url = typeof fileUrl === 'string' ? fileUrl.trim() : '';
  let files = [...(user.crmFiles || [])];

  let idx = -1;
  if (fileId && mongoose.Types.ObjectId.isValid(String(fileId))) {
    const target = new mongoose.Types.ObjectId(String(fileId));
    idx = files.findIndex(
      (f) => f._id && new mongoose.Types.ObjectId(String(f._id)).equals(target)
    );
  }
  if (idx < 0 && url) {
    idx = files.findIndex((f) => f.url === url);
  }

  if (idx < 0 && url && user.crmFile?.url === url && files.length === 0) {
    try {
      await storageService.deletePublicPath(url);
    } catch {
      /* continue */
    }
    await persistUserCrmFilesState(userId, []);
    return { ok: true };
  }

  if (idx < 0) {
    const err = new Error('File not found on user');
    err.statusCode = 404;
    throw err;
  }

  const [removed] = files.splice(idx, 1);
  if (removed?.url) {
    try {
      await storageService.deletePublicPath(removed.url);
    } catch {
      /* still drop metadata */
    }
  }

  await persistUserCrmFilesState(userId, files);
  return { ok: true };
}
