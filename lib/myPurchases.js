import connectDB from '@/lib/mongodb';
import Course from '@/models/Course';
import User from '@/models/User';
import { normalizeCourseIds } from '@/lib/courseAccess';
import { enrichCourseContent } from '@/lib/courseContent';

/** Published app titles — used to classify same-title course twins as apps. */
export async function getAppTwinTitles() {
  const apps = await Course.find({
    listingType: 'app',
    isPublished: true,
  })
    .select('title')
    .lean();
  return new Set(apps.map((a) => a.title?.trim()).filter(Boolean));
}

export function resolveLibraryCategory(record, appTwinTitles) {
  if (!record) return 'course';
  if (record.listingType === 'app') return 'app';
  const title = record.title?.trim();
  if (title && appTwinTitles.has(title)) return 'app';
  return 'course';
}

export async function getUserPurchasedListings(session, listingType = 'course') {
  if (!session?.user?.id) {
    return { items: [], error: 'Authentication required', status: 401 };
  }

  await connectDB();

  const user = await User.findById(session.user.id).select('courses');
  if (!user?.courses?.length) {
    return { items: [], error: null, status: 200 };
  }

  const courseIds = normalizeCourseIds(user.courses);
  if (courseIds.length === 0) {
    return { items: [], error: null, status: 200 };
  }

  const records = await Course.find({
    _id: { $in: courseIds },
    isPublished: true,
  })
    .select(
      'title description shortDescription thumbnail price category level duration instructor rating videos materials listingType'
    )
    .lean();

  const appTwinTitles = await getAppTwinTitles();
  const targetCategory = listingType === 'app' ? 'app' : 'course';
  const filtered = records.filter(
    (record) => resolveLibraryCategory(record, appTwinTitles) === targetCategory
  );

  const items = await Promise.all(
    filtered.map(async (record) => {
      const enriched = await enrichCourseContent(record);
      return {
        ...record,
        videoCount: enriched.videos?.length || 0,
        materialCount: enriched.materials?.length || 0,
        videos: undefined,
        materials: undefined,
      };
    })
  );

  return { items, error: null, status: 200 };
}
