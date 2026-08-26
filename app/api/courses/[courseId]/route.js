import connectDB from '@/lib/mongodb';
import Course from '@/models/Course';
import User from '@/models/User';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { resolvePurchasedAccess, isPreviewVideo } from '@/lib/courseAccess';
import { enrichCourseContent } from '@/lib/courseContent';
import { getAppTwinTitles, resolveLibraryCategory } from '@/lib/myPurchases';
import { stripVideosHeavyFields } from '@/lib/sanitizeVideo';

export async function GET(request, { params }) {
  try {
    await connectDB();

    const { courseId } = await params;
    const url = new URL(request.url);
    const includeVideos = url.searchParams.get('includeVideos') === 'true';

    const session = await getServerSession(authOptions);
    const { hasAccess } = await resolvePurchasedAccess(session, courseId, User);

    let course;
    if (includeVideos) {
      course = await Course.findById(courseId).lean();
      if (!course) {
        return Response.json({ message: 'Course not found' }, { status: 404 });
      }

      course = await enrichCourseContent(course);

      const totalVideoCount = course.videos?.length ?? 0;
      const totalMaterialCount = course.materials?.length ?? 0;

      if (course.videos) {
        course.videos = stripVideosHeavyFields(course.videos);
        course.videos.sort((a, b) => (a.order || 0) - (b.order || 0));
        if (!hasAccess) {
          course.videos = course.videos.filter((v) => isPreviewVideo(v));
        }
      }

      if (course.materials) {
        course.materials.sort((a, b) => (a.order || 0) - (b.order || 0));
        if (!hasAccess) {
          course.materials = course.materials.filter((m) => m.isFreePreview === true);
        }
      }

      course.totalVideoCount = totalVideoCount;
      course.totalMaterialCount = totalMaterialCount;
    } else {
      course = await Course.findById(courseId).select('-videos').lean();
      if (!course) {
        return Response.json({ message: 'Course not found' }, { status: 404 });
      }
      const full = await enrichCourseContent(
        await Course.findById(courseId).select('videos materials listingType title').lean()
      );
      course.totalVideoCount = full?.videos?.length ?? 0;
      course.totalMaterialCount = full?.materials?.length ?? 0;
    }

    const appTwinTitles = await getAppTwinTitles();
    course.libraryCategory = resolveLibraryCategory(course, appTwinTitles);

    return Response.json({ course, hasAccess });
  } catch (error) {
    console.error('Error fetching course:', error);
    return Response.json({ message: 'Error fetching course' }, { status: 500 });
  }
}
