'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import VimeoPlayer from '../../../../components/VimeoPlayer';
import CustomYouTubePlayer from '../../../../components/CustomYouTubePlayer';
import Link from 'next/link';

export default function VideoPlayerPage() {
  const { courseId, videoId } = useParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const [course, setCourse] = useState(null);
  const [video, setVideo] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (status === 'loading') return;
    fetchCourseData();
    // Do not depend on full `session` — NextAuth refreshes it often and would reload the whole page during playback.
  }, [status, courseId, videoId, session?.user?.id]);

  // Prevent sharing and URL copying
  useEffect(() => {
    // Prevent common sharing shortcuts
    const preventSharing = (e) => {
      // Prevent Ctrl+Shift+I (DevTools), Ctrl+U (View Source), Ctrl+S (Save)
      if ((e.ctrlKey || e.metaKey) && (e.shiftKey && e.key === 'I' || e.key === 'u' || e.key === 's')) {
        e.preventDefault();
        return false;
      }
      // Prevent F12 (DevTools)
      if (e.key === 'F12') {
        e.preventDefault();
        return false;
      }
    };

    // Prevent right-click context menu
    const preventContextMenu = (e) => {
      // Allow right-click on non-video areas
      if (!e.target.closest('.aspect-video') && !e.target.closest('.relative.bg-black')) {
        return;
      }
      e.preventDefault();
      return false;
    };

    // Prevent text selection on video player
    const preventSelection = (e) => {
      if (e.target.closest('.aspect-video') || e.target.closest('.relative.bg-black')) {
        e.preventDefault();
        return false;
      }
    };

    // Prevent copying URL from address bar (limited effectiveness, but helps)
    const preventCopy = (e) => {
      const selection = window.getSelection().toString();
      if (selection.includes(window.location.href) || selection.includes(courseId) || selection.includes(videoId)) {
        e.preventDefault();
        return false;
      }
    };

    document.addEventListener('keydown', preventSharing);
    document.addEventListener('contextmenu', preventContextMenu);
    document.addEventListener('selectstart', preventSelection);
    document.addEventListener('copy', preventCopy);

    return () => {
      document.removeEventListener('keydown', preventSharing);
      document.removeEventListener('contextmenu', preventContextMenu);
      document.removeEventListener('selectstart', preventSelection);
      document.removeEventListener('copy', preventCopy);
    };
  }, [courseId, videoId]);

  const fetchCourseData = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/courses/${courseId}?includeVideos=true`);
      
      if (response.ok) {
        const data = await response.json();
        setCourse(data.course);
        
        // Find the specific video
        if (data.course.videos && data.course.videos.length > 0) {
          const foundVideo = data.course.videos.find(v => v._id === videoId);
          if (foundVideo) {
            // If video is in the list, user has access (API already filters non-preview videos for non-purchased users)
            // Preview videos are always accessible
            
            // Additional protection: Verify access for non-preview videos
            if (!foundVideo.isPreview && !foundVideo.isFreePreview && session) {
              const accessResponse = await fetch(`/api/courses/${courseId}/access`);
              if (accessResponse.ok) {
                const accessData = await accessResponse.json();
                if (!accessData.hasAccess) {
                  setError('Access denied. Please purchase this course to view this video.');
                  setIsLoading(false);
                  return;
                }
              }
            }
            
            console.log('Video found:', {
              videoId: foundVideo._id,
              title: foundVideo.title,
              description: foundVideo.description,
              hasDescription: !!foundVideo.description,
              descriptionLength: foundVideo.description?.length,
              isPreview: foundVideo.isPreview,
              hasVideoData: !!foundVideo.videoData,
              videoDataUrl: foundVideo.videoData?.url,
              videoDataFileName: foundVideo.videoData?.fileName,
              isDataUrl: foundVideo.videoData?.isDataUrl,
              hasVideoPath: !!foundVideo.videoPath,
              videoPath: foundVideo.videoPath,
              youtubeUrl: foundVideo.youtubeUrl,
              allVideosData: data.course.videos.map(v => ({
                id: v._id,
                title: v.title,
                hasVideoData: !!v.videoData,
                videoDataUrl: v.videoData?.url,
                videoDataFileName: v.videoData?.fileName
              }))
            });
            setVideo(foundVideo);
          } else {
            console.error('Video not found in course:', {
              videoId,
              courseId,
              availableVideoIds: data.course.videos.map(v => v._id)
            });
            setError('Video not found or access denied');
          }
        } else {
          setError('No videos found for this course');
        }
      } else {
        setError('Course not found');
      }
    } catch (error) {
      console.error('Error fetching course data:', error);
      setError('Failed to load course data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVideoEnd = useCallback((video) => {
    console.log('Video ended:', video.title);
  }, []);

  const handleVideoStart = useCallback((video) => {
    console.log('Video started:', video.title);
  }, []);

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading video...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Link
            href="/courses"
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            Back to Courses
          </Link>
        </div>
      </div>
    );
  }

  if (!course || !video) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Video not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link 
                href={`/course/${courseId}`}
                className="text-gray-600 hover:text-gray-900"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">{course.title}</h1>
                <p className="text-sm text-gray-600">{video.title}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <Link
                href={`/course/${courseId}`}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Course Content
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Video Player */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              {/* Player roots own aspect ratio; avoids empty gap when mobile uses fixed fullscreen */}
              <div className="w-full">
                {video?.youtubeUrl ? (
                  <CustomYouTubePlayer
                    courseId={courseId}
                    video={video}
                    onVideoEnd={handleVideoEnd}
                    onVideoStart={handleVideoStart}
                  />
                ) : (video?.vimeoUrl || video?.vimeoVideoId) ? (
                  <VimeoPlayer
                    courseId={courseId}
                    video={video}
                    onVideoEnd={handleVideoEnd}
                    onVideoStart={handleVideoStart}
                  />
                ) : (
                  <div className="relative bg-gray-900 rounded-lg overflow-hidden aspect-video w-full flex items-center justify-center">
                    <div className="text-center text-white p-6">
                      <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                      <h3 className="text-xl font-semibold mb-2">Video Not Available</h3>
                      <p className="text-gray-400">No video source found for this video.</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Video Description */}
            {(() => {
              if (!video.description) return null;
              
              const desc = video.description.trim();
              if (!desc || desc.length === 0) return null;
              
              // Filter out obvious placeholder text: long strings of random letters without spaces
              // Pattern like "dfnsfbhdsbfhjbfjhsdbf..." - 30+ chars, only letters, no spaces/punctuation
              const isPlaceholderText = desc.length >= 30 && 
                !desc.includes(' ') && 
                !/[.,!?;:—\-]/.test(desc) &&
                /^[a-z]+$/i.test(desc);
              
              // Don't show if it's placeholder text
              if (isPlaceholderText) {
                return null;
              }
              
              return (
                <div className="mt-6 bg-white rounded-lg shadow-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">About this video</h3>
                  <p className="text-gray-600 leading-relaxed">{desc}</p>
                </div>
              );
            })()}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Course Content</h3>
              
              <div className="space-y-2">
                {course.videos.map((courseVideo, index) => (
                  <Link
                    key={courseVideo._id}
                    href={`/course/${courseId}/video/${courseVideo._id}`}
                    className={`block p-3 rounded-lg transition-colors ${
                      courseVideo._id === videoId
                        ? 'bg-red-100 border border-red-200 text-red-900'
                        : 'bg-gray-50 hover:bg-gray-100 text-gray-700'
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                          courseVideo._id === videoId
                            ? 'bg-red-600 text-white'
                            : 'bg-gray-200 text-gray-600'
                        }`}>
                          {index + 1}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {courseVideo.title}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {courseVideo.duration}
                          {courseVideo.isPreview && (
                            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                              Preview
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Course Info */}
            <div className="mt-6 bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Course Information</h3>
              <div className="space-y-3">
                <div>
                  <span className="text-sm font-medium text-gray-500">Instructor</span>
                  <p className="text-sm text-gray-900">{course.instructor?.name || 'Digital Career Center'}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">Duration</span>
                  <p className="text-sm text-gray-900">{course.duration}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">Level</span>
                  <p className="text-sm text-gray-900">{course.level}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">Category</span>
                  <p className="text-sm text-gray-900">{course.category}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
