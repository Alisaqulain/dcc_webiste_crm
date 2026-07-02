'use client';

import { useState, useEffect, Suspense } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import Image from 'next/image';
import CourseDescriptionBlocks from '@/app/components/ui/CourseDescriptionBlocks';
import AnimatedSection from '@/app/components/ui/AnimatedSection';
import SectionTitle from '@/app/components/ui/SectionTitle';

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

function CourseDetailPageInner() {
  const { courseId } = useParams();
  const searchParams = useSearchParams();
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

  const couponQ = searchParams.get('coupon');
  const purchaseSuffix = couponQ
    ? `?coupon=${encodeURIComponent(couponQ)}`
    : '';
  const purchaseHref = session
    ? `/purchase/${courseId}${purchaseSuffix}`
    : `/login?redirect=${encodeURIComponent(`/purchase/${courseId}${purchaseSuffix}`)}`;

  const priceLabel =
    course.price != null && course.price !== ''
      ? `₹${Number(course.price).toLocaleString('en-IN')}`
      : null;

  const firstPlayableVideoId = sortedVideos[0]?._id;

  const renderVideoList = (compact = false) => {
    if (sortedVideos.length === 0) {
      return (
        <div className="text-center py-8 text-gray-500 text-sm">
          No videos available yet.
        </div>
      );
    }

    return sortedVideos.map((video, index) => {
      const isPreview = video.isPreview === true;
      const canAccess = session || isPreview;
      const videoUrl = `/course/${courseId}/video/${video._id}`;
      const loginUrl = `/login?redirect=${encodeURIComponent(videoUrl)}`;

      if (compact) {
        if (canAccess) {
          return (
            <Link
              key={video._id || index}
              href={videoUrl}
              className="block p-3 rounded-lg border border-slate-200 hover:border-red-300 hover:bg-red-50/50 transition-colors"
            >
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 shrink-0 rounded-full bg-red-100 text-red-700 text-xs font-semibold flex items-center justify-center">
                  {index + 1}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900 line-clamp-2">{video.title}</p>
                  <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                    <span>{video.duration}</span>
                    {isPreview && (
                      <span className="text-green-700 font-medium">Preview</span>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          );
        }

        return (
          <button
            key={video._id || index}
            type="button"
            onClick={() => router.push(loginUrl)}
            className="block w-full text-left p-3 rounded-lg border border-slate-200 hover:border-red-300 hover:bg-red-50/50 transition-colors"
          >
            <div className="flex items-start gap-3">
              <div className="w-7 h-7 shrink-0 rounded-full bg-gray-100 text-gray-500 text-xs font-semibold flex items-center justify-center">
                {index + 1}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-900 line-clamp-2">{video.title}</p>
                <p className="text-xs text-red-600 mt-1">Login required</p>
              </div>
            </div>
          </button>
        );
      }

      if (canAccess) {
        return (
          <Link
            key={video._id || index}
            href={videoUrl}
            className="block p-4 border border-slate-200 rounded-xl hover:border-red-300 hover:bg-red-50/50 hover:shadow-md transition-all duration-200"
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
                      Free Preview
                    </span>
                  )}
                </div>
                {video.description && (
                  <p className="text-sm text-gray-600 mb-2 line-clamp-2">{video.description}</p>
                )}
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <span>{video.duration}</span>
                  {video.fileSize && (
                    <span>{(video.fileSize / (1024 * 1024)).toFixed(2)} MB</span>
                  )}
                </div>
              </div>
            </div>
          </Link>
        );
      }

      return (
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
              <h3 className="text-lg font-medium text-gray-900 mb-1">
                {index + 1}. {video.title}
              </h3>
              <p className="text-sm text-red-600 font-medium">Please log in to watch this video</p>
            </div>
          </div>
        </div>
      );
    });
  };

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
      <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-slate-100 sticky top-16 z-30">
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Left sidebar — course info + scrollable video list */}
          <div className="lg:col-span-1 lg:sticky lg:top-36 lg:self-start w-full">
            <div className="dcc-card flex flex-col lg:max-h-[calc(100vh-9rem)] overflow-hidden border-slate-100">
              <div className="shrink-0 overflow-hidden">
              <div className="relative h-40 w-full bg-gray-200">
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
              <div className="p-5">
                <h2 className="text-lg font-semibold text-gray-900 mb-3 line-clamp-2">{course.title}</h2>
                
                <div className="grid grid-cols-2 gap-2 mb-4 text-sm">
                  <div>
                    <span className="text-xs font-medium text-gray-500">Category</span>
                    <p className="text-gray-900">{course.category}</p>
                  </div>
                  <div>
                    <span className="text-xs font-medium text-gray-500">Level</span>
                    <p className="text-gray-900">{course.level}</p>
                  </div>
                  <div>
                    <span className="text-xs font-medium text-gray-500">Duration</span>
                    <p className="text-gray-900">{course.duration}</p>
                  </div>
                  <div>
                    <span className="text-xs font-medium text-gray-500">Instructor</span>
                    <p className="text-gray-900 truncate">{course.instructor?.name || 'Digital Career Center'}</p>
                  </div>
                </div>

                <div className="pt-3 border-t border-gray-100 space-y-2">
                  {priceLabel && !hasAccess && (
                    <p className="text-lg font-bold text-gray-900">{priceLabel}</p>
                  )}
                  {hasAccess ? (
                    <div className="space-y-2">
                      <p className="text-sm text-green-800 font-medium">You have access to this course.</p>
                      {firstPlayableVideoId ? (
                        <Link
                          href={`/course/${courseId}/video/${firstPlayableVideoId}`}
                          className="block w-full text-center bg-red-600 hover:bg-red-700 text-white font-semibold py-2.5 px-4 rounded-lg transition-colors text-sm"
                        >
                          Start learning
                        </Link>
                      ) : null}
                    </div>
                  ) : (
                    <Link
                      href={purchaseHref}
                      className="block w-full text-center bg-red-600 hover:bg-red-700 text-white font-semibold py-2.5 px-4 rounded-lg shadow-md transition-colors text-sm"
                    >
                      {priceLabel ? `Purchase for ${priceLabel}` : 'Purchase this course'}
                    </Link>
                  )}
                </div>
              </div>
              </div>

              {/* Scrollable video list (desktop sidebar) */}
              <div className="hidden lg:flex flex-col min-h-0 flex-1 border-t border-slate-100">
                <div className="shrink-0 px-4 py-3 bg-slate-50 border-b border-slate-100">
                  <h3 className="text-sm font-semibold text-gray-900">
                    Course Videos ({sortedVideos.length})
                  </h3>
                </div>
                <div className="overflow-y-auto overscroll-contain flex-1 min-h-0 px-3 py-3 space-y-2 dcc-scroll">
                  {renderVideoList(true)}
                </div>
              </div>
            </div>
          </div>

          {/* Main content — course description */}
          <div className="lg:col-span-2 space-y-8">
            {course.description && (
              <AnimatedSection className="dcc-card p-6 sm:p-8">
                <SectionTitle title="About This Course" align="left" className="!mb-6" />
                <CourseDescriptionBlocks description={course.description} />
              </AnimatedSection>
            )}

            {/* Video list on mobile/tablet */}
            <AnimatedSection className="lg:hidden dcc-card p-6 sm:p-8">
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
              <div className="space-y-3">
                {renderVideoList(false)}
              </div>
            </AnimatedSection>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}

export default function CourseDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600" />
        </div>
      }
    >
      <CourseDetailPageInner />
    </Suspense>
  );
}
