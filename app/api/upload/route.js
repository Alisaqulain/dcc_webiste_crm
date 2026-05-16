import { NextResponse } from 'next/server';
import { storageService } from '@/lib/storage';
import { getUploadDir } from '@/lib/uploadPaths';
import { resolvePublicUrl } from '@/lib/resolvePublicUrl';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

const IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

function allowDataUrlFallback() {
  return process.env.UPLOAD_FALLBACK_DATA_URL !== '0';
}

async function uploadAsDataUrl(file) {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const base64 = buffer.toString('base64');
  const dataUrl = `data:${file.type};base64,${base64}`;
  return {
    success: true,
    url: dataUrl,
    filename: file.name,
    isDataUrl: true,
    size: buffer.length,
    storageMode: 'data-url-fallback',
  };
}

export async function POST(request) {
  try {
    const data = await request.formData();
    const file = data.get('file');

    if (!file) {
      return NextResponse.json({ success: false, message: 'No file uploaded' });
    }

    if (!IMAGE_TYPES.includes(file.type)) {
      return NextResponse.json({
        success: false,
        message: 'Invalid file type. Only JPG, PNG, GIF, and WebP images are allowed.',
      });
    }

    const maxMb = Number(process.env.UPLOAD_MAX_MB || 20);
    const maxSize = maxMb * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json({
        success: false,
        message: `File size too large. Maximum size is ${maxMb}MB.`,
      });
    }

    const originalIsServerless = storageService.isServerless;
    storageService.isServerless = false;

    try {
      const result = await storageService.uploadFile(file, 'uploads');
      storageService.isServerless = originalIsServerless;

      if (!result.isDataUrl) {
        const { existsSync } = await import('fs');
        const { join } = await import('path');
        const filepath = join(getUploadDir('uploads'), result.filename);

        if (!existsSync(filepath)) {
          if (allowDataUrlFallback() && file.size <= 3 * 1024 * 1024) {
            const fallback = await uploadAsDataUrl(file);
            return NextResponse.json({
              ...fallback,
              url: fallback.url,
              warning:
                'Saved as embedded image (disk write failed). Set public/uploads permissions on the server for normal file uploads.',
            });
          }
          throw new Error(
            'File upload succeeded but file was not found on disk. Check public/uploads permissions on WHM (chmod 755).'
          );
        }
      }

      const publicUrl = result.isDataUrl
        ? result.url
        : resolvePublicUrl(result.url, request);

      return NextResponse.json({
        success: true,
        url: publicUrl,
        filename: result.filename,
        isDataUrl: result.isDataUrl,
        size: result.size,
      });
    } catch (uploadError) {
      storageService.isServerless = originalIsServerless;

      const fsCodes = ['EACCES', 'EROFS', 'ENOENT', 'EPERM'];
      const canFallback =
        allowDataUrlFallback() &&
        file.size <= 3 * 1024 * 1024 &&
        (fsCodes.includes(uploadError.code) ||
          /filesystem|permission|write/i.test(uploadError.message));

      if (canFallback) {
        const fallback = await uploadAsDataUrl(file);
        return NextResponse.json({
          ...fallback,
          warning:
            'Image stored in database (server uploads folder not writable). Fix: chmod 755 public/uploads on WHM or set UPLOAD_DIR in .env.',
        });
      }

      throw uploadError;
    }
  } catch (error) {
    console.error('Upload API error:', error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Upload failed',
        hint:
          'On WHM/cPanel: ensure public/uploads exists and is writable (755). Or set UPLOAD_FALLBACK_DATA_URL=1 in .env.',
      },
      { status: 500 }
    );
  }
}
