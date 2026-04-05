import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { removeUserCrmFileEntry } from '@/lib/services/crmFilePersist';

function verifyAdminToken(request) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) throw new Error('No token provided');
  jwt.verify(token, process.env.NEXTAUTH_SECRET || 'your-secret-key');
  return true;
}

export async function POST(request) {
  try {
    verifyAdminToken(request);
  } catch (e) {
    return NextResponse.json({ message: e.message || 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const userId = body.userId;
    const fileId = body.fileId;
    const fileUrl = typeof body.fileUrl === 'string' ? body.fileUrl.trim() : '';
    const legacyOnly = body.legacy === true;

    if (!userId) {
      return NextResponse.json({ message: 'userId is required' }, { status: 400 });
    }

    if (!legacyOnly && !fileId && !fileUrl) {
      return NextResponse.json(
        { message: 'fileId, fileUrl, or legacy: true is required' },
        { status: 400 }
      );
    }

    await removeUserCrmFileEntry(userId, {
      fileId,
      fileUrl,
      legacy: legacyOnly,
    });

    return NextResponse.json({ ok: true, message: 'File removed' });
  } catch (error) {
    console.error('CRM file delete error:', error);
    const status = error.statusCode || 500;
    return NextResponse.json(
      { message: error.message || 'Delete failed' },
      { status }
    );
  }
}
