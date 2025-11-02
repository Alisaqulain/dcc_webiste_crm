import connectDB from '@/lib/mongodb';
import Course from '@/models/Course';
import User from '@/models/User';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return Response.json(
        { message: 'Authentication required' },
        { status: 401 }
      );
    }

    await connectDB();
    
    // Get user with purchased courses
    const user = await User.findById(session.user.id).select('courses');
    
    if (!user || !user.courses || user.courses.length === 0) {
      return Response.json({ courses: [] });
    }

    // Extract course IDs from user's courses
    const courseIds = user.courses.map(c => c.courseId);

    // Fetch course details for purchased courses
    // Include videos count but not full video data for listing page
    const courses = await Course.find({
      _id: { $in: courseIds },
      isPublished: true
    })
    .select('title description shortDescription thumbnail price category level duration instructor rating videos')
    .lean();

    // Only include video count and basic info, not full video data
    const coursesWithVideoCount = courses.map(course => ({
      ...course,
      videoCount: course.videos?.length || 0,
      videos: undefined // Remove full video data to reduce payload
    }));

    return Response.json({ courses: coursesWithVideoCount });
  } catch (error) {
    console.error('Error fetching user courses:', error);
    return Response.json(
      { message: 'Error fetching courses' },
      { status: 500 }
    );
  }
}
