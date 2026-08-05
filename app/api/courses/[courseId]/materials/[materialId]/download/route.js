import connectDB from '@/lib/mongodb';
import Course from '@/models/Course';
import User from '@/models/User';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function GET(request, { params }) {
  try {
    await connectDB();

    const { courseId, materialId } = await params;
    const course = await Course.findById(courseId).select('materials title').lean();
    if (!course) {
      return NextResponse.json({ message: 'Course not found' }, { status: 404 });
    }

    const material = course.materials?.find((m) => m._id.toString() === materialId);
    if (!material) {
      return NextResponse.json({ message: 'File not found' }, { status: 404 });
    }

    const isFree = material.isFreePreview === true;
    if (!isFree) {
      const session = await getServerSession(authOptions);
      if (!session?.user?.id) {
        return NextResponse.json({ message: 'Login required to download this file' }, { status: 401 });
      }

      const user = await User.findById(session.user.id).select('courses').lean();
      const hasAccess = user?.courses?.some(
        (c) => c.courseId && c.courseId.toString() === courseId
      );
      if (!hasAccess) {
        return NextResponse.json(
          { message: 'Purchase this course to download study materials' },
          { status: 403 }
        );
      }
    }

    const fileUrl = material.fileUrl;
    if (!fileUrl) {
      return NextResponse.json({ message: 'File not available' }, { status: 404 });
    }

    return NextResponse.redirect(fileUrl, 302);
  } catch (error) {
    console.error('Material download error:', error);
    return NextResponse.json({ message: 'Download failed' }, { status: 500 });
  }
}
