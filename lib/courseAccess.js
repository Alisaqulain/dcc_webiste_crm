/** Whether a user owns / is enrolled in a course (course or app listing). */
export function userHasCourseAccess(userCourses, courseId) {
  if (!userCourses?.length || !courseId) return false;
  const target = String(courseId);
  return userCourses.some((entry) => {
    const id = entry?.courseId?._id ?? entry?.courseId;
    return id && String(id) === target;
  });
}

export function normalizeCourseIds(userCourses) {
  if (!userCourses?.length) return [];
  return userCourses
    .map((entry) => entry?.courseId?._id ?? entry?.courseId)
    .filter(Boolean);
}

/**
 * Resolve purchase access from session — tries user id, then email fallback.
 */
export async function resolvePurchasedAccess(session, courseId, User) {
  if (!session?.user || !courseId) return { hasAccess: false, user: null };

  let user = null;

  if (session.user.id) {
    user = await User.findById(session.user.id).select('courses email').lean();
  }

  if (!user && session.user.email) {
    user = await User.findOne({
      email: String(session.user.email).toLowerCase().trim(),
    })
      .select('courses email')
      .lean();
  }

  if (!user) return { hasAccess: false, user: null };

  const hasAccess = userHasCourseAccess(user.courses, courseId);
  return { hasAccess, user };
}

export function isPreviewVideo(video) {
  return video?.isPreview === true || video?.isFreePreview === true;
}

export function getVideoPlayerType(video) {
  if (!video) return null;
  if (video.youtubeUrl) return 'youtube';
  if (video.vimeoUrl || video.vimeoVideoId) return 'vimeo';
  if (
    video.videoPath ||
    video.videoData?.url ||
    video.videoData?.fileName ||
    video.secureVideoUrl ||
    video.cloudflareStreamId ||
    video.awsVideoKey
  ) {
    return 'html5';
  }
  return null;
}

/** Resolve playable URL for uploaded / self-hosted videos. */
export function getUploadedVideoStreamUrl(courseId, video) {
  if (!courseId || !video?._id) return null;
  if (video.videoPath || video.videoData?.url || video.videoData?.fileName || video.secureVideoUrl) {
    return `/api/video/stream/${courseId}/${video._id}`;
  }
  return null;
}
