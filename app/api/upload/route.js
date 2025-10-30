import { NextRequest, NextResponse } from 'next/server';
import { storageService } from '@/lib/storage';

// Set max duration for uploads
export const maxDuration = 60; // 1 minute

export async function POST(request) {
  try {
    console.log('Upload API: Request received');
    
    const data = await request.formData();
    const file = data.get('file');

    if (!file) {
      console.error('Upload API: No file in request');
      return NextResponse.json({ success: false, message: 'No file uploaded' });
    }

    console.log('Upload API: File received', {
      name: file.name,
      type: file.type,
      size: file.size,
      sizeMB: (file.size / (1024 * 1024)).toFixed(2)
    });

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      console.error('Upload API: Invalid file type', file.type);
      return NextResponse.json({ 
        success: false, 
        message: 'Invalid file type. Only images are allowed.' 
      });
    }

    // Validate file size (configurable, default 20MB for KVM)
    const maxMb = Number(process.env.UPLOAD_MAX_MB || 20);
    const maxSize = maxMb * 1024 * 1024;
    if (file.size > maxSize) {
      console.error('Upload API: File too large', file.size);
      return NextResponse.json({ 
        success: false, 
        message: `File size too large. Maximum size is ${maxMb}MB.` 
      });
    }

    // Upload file using storage service
    console.log('Upload API: Starting storage service upload...');
    const result = await storageService.uploadFile(file, 'uploads');
    
    console.log('Upload API: Upload successful', {
      url: result.url,
      filename: result.filename,
      isDataUrl: result.isDataUrl,
      size: result.size
    });

    return NextResponse.json({
      success: true,
      url: result.url,
      filename: result.filename,
      isDataUrl: result.isDataUrl,
      size: result.size
    });

  } catch (error) {
    console.error('Upload API: Error occurred', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    return NextResponse.json(
      { success: false, message: 'Upload failed: ' + error.message },
      { status: 500 }
    );
  }
}
