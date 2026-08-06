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

const levelBadgeClass = (level) => {
  if (level === "Beginner") return "bg-emerald-100 text-emerald-800";
  if (level === "Intermediate") return "bg-amber-100 text-amber-800";
  return "bg-rose-100 text-rose-800";
};

function EnrolledAppCard({ app }) {
  const thumb = getCourseThumbnail(app.thumbnail);
  const videoCount = app.videoCount ?? 0;
  const materialCount = app.materialCount ?? 0;

  return (
    <article className="group flex flex-col h-full dcc-card-premium hover:border-violet-200/80">
      <div className="relative h-52 w-full bg-slate-100 dcc-image-zoom">
        {thumb ? (
          isDataUrl(thumb) ? (
            <img src={thumb} alt={app.title} className="absolute inset-0 w-full h-full object-cover dcc-zoom-target" />
          ) : (
            <Image
              src={thumb}
              alt={app.title}
              fill
              className="object-cover dcc-zoom-target"
              unoptimized
            />
          )
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-slate-400">
            <svg className="w-14 h-14" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
        )}
        <span className="absolute top-3 left-3 bg-violet-600 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow">
          Purchased
        </span>
        {app.level && (
          <span className={`absolute top-3 right-3 text-xs font-semibold px-2.5 py-1 rounded-full shadow ${levelBadgeClass(app.level)}`}>
            {app.level}
          </span>
        )}
      </div>

      <div className="flex flex-col flex-1 p-5 sm:p-6">
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">
            {app.category || "App"}
          </span>
          {app.duration && (
            <span className="text-xs text-slate-400">{app.duration}</span>
          )}
        </div>

        <h3 className="text-lg font-bold text-slate-900 group-hover:text-violet-700 transition-colors line-clamp-2">
          {app.title}
        </h3>

        <p className="text-sm text-slate-600 mt-2 line-clamp-2 flex-1">
          {app.shortDescription || app.description}
        </p>

        <div className="flex flex-wrap gap-2 mt-4 text-xs font-medium text-slate-600">
          <span className="inline-flex items-center gap-1 bg-slate-100 px-2.5 py-1 rounded-full">
            {videoCount} video{videoCount === 1 ? "" : "s"}
          </span>
          {materialCount > 0 && (
            <span className="inline-flex items-center gap-1 bg-slate-100 px-2.5 py-1 rounded-full">
              {materialCount} file{materialCount === 1 ? "" : "s"}
            </span>
          )}
        </div>

        {app.instructor?.name && (
          <div className="flex items-center gap-2 mt-4">
            <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center shrink-0">
              <span className="text-sm font-semibold text-violet-700">
                {app.instructor.name.charAt(0)}
              </span>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-900">{app.instructor.name}</p>
              <p className="text-xs text-slate-500">Instructor</p>
            </div>
          </div>
        )}

        <div className="mt-4 pt-4 border-t border-slate-100">
          <PrimaryButton href={`/course/${app._id}`} className="w-full !from-violet-600 !to-violet-700 hover:!from-violet-600 hover:!to-violet-800" size="md">
            Open App
          </PrimaryButton>
        </div>
      </div>
    </article>
  );
}

function MyAppsContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [apps, setApps] = useState([]);
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
      router.push("/login?redirect=/my-apps");
      return;
    }

    fetchMyApps();
    fetchProfile();
  }, [session, status, fetchProfile, router]);

  const fetchMyApps = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/my-apps");

      if (response.ok) {
        const data = await response.json();
        setApps(data.apps || []);
      } else {
        setError("Error loading your apps");
      }
    } catch (err) {
      console.error("Error fetching apps:", err);
      setError("Error loading your apps");
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
      <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-violet-50/20 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600 mx-auto" />
          <p className="mt-4 text-slate-600">Loading your apps...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-violet-50/20">
        <PageHeader
          eyebrow="Your Library"
          title="My Apps"
          description="Access videos, PDFs, and resources from your purchased apps"
        />
        <AnimatedSection className="max-w-lg mx-auto px-4 py-16">
          <EmptyState
            icon={
              <svg className="w-16 h-16 text-violet-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            }
            title="Error Loading Apps"
            description={error}
            actionLabel="Try Again"
            onAction={() => fetchMyApps()}
          />
        </AnimatedSection>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-violet-50/20">
      <ProfileCompletionModal
        open={showProfileModal}
        onClose={closeProfileModal}
        initialMobile={profilePayload?.profile?.mobile || ""}
        initialState={profilePayload?.profile?.state || ""}
      />

      <PageHeader
        eyebrow="Your Library"
        title="My Apps"
        description="Access videos, PDFs, and ZIP files from your purchased apps"
      />

      <AnimatedSection className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14">
        {searchParams.get("purchased") === "true" && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl mb-8 flex items-center gap-2">
            <svg className="w-5 h-5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="text-sm font-medium">
              App purchased successfully! You can now access your app below.
            </span>
          </div>
        )}

        {apps.length > 0 ? (
          <>
            <SectionTitle
              align="left"
              title="Purchased Apps"
              subtitle={`${apps.length} app${apps.length === 1 ? "" : "s"} in your library`}
              className="mb-8 md:mb-10"
            />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
              {apps.map((app, index) => (
                <AnimatedSection key={app._id} delay={index * 0.05}>
                  <EnrolledAppCard app={app} />
                </AnimatedSection>
              ))}
            </div>
          </>
        ) : (
          <EmptyState
            icon={
              <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            }
            title="No apps yet"
            description="You haven't purchased any apps yet. Browse our app catalog to get started!"
            actionLabel="Browse Apps"
            actionHref="/apps"
          />
        )}
      </AnimatedSection>
    </div>
  );
}

const MyAppsPage = () => {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600" />
        </div>
      }
    >
      <MyAppsContent />
    </Suspense>
  );
};

export default MyAppsPage;
