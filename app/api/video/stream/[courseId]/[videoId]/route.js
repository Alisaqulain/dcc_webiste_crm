import { NextResponse } from 'next/server';
import { readFile, stat } from 'fs/promises';
import { join } from 'path';
import connectDB from '@/lib/mongodb';
import Course from '@/models/Course';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request, { params }) {
  try {
    const { courseId, videoId } = await params;
    const { searchParams } = new URL(request.url);
    const range = request.headers.get('range');

    // Check if user is authenticated
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    await connectDB();

    // Find course and video
    const course = await Course.findById(courseId);
    if (!course) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      );
    }

    const video = course.videos.find(v => v._id.toString() === videoId);
    if (!video) {
      return NextResponse.json(
        { error: 'Video not found' },
        { status: 404 }
      );
    }

    // Check if user has access to this course
    // You can add additional access control logic here
    // For now, we'll assume authenticated users have access

    const videoPath = join(process.cwd(), 'public', video.videoPath);
    
    try {
      const stats = await stat(videoPath);
      const fileSize = stats.size;
      const start = range ? parseInt(range.replace(/\D/g, '')) : 0;
      const end = Math.min(start + 1024 * 1024, fileSize - 1); // 1MB chunks
      const contentLength = end - start + 1;

      const file = await readFile(videoPath, { start, end });
      
      const headers = {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': contentLength.toString(),
        'Content-Type': video.mimeType || 'video/mp4',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        // Security headers to prevent screenshots/recording
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode=block',
        'Referrer-Policy': 'no-referrer',
        // Custom headers for video protection
        'X-Video-Protected': 'true',
        'X-Download-Options': 'noopen',
        'X-Permitted-Cross-Domain-Policies': 'none'
      };

      return new NextResponse(file, {
        status: range ? 206 : 200,
        headers
      });

    } catch (error) {
      console.error('Error reading video file:', error);
      return NextResponse.json(
        { error: 'Video file not found' },
        { status: 404 }
      );
    }

  } catch (error) {
    console.error('Video streaming error:', error);
    return NextResponse.json(
      { error: 'Failed to stream video' },
      { status: 500 }
    );
  }
}
