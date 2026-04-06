"use client";
import React, { useState, useEffect, Suspense } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams, useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import CoursePayCard from "../../components/CoursePayCard";

const getCourseThumbnail = (thumbnail) => {
  if (!thumbnail) return null;
  if (thumbnail.startsWith("http://") || thumbnail.startsWith("https://")) {
    return thumbnail;
  }
  if (thumbnail.startsWith("/")) {
    return thumbnail;
  }
  return `/${thumbnail}`;
};

function PurchaseContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const courseId = params.courseId;
  const couponFromUrl = searchParams.get("coupon") || "";
  const couponLockedFromUrl = Boolean(couponFromUrl);
  const pendingPurchase = searchParams.get("pendingPurchase") === "1";

  const { data: session, status } = useSession();
  const router = useRouter();
  const [course, setCourse] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (status === "loading") return;

    if (!session) {
      const dest = `/purchase/${courseId}${
        couponFromUrl ? `?coupon=${encodeURIComponent(couponFromUrl)}` : ""
      }`;
      router.push("/login?redirect=" + encodeURIComponent(dest));
      return;
    }

    fetchCourse();
  }, [session, status, courseId, couponFromUrl, router]);

  const fetchCourse = async () => {
    try {
      const response = await fetch(`/api/courses/${courseId}`);
      if (response.ok) {
        const data = await response.json();
        setCourse(data.course);
      } else {
        setError("Course not found");
      }
    } catch (err) {
      console.error("Error fetching course:", err);
      setError("Error loading course");
    } finally {
      setIsLoading(false);
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
          <p className="text-gray-600 mb-4">
            {error || "The course you're looking for doesn't exist."}
          </p>
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

  const c = { ...course, _id: course._id || courseId };
  const mustCompletePurchase =
    (session?.user && session.user.isActive === false) || pendingPurchase;

  return (
    <div className="min-h-screen bg-gray-50">
      {mustCompletePurchase && (
        <div className="bg-amber-50 border-b border-amber-200 text-amber-950 px-4 py-3 text-center text-sm">
          <span className="font-semibold">Payment required.</span> Finish checkout on this page to
          access your courses, profile, and learning content. This is a full checkout page — not a popup
          you can close without paying.
        </div>
      )}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="relative h-64 w-full rounded-lg overflow-hidden">
              {getCourseThumbnail(course.thumbnail) ? (
                <Image
                  src={getCourseThumbnail(course.thumbnail)}
                  alt={course.title}
                  fill
                  className="object-cover"
                  unoptimized
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gray-100">
                  <span>No image</span>
                </div>
              )}
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <span className="text-sm text-gray-500">{course.category}</span>
              <h1 className="text-3xl font-bold text-gray-900 mt-2 mb-4">{course.title}</h1>
              <p className="text-gray-600">{course.description}</p>
            </div>
          </div>

          <div className="lg:sticky lg:top-8">
            <div className="bg-white rounded-lg shadow-lg border-2 border-red-100 p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Secure checkout</h2>
              <p className="text-sm text-gray-600 mb-6">
                Pay with Razorpay. No cancel button — complete payment to continue using your account.
              </p>
              <CoursePayCard
                course={c}
                initialCouponCode={couponFromUrl}
                couponLockedFromUrl={couponLockedFromUrl}
                onSuccess={() =>
                  router.push("/my-courses?purchased=true&completeProfile=1")
                }
              />
              {session?.user?.isActive === false && (
                <p className="mt-6 text-center text-sm text-gray-500">
                  Wrong course?{' '}
                  <Link href="/courses" className="text-red-600 font-medium hover:underline">
                    Browse all courses
                  </Link>{' '}
                  (you still need to purchase one to unlock your account).
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PurchasePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600" />
        </div>
      }
    >
      <PurchaseContent />
    </Suspense>
  );
}
