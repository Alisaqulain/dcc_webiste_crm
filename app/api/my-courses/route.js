import connectDB from '@/lib/mongodb';
import Course from '@/models/Course';
import User from '@/models/User';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { normalizeCourseIds } from '@/lib/courseAccess';
import { enrichCourseContent } from '@/lib/courseContent';

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

    const courseIds = normalizeCourseIds(user.courses);

    if (courseIds.length === 0) {
      return Response.json({ courses: [] });
    }

    const courses = await Course.find({
      _id: { $in: courseIds },
      isPublished: true
    })
    .select('title description shortDescription thumbnail price category level duration instructor rating videos materials listingType')
    .lean();

    const coursesWithVideoCount = await Promise.all(
      courses.map(async (course) => {
        const enriched = await enrichCourseContent(course);
        return {
          ...course,
          videoCount: enriched.videos?.length || 0,
          materialCount: enriched.materials?.length || 0,
          videos: undefined,
          materials: undefined,
        };
      })
    );
    return Response.json({ courses: coursesWithVideoCount });
  } catch (error) {
    console.error('Error fetching user courses:', error);
    return Response.json(
      { message: 'Error fetching courses' },
      { status: 500 }
    );
  }
}
