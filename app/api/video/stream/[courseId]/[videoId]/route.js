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

    // Handle different video storage methods
    if (video.videoData && (video.videoData.data || video.videoData.url)) {
      // Video stored in database (base64 or URL)
      try {
        let videoBuffer;
        
        if (video.videoData.data) {
          // Legacy base64 data
          videoBuffer = Buffer.from(video.videoData.data, 'base64');
        } else if (video.videoData.url) {
          if (video.videoData.isDataUrl) {
            // Data URL
            const base64Data = video.videoData.url.split(',')[1];
            videoBuffer = Buffer.from(base64Data, 'base64');
          } else {
            // File URL - read from file system
            const videoPath = join(process.cwd(), 'public', video.videoData.url);
            videoBuffer = await readFile(videoPath);
          }
        }
        
        const fileSize = videoBuffer.length;
        const start = range ? parseInt(range.replace(/\D/g, '')) : 0;
        const end = Math.min(start + 1024 * 1024, fileSize - 1); // 1MB chunks
        const contentLength = end - start + 1;

        const chunk = videoBuffer.slice(start, end + 1);
        
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

        return new NextResponse(chunk, {
          status: range ? 206 : 200,
          headers
        });

      } catch (error) {
        console.error('Error processing video data:', error);
        return NextResponse.json(
          { error: 'Error processing video data' },
          { status: 500 }
        );
      }
    } else if (video.videoPath) {
      // Video stored as file (legacy support)
      try {
        const videoPath = join(process.cwd(), 'public', video.videoPath);
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
    } else {
      return NextResponse.json(
        { error: 'Video data not found' },
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
