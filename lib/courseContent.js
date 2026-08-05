import Course from '@/models/Course';

function siblingListingType(listingType) {
  return listingType === 'app' ? 'course' : 'app';
}

async function findSiblingCourse(course) {
  if (!course?.title) return null;
  return Course.findOne({
    title: course.title,
    listingType: siblingListingType(course.listingType || 'course'),
    _id: { $ne: course._id },
  })
    .select('videos materials listingType title')
    .lean();
}

/**
 * Merge videos/materials from same-title course/app twin when this record is empty.
 */
export async function enrichCourseContent(course) {
  if (!course) return course;

  const hasVideos = (course.videos?.length ?? 0) > 0;
  const hasMaterials = (course.materials?.length ?? 0) > 0;
  if (hasVideos && hasMaterials) return course;

  const sibling = await findSiblingCourse(course);
  if (!sibling) return course;

  return {
    ...course,
    videos: hasVideos ? course.videos : sibling.videos || [],
    materials: hasMaterials ? course.materials : sibling.materials || [],
    _contentMergedFrom: sibling._id?.toString?.() ?? String(sibling._id),
  };
}

/**
 * Find a video or material on the purchased course or its same-title twin.
 */
export async function resolveCourseMedia(courseId, { videoId = null, materialId = null } = {}) {
  const primary = await Course.findById(courseId).lean();
  if (!primary) return null;

  const matchVideo = (c) =>
    videoId && c.videos?.find((v) => String(v._id) === String(videoId));
  const matchMaterial = (c) =>
    materialId && c.materials?.find((m) => String(m._id) === String(materialId));

  let video = matchVideo(primary);
  let material = matchMaterial(primary);
  if ((videoId && video) || (materialId && material)) {
    return { course: primary, video, material, ownerCourseId: String(primary._id) };
  }

  const sibling = await findSiblingCourse(primary);
  if (!sibling) {
    return { course: primary, video: null, material: null, ownerCourseId: String(primary._id) };
  }

  video = video || matchVideo(sibling);
  material = material || matchMaterial(sibling);

  return { course: primary, sibling, video, material, ownerCourseId: String(primary._id) };
}

/** Find a duplicate title across course/app listings. */
export async function findDuplicateListing(title, listingType, excludeId = null) {
  if (!title?.trim()) return null;
  const query = {
    title: title.trim(),
    listingType: siblingListingType(listingType || 'course'),
  };
  if (excludeId) query._id = { $ne: excludeId };
  return Course.findOne(query).select('_id title listingType videos materials').lean();
}
