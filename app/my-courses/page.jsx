"use client";
import React, { useState, useEffect, useCallback, Suspense } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import ProfileCompletionModal from "../components/ProfileCompletionModal";
import PageHeader from "../components/ui/PageHeader";
import AnimatedSection from "../components/ui/AnimatedSection";
import EmptyState from "../components/ui/EmptyState";
import PrimaryButton from "../components/ui/PrimaryButton";
import SectionTitle from "../components/ui/SectionTitle";
import { getCourseThumbnail, isDataUrl } from "../components/courses/CourseCatalogCards";

const getProgress = (course) => {
  if (typeof course?.progress === "number" && !Number.isNaN(course.progress)) {
    return Math.min(100, Math.max(0, Math.round(course.progress)));
  }
  return null;
};

const levelBadgeClass = (level) => {
  if (level === "Beginner") return "bg-emerald-100 text-emerald-800";
  if (level === "Intermediate") return "bg-amber-100 text-amber-800";
  return "bg-rose-100 text-rose-800";
};

function EnrolledCourseCard({ course }) {
  const thumb = getCourseThumbnail(course.thumbnail);
  const progress = getProgress(course);

  return (
    <article className="group flex flex-col h-full dcc-card-premium hover:border-red-100/80">
      <div className="relative h-52 w-full bg-slate-100 dcc-image-zoom">
        {thumb ? (
          isDataUrl(thumb) ? (
            <img src={thumb} alt={course.title} className="absolute inset-0 w-full h-full object-cover dcc-zoom-target" />
          ) : (
            <Image
              src={thumb}
              alt={course.title}
              fill
              className="object-cover dcc-zoom-target"
              unoptimized
            />
          )
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-slate-400">
            <svg className="w-14 h-14" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
        <span className="absolute top-3 left-3 bg-emerald-600 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow">
          Enrolled
        </span>
        {course.level && (
          <span className={`absolute top-3 right-3 text-xs font-semibold px-2.5 py-1 rounded-full shadow ${levelBadgeClass(course.level)}`}>
            {course.level}
          </span>
        )}
      </div>

      <div className="flex flex-col flex-1 p-5 sm:p-6">
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">
            {course.category}
          </span>
          {course.duration && (
            <span className="text-xs text-slate-400">{course.duration}</span>
          )}
        </div>

        <h3 className="text-lg font-bold text-slate-900 group-hover:text-red-700 transition-colors line-clamp-2">
          {course.title}
        </h3>

        <p className="text-sm text-slate-600 mt-2 line-clamp-2 flex-1">
          {course.shortDescription || course.description}
        </p>

        {course.instructor?.name && (
          <div className="flex items-center gap-2 mt-4">
            <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center shrink-0">
              <span className="text-sm font-semibold text-red-700">
                {course.instructor.name.charAt(0)}
              </span>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-900">{course.instructor.name}</p>
              <p className="text-xs text-slate-500">Instructor</p>
            </div>
          </div>
        )}

        {progress !== null && (
          <div className="mt-4 pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="font-medium text-slate-700">Progress</span>
              <span className="font-semibold text-red-600">{progress}%</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
              <div
                className="bg-gradient-to-r from-red-500 to-red-600 h-2 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        <div className={`${progress !== null ? "mt-4" : "mt-4 pt-4 border-t border-slate-100"}`}>
          <PrimaryButton href={`/course/${course._id}`} className="w-full" size="md">
            Continue Learning
          </PrimaryButton>
        </div>
      </div>
    </article>
  );
}

function MyCoursesContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [courses, setCourses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [profilePayload, setProfilePayload] = useState(null);
  const [showProfileModal, setShowProfileModal] = useState(false);

  const fetchProfile = useCallback(async () => {
    try {
      const r = await fetch("/api/user/profile");
      if (r.ok) setProfilePayload(await r.json());
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (status === "loading") return;

    if (!session) {
      router.push("/login?redirect=/my-courses");
      return;
    }

    fetchMyCourses();
    fetchProfile();
  }, [session, status, fetchProfile]);

  const fetchMyCourses = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/my-courses");

      if (response.ok) {
        const data = await response.json();
        setCourses(data.courses || []);
      } else {
        setError("Error loading your courses");
      }
    } catch (error) {
      console.error("Error fetching courses:", error);
      setError("Error loading your courses");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!profilePayload?.profile) return;
    const p = profilePayload.profile;
    const incomplete =
      !String(p.mobile || "").trim() || !String(p.state || "").trim();
    if (!incomplete) {
      setShowProfileModal(false);
      return;
    }
    if (typeof window === "undefined") return;
    const snoozeUntil = parseInt(
      localStorage.getItem("dcc_profile_snooze_until") || "0",
      10
    );
    const snoozed = Date.now() < snoozeUntil;
    const fromPayment =
      new URLSearchParams(window.location.search).get("completeProfile") ===
      "1";
    if (fromPayment || !snoozed) setShowProfileModal(true);
  }, [profilePayload]);

  const closeProfileModal = useCallback(() => {
    setShowProfileModal(false);
    fetchProfile();
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    if (url.searchParams.has("completeProfile")) {
      url.searchParams.delete("completeProfile");
      window.history.replaceState(
        {},
        "",
        url.pathname + (url.search || "")
      );
    }
  }, [fetchProfile]);

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-red-50/20 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto" />
          <p className="mt-4 text-slate-600">Loading your courses...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-red-50/20">
        <PageHeader
          eyebrow="Your Library"
          title="My Courses"
          description="Continue your learning journey with your purchased courses"
        />
        <AnimatedSection className="max-w-lg mx-auto px-4 py-16">
          <EmptyState
            icon={
              <svg className="w-16 h-16 text-red-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            }
            title="Error Loading Courses"
            description={error}
            actionLabel="Try Again"
            onAction={() => fetchMyCourses()}
          />
        </AnimatedSection>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-red-50/20">
      <ProfileCompletionModal
        open={showProfileModal}
        onClose={closeProfileModal}
        initialMobile={profilePayload?.profile?.mobile || ""}
        initialState={profilePayload?.profile?.state || ""}
      />

      <PageHeader
        eyebrow="Your Library"
        title="My Courses"
        description="Continue your learning journey with your purchased courses"
      />

      <AnimatedSection className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14">
        {searchParams.get("purchased") === "true" && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl mb-8 flex items-center gap-2">
            <svg className="w-5 h-5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="text-sm font-medium">
              Course purchased successfully! You can now access your course below.
            </span>
          </div>
        )}

        {courses.length > 0 ? (
          <>
            <SectionTitle
              align="left"
              title="Enrolled Courses"
              subtitle={`${courses.length} course${courses.length === 1 ? "" : "s"} in your library`}
              className="mb-8 md:mb-10"
            />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
              {courses.map((course, index) => (
                <AnimatedSection key={course._id} delay={index * 0.05}>
                  <EnrolledCourseCard course={course} />
                </AnimatedSection>
              ))}
            </div>
          </>
        ) : (
          <EmptyState
            icon={
              <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            }
            title="No courses yet"
            description="You haven't purchased any courses yet. Start your learning journey today!"
            actionLabel="Browse Courses"
            actionHref="/courses"
          />
        )}
      </AnimatedSection>
    </div>
  );
}

const MyCoursesPage = () => {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600" />
        </div>
      }
    >
      <MyCoursesContent />
    </Suspense>
  );
};

export default MyCoursesPage;
