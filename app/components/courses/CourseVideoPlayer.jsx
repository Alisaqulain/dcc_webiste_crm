'use client';

import CustomYouTubePlayer from '@/app/components/CustomYouTubePlayer';
import VimeoPlayer from '@/app/components/VimeoPlayer';
import CustomHTML5VideoPlayer from '@/app/components/CustomHTML5VideoPlayer';
import { getVideoPlayerType, getUploadedVideoStreamUrl } from '@/lib/courseAccess';

/**
 * Renders the correct player for a course video (YouTube, Vimeo, or uploaded file).
 */
export default function CourseVideoPlayer({ courseId, video, onVideoEnd, onVideoStart, className = '' }) {
  if (!video) {
    return (
      <div className={`aspect-video flex items-center justify-center bg-slate-900 text-white/70 text-sm ${className}`}>
        Video not available
      </div>
    );
  }

  const type = getVideoPlayerType(video);

  if (type === 'youtube') {
    return (
      <div className={className}>
        <CustomYouTubePlayer courseId={courseId} video={video} onVideoEnd={onVideoEnd} onVideoStart={onVideoStart} />
      </div>
    );
  }

  if (type === 'vimeo') {
    return (
      <div className={className}>
        <VimeoPlayer courseId={courseId} video={video} onVideoEnd={onVideoEnd} onVideoStart={onVideoStart} />
      </div>
    );
  }

  if (type === 'html5') {
    const streamUrl = getUploadedVideoStreamUrl(courseId, video);
    const videoWithStream = streamUrl ? { ...video, directVideoUrl: streamUrl } : video;
    return (
      <div className={className}>
        <CustomHTML5VideoPlayer
          courseId={courseId}
          video={videoWithStream}
          onVideoEnd={onVideoEnd}
          onVideoStart={onVideoStart}
        />
      </div>
    );
  }

  return (
    <div className={`aspect-video flex items-center justify-center bg-slate-900 text-white/80 text-sm p-6 text-center ${className}`}>
      Video source not configured for this lesson.
    </div>
  );
}
