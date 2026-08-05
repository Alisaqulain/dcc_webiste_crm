import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { NextResponse } from 'next/server';
import { resolvePurchasedAccess } from '@/lib/courseAccess';
import { resolveCourseMedia } from '@/lib/courseContent';

export async function GET(request, { params }) {
  try {
    await connectDB();

    const { courseId, materialId } = await params;
    const resolved = await resolveCourseMedia(courseId, { materialId });

    if (!resolved?.course) {
      return NextResponse.json({ message: 'Course not found' }, { status: 404 });
    }

    const material = resolved.material;
    if (!material) {
      return NextResponse.json({ message: 'File not found' }, { status: 404 });
    }

    const isFree = material.isFreePreview === true;
    if (!isFree) {
      const session = await getServerSession(authOptions);
      if (!session?.user) {
        return NextResponse.json({ message: 'Login required to download this file' }, { status: 401 });
      }

      const { hasAccess } = await resolvePurchasedAccess(session, courseId, User);
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
