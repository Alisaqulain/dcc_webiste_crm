import connectDB from '@/lib/mongodb';
import Course from '@/models/Course';
import User from '@/models/User';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return Response.json(
        { message: 'Authentication required' },
        { status: 401 }
      );
    }

    await connectDB();
    
    const { courseId, userId } = await request.json();

    if (!courseId || !userId) {
      return Response.json(
        { message: 'Course ID and User ID are required' },
        { status: 400 }
      );
    }

    // Verify the course exists
    const course = await Course.findById(courseId);
    if (!course) {
      return Response.json(
        { message: 'Course not found' },
        { status: 404 }
      );
    }

    // Check if user already purchased this course
    const user = await User.findById(userId);
    if (!user) {
      return Response.json(
        { message: 'User not found' },
        { status: 404 }
      );
    }

    // Check if course is already purchased
    const existingCourse = user.courses.find(c => c.courseId.toString() === courseId);
    if (existingCourse) {
      return Response.json(
        { message: 'Course already purchased' },
        { status: 400 }
      );
    }

    // Add course to user's purchased courses
    user.courses.push({
      courseId: courseId,
      purchasedAt: new Date(),
      status: 'active',
      progress: 0
    });
    await user.save();

    // Update course enrollment count
    course.enrollmentCount = (course.enrollmentCount || 0) + 1;
    await course.save();

    return Response.json({
      message: 'Course purchased successfully',
      course: {
        id: course._id,
        title: course.title,
        price: course.price
      }
    });
  } catch (error) {
    console.error('Error processing purchase:', error);
    return Response.json(
      { message: 'Error processing purchase' },
      { status: 500 }
    );
  }
}
