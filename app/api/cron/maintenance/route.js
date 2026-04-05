import connectDB from '@/lib/mongodb';
import { cleanupExpiredCrmFiles } from '@/lib/services/crmFileCleanup';

/**
 * Scheduled maintenance: CRM file TTL-style cleanup.
 * Leads use MongoDB TTL index on createdAt (no action here).
 *
 * Call with header: Authorization: Bearer <CRON_SECRET>
 * Or query: ?secret=<CRON_SECRET> (for simple uptime pingers)
 */
export async function GET(request) {
  const secret =
    request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ||
    new URL(request.url).searchParams.get('secret');
  const expected = process.env.CRON_SECRET;

  if (!expected || secret !== expected) {
    return Response.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    await connectDB();
    const crm = await cleanupExpiredCrmFiles(30);
    return Response.json({
      ok: true,
      crmUsersUpdated: crm.usersTouched,
      crmFilesRemoved: crm.filesRemoved,
      note: 'Leads expire via MongoDB TTL index on createdAt (30 days).',
    });
  } catch (e) {
    console.error('Cron maintenance error:', e);
    return Response.json({ message: e.message || 'Maintenance failed' }, { status: 500 });
  }
}
