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

/**
 * POST /api/admin/video-vimeo
 * 
 * Add a Vimeo video to a course
 * 
 * Body:
 * - courseId: string (required)
 * - title: string (required)
 * - description: string (optional)
 * - vimeoUrl: string (required) - Full Vimeo URL
 * - vimeoVideoId: string (required) - Extracted Vimeo video ID
 * - duration: string (required) - e.g., "15:30"
 * - isFreePreview: boolean (default: false)
 */
export async function POST(request) {
  try {
    // Verify admin authentication
    try {
      verifyAdminToken(request);
    } catch (authError) {
      return NextResponse.json(
        { error: authError.message },
        { status: 401 }
      );
    }

    await connectDB();

    const body = await request.json();
    const {
      courseId,
      title,
      description,
      vimeoUrl,
      vimeoVideoId,
      duration,
      isFreePreview
    } = body;

    // Validate required fields
    if (!courseId || !title || !vimeoUrl || !vimeoVideoId || !duration) {
      return NextResponse.json(
        { error: 'Missing required fields: courseId, title, vimeoUrl, vimeoVideoId, duration' },
        { status: 400 }
      );
    }

    // Validate Vimeo URL format
    const vimeoUrlPattern = /^https?:\/\/(www\.)?(vimeo\.com\/|player\.vimeo\.com\/video\/)\d+/;
    if (!vimeoUrlPattern.test(vimeoUrl)) {
      return NextResponse.json(
        { error: 'Invalid Vimeo URL format' },
        { status: 400 }
      );
    }

    // Find the course
    const course = await Course.findById(courseId);
    if (!course) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      );
    }

    // Get the next order number
    const nextOrder = course.videos.length > 0 
      ? Math.max(...course.videos.map(v => v.order || 0)) + 1 
      : 1;

    // Create new video object with Vimeo data
    const newVideo = {
      title,
      description: description || '',
      vimeoUrl: vimeoUrl.trim(),
      vimeoVideoId: vimeoVideoId.toString(),
      isFreePreview: isFreePreview === true,
      isPreview: isFreePreview === true, // Legacy support
      duration,
      order: nextOrder,
      createdAt: new Date()
    };

    // Add video to course
    course.videos.push(newVideo);
    await course.save();

    console.log('Vimeo video added successfully:', {
      courseId,
      videoId: newVideo._id,
      title: newVideo.title,
      vimeoVideoId: newVideo.vimeoVideoId,
      isFreePreview: newVideo.isFreePreview
    });

    return NextResponse.json({
      success: true,
      message: 'Vimeo video added successfully',
      video: {
        _id: course.videos[course.videos.length - 1]._id,
        title: newVideo.title,
        vimeoVideoId: newVideo.vimeoVideoId,
        isFreePreview: newVideo.isFreePreview
      }
    });
  } catch (error) {
    console.error('Error adding Vimeo video:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to add Vimeo video' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/video-vimeo
 * 
 * Update a Vimeo video in a course
 */
export async function PUT(request) {
  try {
    // Verify admin authentication
    try {
      verifyAdminToken(request);
    } catch (authError) {
      return NextResponse.json(
        { error: authError.message },
        { status: 401 }
      );
    }

    await connectDB();

    const body = await request.json();
    const {
      courseId,
      videoId,
      title,
      description,
      vimeoUrl,
      vimeoVideoId,
      duration,
      isFreePreview
    } = body;

    // Validate required fields
    if (!courseId || !videoId || !title || !vimeoUrl || !vimeoVideoId || !duration) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Find the course
    const course = await Course.findById(courseId);
    if (!course) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      );
    }

    // Find the video
    const videoIndex = course.videos.findIndex(v => v._id.toString() === videoId);
    if (videoIndex === -1) {
      return NextResponse.json(
        { error: 'Video not found' },
        { status: 404 }
      );
    }

    // Update video
    course.videos[videoIndex].title = title;
    course.videos[videoIndex].description = description || '';
    course.videos[videoIndex].vimeoUrl = vimeoUrl.trim();
    course.videos[videoIndex].vimeoVideoId = vimeoVideoId.toString();
    course.videos[videoIndex].isFreePreview = isFreePreview === true;
    course.videos[videoIndex].isPreview = isFreePreview === true; // Legacy support
    course.videos[videoIndex].duration = duration;

    await course.save();

    return NextResponse.json({
      success: true,
      message: 'Vimeo video updated successfully',
      video: course.videos[videoIndex]
    });
  } catch (error) {
    console.error('Error updating Vimeo video:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update Vimeo video' },
      { status: 500 }
    );
  }
}







