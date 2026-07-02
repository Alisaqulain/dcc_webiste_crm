import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { storageService } from '@/lib/storage';
import { getUploadDir } from '@/lib/uploadPaths';
import { resolvePublicUrl } from '@/lib/resolvePublicUrl';
import { existsSync } from 'fs';
import { join } from 'path';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

const PDF_TYPES = ['application/pdf'];
const MAX_MB = Number(process.env.UPLOAD_MAX_MB || 20);

function verifyAdminToken(request) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) throw new Error('No token provided');
  jwt.verify(token, process.env.NEXTAUTH_SECRET || 'your-secret-key');
}

export async function POST(request) {
  try {
    verifyAdminToken(request);
  } catch {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const data = await request.formData();
    const file = data.get('file');

    if (!file) {
      return NextResponse.json({ success: false, message: 'No file uploaded' }, { status: 400 });
    }

    const isPdf =
      PDF_TYPES.includes(file.type) || String(file.name || '').toLowerCase().endsWith('.pdf');
    if (!isPdf) {
      return NextResponse.json(
        { success: false, message: 'Only PDF files are allowed.' },
        { status: 400 }
      );
    }

    const maxSize = MAX_MB * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { success: false, message: `File too large. Maximum size is ${MAX_MB}MB.` },
        { status: 400 }
      );
    }

    const originalIsServerless = storageService.isServerless;
    storageService.isServerless = false;

    try {
      const result = await storageService.uploadFile(file, 'uploads');
      storageService.isServerless = originalIsServerless;

      if (!result.isDataUrl) {
        const filepath = join(getUploadDir('uploads'), result.filename);
        if (!existsSync(filepath)) {
          throw new Error('PDF upload failed — file not found on disk.');
        }
      }

      const publicUrl = result.isDataUrl
        ? result.url
        : resolvePublicUrl(result.url, request);

      return NextResponse.json({
        success: true,
        url: publicUrl,
        filename: result.filename,
        originalName: file.name,
        size: result.size || file.size,
        mimeType: file.type || 'application/pdf',
      });
    } catch (uploadError) {
      storageService.isServerless = originalIsServerless;
      throw uploadError;
    }
  } catch (error) {
    console.error('PDF upload error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Upload failed' },
      { status: 500 }
    );
  }
}
