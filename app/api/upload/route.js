import { NextRequest, NextResponse } from 'next/server';
import { storageService } from '@/lib/storage';

export async function POST(request) {
  try {
    const data = await request.formData();
    const file = data.get('file');

    if (!file) {
      return NextResponse.json({ success: false, message: 'No file uploaded' });
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ 
        success: false, 
        message: 'Invalid file type. Only images are allowed.' 
      });
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return NextResponse.json({ 
        success: false, 
        message: 'File size too large. Maximum size is 5MB.' 
      });
    }

    // Upload file using storage service
    const result = await storageService.uploadFile(file, 'uploads');

    return NextResponse.json({
      success: true,
      url: result.url,
      filename: result.filename,
      isDataUrl: result.isDataUrl,
      size: result.size
    });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { success: false, message: 'Upload failed: ' + error.message },
      { status: 500 }
    );
  }
}
