"use client";
import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";

const PurchasePage = ({ params }) => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [course, setCourse] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (status === "loading") return;
    
    if (!session) {
      router.push("/login?redirect=/purchase/" + params.courseId);
      return;
    }

    fetchCourse();
  }, [session, status, params.courseId]);

  const fetchCourse = async () => {
    try {
      const response = await fetch(`/api/courses/${params.courseId}`);
      if (response.ok) {
        const data = await response.json();
        setCourse(data.course);
      } else {
        setError("Course not found");
      }
    } catch (error) {
      console.error("Error fetching course:", error);
      setError("Error loading course");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePurchase = async () => {
    if (!session) {
      router.push("/login?redirect=/purchase/" + params.courseId);
      return;
    }

    setIsPurchasing(true);
    setError("");

    try {
      const response = await fetch("/api/purchase", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          courseId: params.courseId,
          userId: session.user.id,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Redirect to success page or my courses
        router.push("/my-courses?purchased=true");
      } else {
        setError(data.message || "Purchase failed");
      }
    } catch (error) {
      console.error("Error purchasing course:", error);
      setError("Something went wrong. Please try again.");
    } finally {
      setIsPurchasing(false);
    }
  };

  if (isLoading) {
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
          <div className="text-red-600 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Course Not Found</h1>
          <p className="text-gray-600 mb-4">{error || "The course you're looking for doesn't exist."}</p>
          <button
            onClick={() => router.push("/courses")}
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg"
          >
            Browse Courses
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Course Details */}
          <div className="space-y-6">
            {/* Course Image */}
            <div className="relative h-64 w-full rounded-lg overflow-hidden">
              <Image
                src={course.thumbnail}
                alt={course.title}
                fill
                className="object-cover"
              />
              {course.isFeatured && (
                <div className="absolute top-4 left-4 bg-red-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
                  Featured
                </div>
              )}
            </div>

            {/* Course Info */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-gray-500">{course.category}</span>
                <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
                  course.level === 'Beginner' ? 'bg-green-100 text-green-800' :
                  course.level === 'Intermediate' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {course.level}
                </span>
              </div>

              <h1 className="text-3xl font-bold text-gray-900 mb-4">{course.title}</h1>

              <p className="text-gray-600 mb-6">{course.description}</p>

              {/* Instructor */}
              <div className="flex items-center space-x-4 mb-6">
                <div className="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center">
                  <span className="text-lg font-semibold text-gray-600">
                    {course.instructor?.name?.charAt(0) || 'I'}
                  </span>
                </div>
                <div>
                  <p className="font-medium text-gray-900">{course.instructor?.name}</p>
                  <p className="text-sm text-gray-500">Instructor</p>
                </div>
              </div>

              {/* Course Stats */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900">{course.videos?.length || 0}</p>
                  <p className="text-sm text-gray-500">Videos</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900">{course.duration}</p>
                  <p className="text-sm text-gray-500">Duration</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900">{course.enrollmentCount || 0}</p>
                  <p className="text-sm text-gray-500">Students</p>
                </div>
              </div>

              {/* Features */}
              {course.features && course.features.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">What's Included</h3>
                  <ul className="space-y-2">
                    {course.features.map((feature, index) => (
                      <li key={index} className="flex items-center">
                        <svg className="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* Purchase Card */}
          <div className="lg:sticky lg:top-8">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Complete Your Purchase</h2>

              {/* Price */}
              <div className="mb-6">
                <div className="flex items-center space-x-3">
                  <span className="text-4xl font-bold text-gray-900">
                    ₹{course.price?.toLocaleString()}
                  </span>
                  {course.originalPrice && course.originalPrice > course.price && (
                    <span className="text-xl text-gray-500 line-through">
                      ₹{course.originalPrice.toLocaleString()}
                    </span>
                  )}
                </div>
                {course.originalPrice && course.originalPrice > course.price && (
                  <p className="text-sm text-green-600 mt-1">
                    Save ₹{(course.originalPrice - course.price).toLocaleString()}
                  </p>
                )}
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
                  {error}
                </div>
              )}

              {/* Purchase Button */}
              <button
                onClick={handlePurchase}
                disabled={isPurchasing}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-4 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isPurchasing ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </span>
                ) : (
                  `Purchase for ₹${course.price?.toLocaleString()}`
                )}
              </button>

              {/* Security Badge */}
              <div className="mt-6 text-center">
                <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                  </svg>
                  <span>Secure Payment</span>
                </div>
              </div>

              {/* Money Back Guarantee */}
              <div className="mt-4 text-center">
                <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>30-Day Money Back Guarantee</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PurchasePage;
