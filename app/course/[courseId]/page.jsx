'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import Image from 'next/image';

// Helper function to normalize course thumbnail URL
const getCourseThumbnail = (thumbnail) => {
  if (!thumbnail) return null;
  
  // If it's already a full URL, return as is
  if (thumbnail.startsWith('http://') || thumbnail.startsWith('https://')) {
    return thumbnail;
  }
  
  // If it starts with /, it's a relative path
  if (thumbnail.startsWith('/')) {
    return thumbnail;
  }
  
  // Otherwise, assume it's in public folder and add leading slash
  return `/${thumbnail}`;
};

export default function CourseDetailPage() {
  const { courseId } = useParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const [course, setCourse] = useState(null);
  const [hasAccess, setHasAccess] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (status === 'loading') return;
    
    // Allow access to course page even without login to view preview videos
    fetchCourseData();
  }, [session, status, courseId, router]);

  const fetchCourseData = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/courses/${courseId}?includeVideos=true`);
      
      if (response.ok) {
        const data = await response.json();
        setCourse(data.course);
        setHasAccess(Boolean(data.hasAccess));
        
        // Check if there are any videos (preview or purchased)
        if (!data.course.videos || data.course.videos.length === 0) {
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

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading course...</p>
        </div>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600 mb-4">{error || 'Course not found'}</p>
          <div className="flex gap-4 justify-center">
            {session ? (
              <Link
                href="/my-courses"
                className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
              >
                Back to My Courses
              </Link>
            ) : (
              <Link
                href="/courses"
                className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
              >
                Browse Courses
              </Link>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Course schema for SEO
  const courseSchema = course ? {
    "@context": "https://schema.org",
    "@type": "Course",
    "name": course.title,
    "description": course.description || `${course.title} - Learn from Digital Career Center`,
    "provider": {
      "@type": "EducationalOrganization",
      "name": "Digital Career Center",
      "url": "https://domainisdigitalcareercenter.com"
    },
    "instructor": {
      "@type": "Person",
      "name": course.instructor?.name || "Digital Career Center"
    },
    "courseCode": course._id,
    "educationalLevel": course.level || "Beginner",
    "courseCategory": course.category || "Digital Skills",
    "timeRequired": course.duration || "PT1H",
    "image": course.thumbnail ? (course.thumbnail.startsWith('http') ? course.thumbnail : `https://domainisdigitalcareercenter.com${course.thumbnail}`) : "https://domainisdigitalcareercenter.com/logo.png",
    "offers": {
      "@type": "Offer",
      "price": course.price || 0,
      "priceCurrency": "INR",
      "availability": "https://schema.org/InStock"
    }
  } : null;

  // Sort videos by order
  const sortedVideos = course.videos ? [...course.videos].sort((a, b) => (a.order || 0) - (b.order || 0)) : [];

  const purchaseHref = session
    ? `/purchase/${courseId}`
    : `/login?redirect=${encodeURIComponent(`/purchase/${courseId}`)}`;

  const priceLabel =
    course.price != null && course.price !== ''
      ? `₹${Number(course.price).toLocaleString('en-IN')}`
      : null;

  const firstPlayableVideoId = sortedVideos[0]?._id;

  return (
    <>
      {courseSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(courseSchema)
          }}
        />
      )}
      <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link 
                href={session ? "/my-courses" : "/courses"}
                className="text-gray-600 hover:text-gray-900"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
              <h1 className="text-xl font-semibold text-gray-900">{course.title}</h1>
            </div>
            <div className="flex items-center gap-3 flex-wrap justify-end">
              <span className="text-sm text-gray-500">
                {sortedVideos.length} {sortedVideos.length === 1 ? 'Video' : 'Videos'}
              </span>
              {hasAccess ? (
                <>
                  <span className="text-xs font-semibold text-green-700 bg-green-100 px-2 py-1 rounded-full">
                    Enrolled
                  </span>
                  {firstPlayableVideoId && (
                    <Link
                      href={`/course/${courseId}/video/${firstPlayableVideoId}`}
                      className="inline-flex items-center justify-center bg-red-600 hover:bg-red-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
                    >
                      Start learning
                    </Link>
                  )}
                  <Link
                    href="/my-courses"
                    className="text-sm font-medium text-gray-700 hover:text-red-600 underline"
                  >
                    My courses
                  </Link>
                </>
              ) : (
                <Link
                  href={purchaseHref}
                  className="inline-flex items-center justify-center bg-red-600 hover:bg-red-700 text-white text-sm font-semibold px-4 py-2 rounded-lg shadow-sm transition-colors"
                >
                  {priceLabel ? `Purchase · ${priceLabel}` : 'Purchase course'}
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Course Info Card */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-lg overflow-hidden sticky top-8">
              <div className="relative h-48 w-full bg-gray-200">
                {getCourseThumbnail(course.thumbnail) ? (
                  <Image
                    src={getCourseThumbnail(course.thumbnail)}
                    alt={course.title}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}
              </div>
              <div className="p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">{course.title}</h2>
                
                <div className="space-y-3 mb-6">
                  <div>
                    <span className="text-sm font-medium text-gray-500">Category</span>
                    <p className="text-sm text-gray-900">{course.category}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Level</span>
                    <p className="text-sm text-gray-900">{course.level}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Duration</span>
                    <p className="text-sm text-gray-900">{course.duration}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Instructor</span>
                    <p className="text-sm text-gray-900">{course.instructor?.name || 'Digital Career Center'}</p>
                  </div>
                </div>

                {course.description && (
                  <div className="mb-6">
                    <span className="text-sm font-medium text-gray-500">Description</span>
                    <p className="text-sm text-gray-700 mt-2">{course.description}</p>
                  </div>
                )}

                <div className="pt-2 border-t border-gray-100 space-y-3">
                  {priceLabel && !hasAccess && (
                    <p className="text-lg font-bold text-gray-900">{priceLabel}</p>
                  )}
                  {hasAccess ? (
                    <div className="space-y-2">
                      <p className="text-sm text-green-800 font-medium">You have access to this course.</p>
                      {firstPlayableVideoId ? (
                        <Link
                          href={`/course/${courseId}/video/${firstPlayableVideoId}`}
                          className="block w-full text-center bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
                        >
                          Start learning
                        </Link>
                      ) : null}
                      <Link
                        href="/my-courses"
                        className="block w-full text-center border border-gray-300 text-gray-800 font-medium py-2.5 px-4 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                      >
                        View my courses
                      </Link>
                    </div>
                  ) : (
                    <Link
                      href={purchaseHref}
                      className="block w-full text-center bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-4 rounded-lg shadow-md transition-colors"
                    >
                      {priceLabel ? `Purchase for ${priceLabel}` : 'Purchase this course'}
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Videos List */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <h2 className="text-2xl font-semibold text-gray-900">Course Videos</h2>
                {!hasAccess && (
                  <Link
                    href={purchaseHref}
                    className="inline-flex items-center justify-center shrink-0 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors w-full sm:w-auto"
                  >
                    {priceLabel ? `Purchase · ${priceLabel}` : 'Purchase course'}
                  </Link>
                )}
              </div>
              
              {sortedVideos.length > 0 ? (
                <div className="space-y-3">
                  {sortedVideos.map((video, index) => {
                    const isPreview = video.isPreview === true;
                    const canAccess = session || isPreview;
                    const videoUrl = `/course/${courseId}/video/${video._id}`;
                    const loginUrl = `/login?redirect=${encodeURIComponent(videoUrl)}`;
                    
                    return canAccess ? (
                      <Link
                        key={video._id || index}
                        href={videoUrl}
                        className="block p-4 border border-gray-200 rounded-lg hover:border-red-500 hover:bg-red-50 transition-colors"
                      >
                      <div className="flex items-start space-x-4">
                        <div className="flex-shrink-0">
                          <div className="w-12 h-12 rounded-lg bg-red-100 flex items-center justify-center">
                            <svg className="w-6 h-6 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                            </svg>
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h3 className="text-lg font-medium text-gray-900">
                              {index + 1}. {video.title}
                            </h3>
                            {video.isPreview && (
                              <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">
                                <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                Free Preview
                              </span>
                            )}
                          </div>
                          {video.description && (
                            <p className="text-sm text-gray-600 mb-2 line-clamp-2">{video.description}</p>
                          )}
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <span className="flex items-center">
                              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              {video.duration}
                            </span>
                            {video.fileSize && (
                              <span>
                                {(video.fileSize / (1024 * 1024)).toFixed(2)} MB
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex-shrink-0">
                          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </div>
                    </Link>
                    ) : (
                      <div
                        key={video._id || index}
                        onClick={() => router.push(loginUrl)}
                        className="block p-4 border border-gray-200 rounded-lg hover:border-red-500 hover:bg-red-50 transition-colors cursor-pointer"
                      >
                        <div className="flex items-start space-x-4">
                          <div className="flex-shrink-0">
                            <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center">
                              <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                              </svg>
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <h3 className="text-lg font-medium text-gray-900">
                                {index + 1}. {video.title}
                              </h3>
                              <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                                Login Required
                              </span>
                            </div>
                            {video.description && (
                              <p className="text-sm text-gray-600 mb-2 line-clamp-2">{video.description}</p>
                            )}
                            <div className="flex items-center space-x-4 text-sm text-gray-500">
                              <span className="flex items-center">
                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                {video.duration}
                              </span>
                              {video.fileSize && (
                                <span>
                                  {(video.fileSize / (1024 * 1024)).toFixed(2)} MB
                                </span>
                              )}
                            </div>
                            <div className="mt-3">
                              <span className="text-sm text-red-600 font-medium">Please log in to watch this video</span>
                            </div>
                          </div>
                          <div className="flex-shrink-0">
                            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="text-gray-400 mb-4">
                    <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No videos available</h3>
                  <p className="text-gray-500">This course doesn't have any videos yet.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}
