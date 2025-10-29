import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Course from '@/models/Course';
import jwt from 'jsonwebtoken';
import { storageService } from '@/lib/storage';
import mongoose from 'mongoose';

// App Router: Set max duration for large uploads (optional, defaults vary by platform)
export const maxDuration = 300; // 5 minutes

// Verify admin token
const verifyAdminToken = (request) => {
  const token = request.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) {
    throw new Error('No token provided');
  }
  try {
    const decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET || 'your-secret-key');
    return decoded;
  } catch (error) {
    throw new Error('Invalid token');
  }
};

// In-memory chunk storage for the request lifecycle
// Note: This works for single function invocations
// For better reliability, consider using Redis or S3 for production
const chunkStore = new Map();

export async function POST(request) {
  try {
    console.log('Chunked video upload request started');
    
    // Verify admin authentication
    try {
      verifyAdminToken(request);
    } catch (authError) {
      return NextResponse.json(
        { error: authError.message },
        { status: 401 }
      );
    }

    // Connect to database
    await connectDB();
    console.log('Database connected');

    const formData = await request.formData();
    const chunk = formData.get('chunk');
    const chunkIndex = parseInt(formData.get('chunkIndex'));
    const totalChunks = parseInt(formData.get('totalChunks'));
    const fileName = formData.get('fileName');
    const fileType = formData.get('fileType');
    const fileSize = parseInt(formData.get('fileSize'));
    const courseId = formData.get('courseId');
    const title = formData.get('title');
    const description = formData.get('description');
    const duration = formData.get('duration');
    const isPreview = formData.get('isPreview') === 'true';

    console.log('Chunk data received:', {
      chunkIndex,
      totalChunks,
      fileName,
      fileType,
      fileSize,
      courseId,
      title,
      description,
      duration,
      isPreview,
      hasChunk: !!chunk,
      chunkSize: chunk?.size || 0
    });

    console.log('Chunk received:', {
      chunkIndex,
      totalChunks,
      fileName,
      fileType,
      fileSize,
      chunkSize: chunk.size,
      courseId,
      hasMetadata: !!(courseId && title && duration)
    });

    // Validate required fields are present
    if (chunkIndex === 0 && (!courseId || !title || !duration)) {
      console.error('Missing required metadata on first chunk:', {
        hasCourseId: !!courseId,
        hasTitle: !!title,
        hasDuration: !!duration
      });
      return NextResponse.json(
        { error: 'Missing required fields: courseId, title, and duration are required' },
        { status: 400 }
      );
    }

    // Store chunk
    const chunkKey = `${fileName}-${chunkIndex}`;
    chunkStore.set(chunkKey, {
      data: chunk,
      index: chunkIndex,
      fileName,
      fileType,
      fileSize,
      courseId,
      title,
      description,
      duration,
      isPreview
    });

    // If this is the last chunk, combine all chunks
    if (chunkIndex === totalChunks - 1) {
      console.log('Last chunk received, combining chunks...');
      
      // Combine all chunks
      const chunks = [];
      for (let i = 0; i < totalChunks; i++) {
        const key = `${fileName}-${i}`;
        const chunkData = chunkStore.get(key);
        if (!chunkData) {
          throw new Error(`Missing chunk ${i}`);
        }
        chunks.push(chunkData.data);
      }

      // Create the complete file
      const completeFile = new File(chunks, fileName, { type: fileType });
      console.log('Complete file created:', {
        name: completeFile.name,
        size: completeFile.size,
        type: completeFile.type
      });

      // Get the first chunk data for metadata
      const firstChunk = chunkStore.get(`${fileName}-0`);
      
      // Upload using storage service
      const videoUploadResult = await storageService.uploadFile(completeFile, 'videos');
      
      // Create video data structure
      const videoData = {
        fileName: videoUploadResult.filename,
        mimeType: completeFile.type,
        size: completeFile.size,
        url: videoUploadResult.url,
        isDataUrl: videoUploadResult.isDataUrl
      };

      // Handle thumbnail if provided
      let thumbnailData = null;
      const thumbnailFile = formData.get('thumbnail');
      if (thumbnailFile && thumbnailFile.size > 0) {
        try {
          const thumbnailUploadResult = await storageService.uploadFile(thumbnailFile, 'thumbnails');
          thumbnailData = {
            fileName: thumbnailUploadResult.filename,
            mimeType: thumbnailFile.type,
            size: thumbnailFile.size,
            url: thumbnailUploadResult.url,
            isDataUrl: thumbnailUploadResult.isDataUrl
          };
        } catch (thumbnailError) {
          console.error('Error processing thumbnail:', thumbnailError);
        }
      }

      // Find the course
      const course = await Course.findById(courseId);
      if (!course) {
        return NextResponse.json(
          { error: 'Course not found' },
          { status: 404 }
        );
      }

      // Get next order number
      const nextOrder = course.videos.length > 0 
        ? Math.max(...course.videos.map(v => v.order || 0)) + 1 
        : 1;

      // Create new video object
      const newVideo = {
        title: firstChunk.title,
        description: firstChunk.description || '',
        videoData: videoData,
        thumbnailData: thumbnailData,
        duration: firstChunk.duration,
        order: nextOrder,
        isPreview: firstChunk.isPreview,
        uploadedAt: new Date(),
        fileSize: completeFile.size,
        mimeType: completeFile.type
      };

      console.log('Creating new video:', {
        title: newVideo.title,
        description: newVideo.description,
        duration: newVideo.duration,
        hasVideoData: !!newVideo.videoData
      });

      // Add video to course
      course.videos.push(newVideo);
      await course.save();

      // Clean up chunks
      for (let i = 0; i < totalChunks; i++) {
        chunkStore.delete(`${fileName}-${i}`);
      }

      console.log('Video uploaded successfully via chunked upload');
      return NextResponse.json({
        success: true,
        message: 'Video uploaded successfully',
        video: newVideo
      });
    }

    // Return success for chunk received
    return NextResponse.json({
      success: true,
      message: `Chunk ${chunkIndex + 1}/${totalChunks} received`,
      progress: ((chunkIndex + 1) / totalChunks) * 100
    });

  } catch (error) {
    console.error('Chunked video upload error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to upload video' },
      { status: 500 }
    );
  }
}
