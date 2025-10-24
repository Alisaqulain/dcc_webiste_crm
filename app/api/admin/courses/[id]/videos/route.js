import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Course from '@/models/Course';
import jwt from 'jsonwebtoken';

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

export async function GET(request, { params }) {
  try {
    // Verify admin authentication
    verifyAdminToken(request);
    
    await connectDB();
    
    const { id } = await params;
    
    if (!id) {
      return NextResponse.json(
        { error: 'Course ID is required' },
        { status: 400 }
      );
    }

    const course = await Course.findById(id).select('videos title');
    
    if (!course) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      );
    }

    // Sort videos by order
    const sortedVideos = course.videos.sort((a, b) => a.order - b.order);

    return NextResponse.json({
      success: true,
      courseTitle: course.title,
      videos: sortedVideos
    });

  } catch (error) {
    console.error('Error fetching course videos:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch course videos' },
      { status: 500 }
    );
  }
}

export async function POST(request, { params }) {
  try {
    // Verify admin authentication
    verifyAdminToken(request);
    
    await connectDB();
    
    const { id } = await params;
    const body = await request.json();
    const {
      title,
      description = '',
      youtubeUrl,
      duration,
      isPreview = false
    } = body;

    // Validate required fields
    if (!title || !duration) {
      return NextResponse.json(
        { error: 'Missing required fields: title and duration are required' },
        { status: 400 }
      );
    }

    // Validate YouTube URL if provided
    if (youtubeUrl) {
      const youtubeRegex = /^https?:\/\/(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)[\w-]+/;
      if (!youtubeRegex.test(youtubeUrl)) {
        return NextResponse.json(
          { error: 'Please provide a valid YouTube URL' },
          { status: 400 }
        );
      }
    }

    const course = await Course.findById(id);
    
    if (!course) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      );
    }

    // Get the next order number
    const nextOrder = course.videos.length > 0 
      ? Math.max(...course.videos.map(v => v.order)) + 1 
      : 1;

    const newVideo = {
      title,
      description,
      youtubeUrl: youtubeUrl || undefined,
      duration,
      order: nextOrder,
      isPreview
    };

    course.videos.push(newVideo);
    await course.save();

    return NextResponse.json({
      success: true,
      message: 'Video added successfully',
      video: newVideo
    });

  } catch (error) {
    console.error('Error adding video:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to add video' },
      { status: 500 }
    );
  }
}

export async function PUT(request, { params }) {
  try {
    // Verify admin authentication
    verifyAdminToken(request);
    
    await connectDB();
    
    const { id } = await params;
    const body = await request.json();
    const { videoId, ...updateData } = body;

    if (!videoId) {
      return NextResponse.json(
        { error: 'Video ID is required' },
        { status: 400 }
      );
    }

    // Validate YouTube URL if provided
    if (updateData.youtubeUrl) {
      const youtubeRegex = /^https?:\/\/(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)[\w-]+/;
      if (!youtubeRegex.test(updateData.youtubeUrl)) {
        return NextResponse.json(
          { error: 'Please provide a valid YouTube URL' },
          { status: 400 }
        );
      }
    }

    const course = await Course.findById(id);
    
    if (!course) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      );
    }

    const videoIndex = course.videos.findIndex(v => v._id.toString() === videoId);
    
    if (videoIndex === -1) {
      return NextResponse.json(
        { error: 'Video not found' },
        { status: 404 }
      );
    }

    // Update video
    Object.assign(course.videos[videoIndex], updateData);
    await course.save();

    return NextResponse.json({
      success: true,
      message: 'Video updated successfully',
      video: course.videos[videoIndex]
    });

  } catch (error) {
    console.error('Error updating video:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update video' },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    // Verify admin authentication
    verifyAdminToken(request);
    
    await connectDB();
    
    const { id } = await params;
    const body = await request.json();
    const { videoId } = body;

    if (!videoId) {
      return NextResponse.json(
        { error: 'Video ID is required' },
        { status: 400 }
      );
    }

    const course = await Course.findById(id);
    
    if (!course) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      );
    }

    const videoIndex = course.videos.findIndex(v => v._id.toString() === videoId);
    
    if (videoIndex === -1) {
      return NextResponse.json(
        { error: 'Video not found' },
        { status: 404 }
      );
    }

    // Remove video
    course.videos.splice(videoIndex, 1);
    await course.save();

    return NextResponse.json({
      success: true,
      message: 'Video deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting video:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete video' },
      { status: 500 }
    );
  }
}
