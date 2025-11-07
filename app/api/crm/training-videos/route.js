import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Course from '@/models/Course';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export async function GET(request) {
  try {
    await connectDB();
    
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return Response.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Find user
    let user = null;
    if (session.user.id) {
      user = await User.findById(session.user.id);
    } else if (session.user.email) {
      user = await User.findOne({ email: session.user.email });
    }

    if (!user) {
      return Response.json({ message: 'User not found' }, { status: 404 });
    }

    // Get user's purchased courses
    const courseIds = user.courses.map(c => c.courseId);
    
    // Get courses with videos
    const courses = await Course.find({
      _id: { $in: courseIds },
      'videos.0': { $exists: true } // Has at least one video
    })
    .select('title thumbnail videos')
    .lean();

    // Flatten all videos from all courses
    const allVideos = [];
    courses.forEach(course => {
      course.videos.forEach(video => {
        allVideos.push({
          id: video._id?.toString() || Math.random().toString(),
          title: video.title,
          description: video.description || '',
          youtubeUrl: video.youtubeUrl || '',
          duration: video.duration || '0:00',
          courseTitle: course.title,
          courseThumbnail: course.thumbnail,
          order: video.order || 0,
          isPreview: video.isPreview || false
        });
      });
    });

    // Sort by course and order
    allVideos.sort((a, b) => {
      if (a.courseTitle !== b.courseTitle) {
        return a.courseTitle.localeCompare(b.courseTitle);
      }
      return (a.order || 0) - (b.order || 0);
    });

    return Response.json({ 
      videos: allVideos,
      courses: courses.map(c => ({
        id: c._id,
        title: c.title,
        thumbnail: c.thumbnail,
        videoCount: c.videos.length
      }))
    });
  } catch (error) {
    console.error('Error fetching training videos:', error);
    return Response.json({ 
      message: 'Error fetching training videos',
      error: error.message 
    }, { status: 500 });
  }
}

