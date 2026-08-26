import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { storageService } from '@/lib/storage';
import { getUploadDir } from '@/lib/uploadPaths';
import { resolvePublicUrl } from '@/lib/resolvePublicUrl';
import { existsSync } from 'fs';
import { join } from 'path';

export const maxDuration = 300;
export const dynamic = 'force-dynamic';

const PDF_TYPES = ['application/pdf'];
const ZIP_TYPES = [
  'application/zip',
  'application/x-zip-compressed',
  'application/x-zip',
  'multipart/x-zip',
];
const RAR_TYPES = [
  'application/vnd.rar',
  'application/x-rar-compressed',
  'application/x-rar',
];
const MAX_MB = Number(process.env.UPLOAD_MAX_MB || 512);

function verifyAdminToken(request) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) throw new Error('No token provided');
  jwt.verify(token, process.env.NEXTAUTH_SECRET || 'your-secret-key');
}

function getDocumentKind(fileName, fileType) {
  const name = String(fileName || '').toLowerCase();
  if (PDF_TYPES.includes(fileType) || name.endsWith('.pdf')) return 'pdf';
  if (ZIP_TYPES.includes(fileType) || name.endsWith('.zip')) return 'zip';
  if (RAR_TYPES.includes(fileType) || name.endsWith('.rar')) return 'rar';
  return null;
}

function getDocumentMimeType(fileType, kind) {
  if (fileType && fileType !== 'application/octet-stream') return fileType;
  if (kind === 'zip') return 'application/zip';
  if (kind === 'rar') return 'application/vnd.rar';
  return 'application/pdf';
}

const chunkStore = new Map();

export async function POST(request) {
  try {
    verifyAdminToken(request);
  } catch {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const chunk = formData.get('chunk');
    const chunkIndex = parseInt(formData.get('chunkIndex'), 10);
    const totalChunks = parseInt(formData.get('totalChunks'), 10);
    const fileName = formData.get('fileName');
    const fileType = formData.get('fileType') || 'application/octet-stream';
    const fileSize = parseInt(formData.get('fileSize'), 10);

    if (!chunk || Number.isNaN(chunkIndex) || Number.isNaN(totalChunks) || !fileName) {
      return NextResponse.json({ success: false, message: 'Invalid chunk payload' }, { status: 400 });
    }

    const kind = getDocumentKind(fileName, fileType);
    if (chunkIndex === 0 && !kind) {
      return NextResponse.json(
        { success: false, message: 'Only PDF, ZIP, and RAR files are allowed.' },
        { status: 400 }
      );
    }

    const maxSize = MAX_MB * 1024 * 1024;
    if (fileSize > maxSize) {
      return NextResponse.json(
        { success: false, message: `File too large. Maximum size is ${MAX_MB}MB.` },
        { status: 400 }
      );
    }

    const chunkKey = `doc-${fileName}-${chunkIndex}`;
    chunkStore.set(chunkKey, chunk);

    if (chunkIndex !== totalChunks - 1) {
      return NextResponse.json({
        success: true,
        message: `Chunk ${chunkIndex + 1}/${totalChunks} received`,
        progress: ((chunkIndex + 1) / totalChunks) * 100,
      });
    }

    const chunks = [];
    for (let i = 0; i < totalChunks; i++) {
      const part = chunkStore.get(`doc-${fileName}-${i}`);
      if (!part) {
        return NextResponse.json(
          { success: false, message: `Missing chunk ${i + 1} of ${totalChunks}` },
          { status: 400 }
        );
      }
      chunks.push(part);
    }

    const completeFile = new File(chunks, fileName, { type: fileType });
    const resolvedKind = getDocumentKind(completeFile.name, completeFile.type);
    if (!resolvedKind) {
      return NextResponse.json(
        { success: false, message: 'Only PDF, ZIP, and RAR files are allowed.' },
        { status: 400 }
      );
    }

    const originalIsServerless = storageService.isServerless;
    storageService.isServerless = false;

    try {
      const result = await storageService.uploadFile(completeFile, 'uploads');
      storageService.isServerless = originalIsServerless;

      if (!result.isDataUrl) {
        const filepath = join(getUploadDir('uploads'), result.filename);
        if (!existsSync(filepath)) {
          throw new Error('Upload failed — file not found on disk.');
        }
      }

      for (let i = 0; i < totalChunks; i++) {
        chunkStore.delete(`doc-${fileName}-${i}`);
      }

      const publicUrl = result.isDataUrl
        ? result.url
        : resolvePublicUrl(result.url, request);

      return NextResponse.json({
        success: true,
        url: publicUrl,
        filename: result.filename,
        originalName: fileName,
        size: result.size || completeFile.size,
        mimeType: getDocumentMimeType(fileType, resolvedKind),
        fileType: resolvedKind,
        message: 'Document uploaded successfully',
      });
    } catch (uploadError) {
      storageService.isServerless = originalIsServerless;
      throw uploadError;
    }
  } catch (error) {
    console.error('Chunked document upload error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Upload failed' },
      { status: 500 }
    );
  }
}
