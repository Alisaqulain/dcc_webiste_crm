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
    const courses = await Course.find({
      _id: { $in: courseIds },
      isPublished: true
    })
    .select('-videos') // Exclude videos for performance
    .lean();

    return Response.json({ courses });
  } catch (error) {
    console.error('Error fetching user courses:', error);
    return Response.json(
      { message: 'Error fetching courses' },
      { status: 500 }
    );
  }
}
