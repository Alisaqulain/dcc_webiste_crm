"use client";
import React, { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

// Helper function to normalize course thumbnail URL
const getCourseThumbnail = (thumbnail) => {
  if (!thumbnail) return null;
  
  // If it's already a full URL, return as is
  if (thumbnail.startsWith('http://') || thumbnail.startsWith('https://')) {
    return thumbnail;
  }
  
  // If it's a data URL, return as is
  if (thumbnail.startsWith('data:')) {
    return thumbnail;
  }
  
  // If it starts with /, it's a relative path
  if (thumbnail.startsWith('/')) {
    return thumbnail;
  }
  
  // Otherwise, assume it's in public folder and add leading slash
  return `/${thumbnail}`;
};

// Helper function to check if URL is a data URL
const isDataUrl = (url) => {
  return url && url.startsWith('data:');
};

const CoursesPage = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [courses, setCourses] = useState([]);
  const [combos, setCombos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterLevel, setFilterLevel] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [showViewMoreModal, setShowViewMoreModal] = useState(false);
  const [viewMoreCourse, setViewMoreCourse] = useState(null);
  const [showPendingBanner, setShowPendingBanner] = useState(false);
  const [couponFromUrl, setCouponFromUrl] = useState("");
  const [ownedCourseIds, setOwnedCourseIds] = useState(() => new Set());

  const purchaseUrl = (path) => {
    if (!couponFromUrl) return path;
    const sep = path.includes("?") ? "&" : "?";
    return `${path}${sep}coupon=${encodeURIComponent(couponFromUrl)}`;
  };

  const refreshOwnedCourses = useCallback(async () => {
    if (!session) {
      setOwnedCourseIds(new Set());
      return;
    }
    try {
      const r = await fetch("/api/my-courses", { cache: "no-store" });
      if (!r.ok) return;
      const d = await r.json();
      const next = new Set(
        (d.courses || []).map((c) => String(c._id))
      );
      setOwnedCourseIds(next);
    } catch {
      /* ignore */
    }
  }, [session]);

  useEffect(() => {
    refreshOwnedCourses();
  }, [refreshOwnedCourses]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const onVis = () => {
      if (document.visibilityState === "visible") refreshOwnedCourses();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [refreshOwnedCourses]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    setShowPendingBanner(params.get("pendingPurchase") === "1");
    setCouponFromUrl(params.get("coupon") || "");
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || status !== "authenticated" || !session) return;
    const params = new URLSearchParams(window.location.search);
    const checkoutId = params.get("checkout");
    if (!checkoutId) return;
    const q = new URLSearchParams();
    if (params.get("pendingPurchase") === "1") q.set("pendingPurchase", "1");
    const coupon = params.get("coupon");
    if (coupon) q.set("coupon", coupon);
    router.replace(
      `/purchase/${checkoutId}${q.toString() ? `?${q}` : ""}`
    );
  }, [session, status, router]);

  const categories = [
    "Digital Marketing",
    "Web Development", 
    "Data Science",
    "AI/ML",
    "Cloud Computing",
    "Cybersecurity",
    "Other"
  ];

  const levels = ["Beginner", "Intermediate", "Advanced"];

  useEffect(() => {
    fetchCourses();
  }, [searchTerm, filterCategory, filterLevel, sortBy]);

  const fetchCourses = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        published: "true",
        ...(searchTerm && { search: searchTerm }),
        ...(filterCategory && { category: filterCategory }),
        ...(filterLevel && { level: filterLevel }),
        ...(sortBy && { sortBy: sortBy })
      });

      const [response, comboRes] = await Promise.all([
        fetch(`/api/courses?${params}`),
        fetch('/api/combos'),
      ]);
      if (response.ok) {
        const data = await response.json();
        setCourses(data.courses || []);
      }
      if (comboRes.ok) {
        const comboData = await comboRes.json();
        setCombos(comboData.combos || []);
      }
    } catch (error) {
      console.error("Error fetching courses:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePurchase = (course) => {
    const dest = purchaseUrl(`/purchase/${course._id}`);
    if (!session) {
      router.push(`/login?redirect=${encodeURIComponent(dest)}`);
      return;
    }
    router.push(dest);
  };

  const handleViewMore = (course) => {
    setViewMoreCourse(course);
    setShowViewMoreModal(true);
  };

  const isComboFullyOwned = (combo) => {
    const ids = (combo.courseIds || []).map((c) => String(c._id));
    return ids.length > 0 && ids.every((id) => ownedCourseIds.has(id));
  };

  const handleComboPurchase = (combo) => {
    const dest = `/purchase/combo/${combo._id}`;
    if (!session) {
      router.push(`/login?redirect=${encodeURIComponent(dest)}`);
      return;
    }
    router.push(dest);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading courses...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {showPendingBanner && session && (
        <div className="bg-amber-50 border-b border-amber-200 text-amber-900 px-4 py-3 text-center text-sm">
          Complete your first course purchase below to unlock your dashboard, referrals, and CRM (if included with your course).
        </div>
      )}
      {couponFromUrl && session && (
        <div className="bg-green-50 border-b border-green-200 text-green-900 px-4 py-3 text-center text-sm">
          Coupon <span className="font-mono font-semibold">{couponFromUrl.toUpperCase()}</span> will apply at checkout when you purchase a course below (logged in as you).
        </div>
      )}
      {couponFromUrl && !session && status !== "loading" && (
        <div className="bg-blue-50 border-b border-blue-200 text-blue-900 px-4 py-3 text-center text-sm">
          Sign in to use coupon <span className="font-mono font-semibold">{couponFromUrl.toUpperCase()}</span> at checkout.
        </div>
      )}
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Our Courses
            </h1>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Discover our comprehensive range of courses designed to help you advance your career
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search courses..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              >
                <option value="">All Categories</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Level</label>
              <select
                value={filterLevel}
                onChange={(e) => setFilterLevel(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              >
                <option value="">All Levels</option>
                {levels.map(level => (
                  <option key={level} value={level}>{level}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="popular">Most Popular</option>
              </select>
            </div>
          </div>
        </div>

        {combos.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Combo bundles</h2>
            <p className="text-gray-600 text-sm mb-6">One payment — lifetime access to every course in the bundle.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {combos.map((combo) => {
                const owned = isComboFullyOwned(combo);
                return (
                  <div
                    key={combo._id}
                    className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow ring-2 ring-red-100"
                  >
                    <div className="relative h-48 w-full bg-gray-200">
                      {getCourseThumbnail(combo.thumbnail) ? (
                        <Image
                          src={getCourseThumbnail(combo.thumbnail)}
                          alt={combo.title}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
                          Bundle
                        </div>
                      )}
                      <div className="absolute top-4 right-4 bg-green-700 text-white px-2 py-1 rounded-full text-xs font-semibold">
                        Lifetime Access
                      </div>
                    </div>
                    <div className="p-6">
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">{combo.title}</h3>
                      <p className="text-gray-600 text-sm mb-3 line-clamp-2">{combo.shortDescription}</p>
                      <div className="flex items-center justify-between gap-2 flex-wrap mb-3">
                        {owned ? (
                          <span className="text-lg font-semibold text-green-700">In your library</span>
                        ) : (
                          <>
                            <span className="text-2xl font-bold text-gray-900">
                              ₹{Number(combo.price).toLocaleString('en-IN')}
                            </span>
                            {combo.originalPrice > combo.price && (
                              <span className="text-sm text-gray-500 line-through">
                                ₹{Number(combo.originalPrice).toLocaleString('en-IN')}
                              </span>
                            )}
                          </>
                        )}
                      </div>
                      <div className="flex gap-2">
                        {!owned && (
                        <button
                          type="button"
                          onClick={() => handleComboPurchase(combo)}
                          className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium text-sm"
                        >
                          {session ? 'Purchase' : 'Login to Purchase'}
                        </button>
                        )}
                        <Link
                          href={`/combo/${combo._id}`}
                          className="flex-1 px-4 py-2 rounded-lg font-medium text-sm bg-green-600 hover:bg-green-700 text-white text-center"
                        >
                          View Full Course
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleViewMore(combo)}
                          className="px-4 py-2 rounded-lg font-medium text-sm bg-blue-600 text-white"
                        >
                          View More
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Courses Grid */}
        {courses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {courses.map((course) => {
              const isOwned = ownedCourseIds.has(String(course._id));
              return (
              <div key={course._id} className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
                {/* Course Image */}
                <div className="relative h-48 w-full bg-gray-200">
                  {getCourseThumbnail(course.thumbnail) ? (
                    isDataUrl(getCourseThumbnail(course.thumbnail)) ? (
                      <img
                        src={getCourseThumbnail(course.thumbnail)}
                        alt={course.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Image
                        src={getCourseThumbnail(course.thumbnail)}
                        alt={course.title}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    )
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                  {course.isFeatured && (
                    <div className="absolute top-4 left-4 bg-red-600 text-white px-2 py-1 rounded-full text-xs font-semibold">
                      Featured
                    </div>
                  )}
                  <div className="absolute top-4 right-4">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      course.level === 'Beginner' ? 'bg-green-100 text-green-800' :
                      course.level === 'Intermediate' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {course.level}
                    </span>
                  </div>
                </div>

                {/* Course Content */}
                <div className="p-6">
                  {/* Banner */}
                  {course.banner && (
                    <div className="mb-3 px-3 py-2 bg-red-50 border-l-4 border-red-600 rounded">
                      <p className="text-sm font-medium text-red-800">{course.banner}</p>
                    </div>
                  )}

                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-500">{course.category}</span>
                    <div className="flex items-center">
                      <div className="flex text-yellow-400">
                        {[...Array(5)].map((_, i) => (
                          <svg key={i} className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                            <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                          </svg>
                        ))}
                      </div>
                      <span className="ml-1 text-sm text-gray-500">({course.rating?.count || 0})</span>
                    </div>
                  </div>

                  <h3 className="text-xl font-semibold text-gray-900 mb-2 line-clamp-2">
                    {course.title}
                  </h3>

                  <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                    {course.shortDescription || course.description}
                  </p>

                  {/* Perks */}
                  {course.perks && course.perks.length > 0 && (
                    <div className="mb-4">
                      <div className="flex flex-wrap gap-2">
                        {course.perks.map((perk, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"
                          >
                            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            {perk}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center">
                        <span className="text-sm font-semibold text-gray-600">
                          {course.instructor?.name?.charAt(0) || 'I'}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{course.instructor?.name}</p>
                        <p className="text-xs text-gray-500">Instructor</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">Duration</p>
                      <p className="text-sm font-medium text-gray-900">{course.duration}</p>
                    </div>
                  </div>

                  {/* Features */}
                  {course.features && course.features.length > 0 && (
                    <div className="mb-4">
                      <ul className="text-xs text-gray-600 space-y-1">
                        {course.features.slice(0, 3).map((feature, index) => (
                          <li key={index} className="flex items-center">
                            <svg className="w-3 h-3 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Price and Purchase */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center space-x-2">
                        {isOwned ? (
                          <span className="text-lg font-semibold text-green-700">
                            In your library
                          </span>
                        ) : (
                          <>
                            <span className="text-2xl font-bold text-gray-900">
                              ₹{course.price?.toLocaleString()}
                            </span>
                            {course.originalPrice && course.originalPrice > course.price && (
                              <span className="text-sm text-gray-500 line-through">
                                ₹{course.originalPrice.toLocaleString()}
                              </span>
                            )}
                          </>
                        )}
                      </div>
                      {isOwned ? (
                        <Link
                          href={`/course/${course._id}`}
                          className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium transition-colors text-center shrink-0"
                        >
                          Continue learning
                        </Link>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handlePurchase(course)}
                          className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-medium transition-colors shrink-0"
                        >
                          {session ? "Purchase" : "Login to Purchase"}
                        </button>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Link
                        href={`/course/${course._id}`}
                        className="flex-1 px-4 py-2 rounded-lg font-medium transition-colors text-sm bg-green-600 hover:bg-green-700 text-white text-center"
                        title="View full course with preview videos"
                      >
                        View Full Course
                      </Link>
                      <button
                        onClick={() => handleViewMore(course)}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors text-sm ${
                          course.viewMore
                            ? 'bg-blue-600 hover:bg-blue-700 text-white'
                            : 'bg-gray-100 hover:bg-gray-200 text-gray-700 cursor-not-allowed opacity-60'
                        }`}
                        disabled={!course.viewMore}
                        title={!course.viewMore ? 'No additional content available' : 'View more details about this course'}
                      >
                        View More
                      </button>
                    </div>
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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No courses found</h3>
            <p className="text-gray-500">Try adjusting your search or filter criteria</p>
          </div>
        )}
      </div>

      {/* View More Modal */}
      {showViewMoreModal && viewMoreCourse && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
          <div className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center z-10">
              <h2 className="text-2xl font-bold text-gray-900">{viewMoreCourse.title}</h2>
              <button
                onClick={() => {
                  setShowViewMoreModal(false);
                  setViewMoreCourse(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 space-y-6">
              {/* Banner */}
              {viewMoreCourse.banner && (
                <div className="px-4 py-3 bg-red-50 border-l-4 border-red-600 rounded">
                  <p className="text-sm font-medium text-red-800">{viewMoreCourse.banner}</p>
                </div>
              )}

              {/* Course Info Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Category</p>
                  <p className="text-sm font-medium text-gray-900">{viewMoreCourse.category}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Level</p>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    viewMoreCourse.level === 'Beginner' ? 'bg-green-100 text-green-800' :
                    viewMoreCourse.level === 'Intermediate' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {viewMoreCourse.level}
                  </span>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Duration</p>
                  <p className="text-sm font-medium text-gray-900">{viewMoreCourse.duration}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Price</p>
                  <div className="flex items-center space-x-2">
                    <span className="text-lg font-bold text-gray-900">₹{viewMoreCourse.price?.toLocaleString()}</span>
                    {viewMoreCourse.originalPrice && viewMoreCourse.originalPrice > viewMoreCourse.price && (
                      <span className="text-sm text-gray-500 line-through">₹{viewMoreCourse.originalPrice.toLocaleString()}</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Instructor */}
              {viewMoreCourse.instructor && (
                <div>
                  <p className="text-xs text-gray-500 mb-1">Instructor</p>
                  <p className="text-sm font-medium text-gray-900">{viewMoreCourse.instructor.name}</p>
                  {viewMoreCourse.instructor.bio && (
                    <p className="text-sm text-gray-600 mt-1">{viewMoreCourse.instructor.bio}</p>
                  )}
                </div>
              )}

              {/* Full Description */}
              {viewMoreCourse.description && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Description</h3>
                  <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{viewMoreCourse.description}</p>
                </div>
              )}

              {/* Perks */}
              {viewMoreCourse.perks && viewMoreCourse.perks.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Perks & Benefits</h3>
                  <div className="flex flex-wrap gap-2">
                    {viewMoreCourse.perks.map((perk, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800"
                      >
                        <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        {perk}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Features */}
              {viewMoreCourse.features && viewMoreCourse.features.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Course Features</h3>
                  <ul className="space-y-2">
                    {viewMoreCourse.features.map((feature, index) => (
                      <li key={index} className="flex items-start">
                        <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* What You Will Learn */}
              {viewMoreCourse.whatYouWillLearn && viewMoreCourse.whatYouWillLearn.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">What You Will Learn</h3>
                  <ul className="space-y-2">
                    {viewMoreCourse.whatYouWillLearn.map((item, index) => (
                      <li key={index} className="flex items-start">
                        <svg className="w-5 h-5 text-blue-500 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span className="text-gray-700">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Requirements */}
              {viewMoreCourse.requirements && viewMoreCourse.requirements.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Requirements</h3>
                  <ul className="space-y-2">
                    {viewMoreCourse.requirements.map((requirement, index) => (
                      <li key={index} className="flex items-start">
                        <svg className="w-5 h-5 text-orange-500 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                        <span className="text-gray-700">{requirement}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* View More Content */}
              {viewMoreCourse.viewMore && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Additional Details</h3>
                  <div className="whitespace-pre-wrap text-gray-700 leading-relaxed bg-gray-50 p-4 rounded-lg">
                    {viewMoreCourse.viewMore}
                  </div>
                </div>
              )}
            </div>
            <div className="sticky bottom-0 bg-white border-t px-6 py-4 flex justify-end z-10">
              <button
                onClick={() => {
                  setShowViewMoreModal(false);
                  setViewMoreCourse(null);
                }}
                className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CoursesPage;
