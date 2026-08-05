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
const ZIP_TYPES = [
  'application/zip',
  'application/x-zip-compressed',
  'application/x-zip',
  'multipart/x-zip',
];
const MAX_MB = Number(process.env.UPLOAD_MAX_MB || 20);

function getDocumentKind(file) {
  const name = String(file.name || '').toLowerCase();
  if (PDF_TYPES.includes(file.type) || name.endsWith('.pdf')) return 'pdf';
  if (ZIP_TYPES.includes(file.type) || name.endsWith('.zip')) return 'zip';
  return null;
}

function getDocumentMimeType(file, kind) {
  if (file.type) return file.type;
  return kind === 'zip' ? 'application/zip' : 'application/pdf';
}

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

    const kind = getDocumentKind(file);
    if (!kind) {
      return NextResponse.json(
        { success: false, message: 'Only PDF and ZIP files are allowed.' },
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
          throw new Error(`${kind.toUpperCase()} upload failed — file not found on disk.`);
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
        mimeType: getDocumentMimeType(file, kind),
        fileType: kind,
      });
    } catch (uploadError) {
      storageService.isServerless = originalIsServerless;
      throw uploadError;
    }
  } catch (error) {
    console.error('Document upload error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Upload failed' },
      { status: 500 }
    );
  }
}
