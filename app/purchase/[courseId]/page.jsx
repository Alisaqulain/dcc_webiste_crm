"use client";
import React, { useState, useEffect, Suspense } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams, useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import CoursePayCard from "../../components/CoursePayCard";
import PageHeader from "@/app/components/ui/PageHeader";
import AnimatedSection from "@/app/components/ui/AnimatedSection";
import SectionTitle from "@/app/components/ui/SectionTitle";
import EmptyState from "@/app/components/ui/EmptyState";

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
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto" />
          <p className="mt-4 text-slate-600">Loading course…</p>
        </div>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="min-h-screen bg-slate-50">
        <PageHeader
          eyebrow="Checkout"
          title="Course Not Found"
          description={error || "The course you're looking for doesn't exist."}
        />
        <AnimatedSection className="max-w-lg mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <EmptyState
            title="Unable to load checkout"
            description="This course may have been removed or the link is incorrect."
            actionLabel="Browse Courses"
            onAction={() => router.push("/courses")}
          />
        </AnimatedSection>
      </div>
    );
  }

  const c = { ...course, _id: course._id || courseId };
  const mustCompletePurchase =
    (session?.user && session.user.isActive === false) || pendingPurchase;

  return (
    <div className="min-h-screen bg-slate-50">
      {mustCompletePurchase && (
        <div className="bg-amber-50 border-b border-amber-200 text-amber-950 px-4 py-3 text-center text-sm">
          <span className="font-semibold">Payment required.</span> Finish checkout on this page to
          access your courses, profile, and learning content. This is a full checkout page — not a popup
          you can close without paying.
        </div>
      )}

      <PageHeader
        eyebrow="Secure Checkout"
        title={course.title}
        description={course.category ? `${course.category} · Complete payment to unlock lifetime access` : "Complete payment to unlock lifetime access"}
      />

      <AnimatedSection className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          <div className="space-y-8">
            <div className="relative h-64 sm:h-72 w-full rounded-2xl overflow-hidden border border-slate-200 shadow-sm bg-white">
              {getCourseThumbnail(course.thumbnail) ? (
                <Image
                  src={getCourseThumbnail(course.thumbnail)}
                  alt={course.title}
                  fill
                  className="object-cover"
                  unoptimized
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-400 bg-slate-100">
                  <span>No image</span>
                </div>
              )}
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
              <SectionTitle
                title="Course details"
                subtitle={course.description}
                align="left"
                className="mb-0"
              />
            </div>
          </div>

          <div className="lg:sticky lg:top-8 lg:self-start">
            <div className="bg-white rounded-2xl border-2 border-red-100 shadow-lg p-6 sm:p-8">
              <SectionTitle
                title="Complete your purchase"
                subtitle="Pay securely with Razorpay. Complete payment to continue using your account."
                align="left"
                className="mb-6 md:mb-8"
              />
              <CoursePayCard
                course={c}
                initialCouponCode={couponFromUrl}
                couponLockedFromUrl={couponLockedFromUrl}
                onSuccess={() =>
                  router.push("/my-courses?purchased=true&completeProfile=1")
                }
              />
              {session?.user?.isActive === false && (
                <p className="mt-6 text-center text-sm text-slate-500">
                  Wrong course?{" "}
                  <Link href="/courses" className="text-red-600 font-medium hover:underline">
                    Browse all courses
                  </Link>{" "}
                  (you still need to purchase one to unlock your account).
                </p>
              )}
            </div>
          </div>
        </div>
      </AnimatedSection>
    </div>
  );
}

export default function PurchasePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600" />
        </div>
      }
    >
      <PurchaseContent />
    </Suspense>
  );
}
