"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  ComboCard,
  SingleCourseCard,
  SectionShell,
} from "@/app/components/courses/CourseCatalogCards";
import CourseCatalogPagination from "@/app/components/courses/CourseCatalogPagination";
import PageHeader from "@/app/components/ui/PageHeader";
import PrimaryButton from "@/app/components/ui/PrimaryButton";

const COURSES_PER_PAGE = 12;

const CoursesPage = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [courses, setCourses] = useState([]);
  const [combos, setCombos] = useState([]);
  const [comboLoadError, setComboLoadError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isFetchingPage, setIsFetchingPage] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterLevel, setFilterLevel] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);
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
      setOwnedCourseIds(new Set((d.courses || []).map((c) => String(c._id))));
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
    router.replace(`/purchase/${checkoutId}${q.toString() ? `?${q}` : ""}`);
  }, [session, status, router]);

  const categories = [
    "Digital Marketing",
    "Web Development",
    "Data Science",
    "AI/ML",
    "Cloud Computing",
    "Cybersecurity",
    "Other",
  ];

  const levels = ["Beginner", "Intermediate", "Advanced"];

  useEffect(() => {
    setPage(1);
  }, [searchTerm, filterCategory, filterLevel, sortBy]);

  useEffect(() => {
    fetchCourses();
  }, [searchTerm, filterCategory, filterLevel, sortBy, page]);

  const fetchCourses = async () => {
    try {
      const isInitialLoad = courses.length === 0 && !pagination;
      if (isInitialLoad) {
        setIsLoading(true);
      } else {
        setIsFetchingPage(true);
      }
      const params = new URLSearchParams({
        published: "true",
        page: String(page),
        limit: String(COURSES_PER_PAGE),
        ...(searchTerm && { search: searchTerm }),
        ...(filterCategory && { category: filterCategory }),
        ...(filterLevel && { level: filterLevel }),
        ...(sortBy && { sortBy: sortBy }),
      });

      const [response, comboRes] = await Promise.all([
        fetch(`/api/courses?${params}`, { cache: "no-store" }),
        fetch(`/api/combos?t=${Date.now()}`, { cache: "no-store" }),
      ]);
      if (response.ok) {
        const data = await response.json();
        setCourses(data.courses || []);
        setPagination(data.pagination || null);
      }
      if (comboRes.ok) {
        const comboData = await comboRes.json();
        setCombos(comboData.combos || []);
        setComboLoadError("");
      } else {
        const err = await comboRes.json().catch(() => ({}));
        setCombos([]);
        setComboLoadError(err.message || "Could not load combo bundles");
      }
    } catch (error) {
      console.error("Error fetching courses:", error);
    } finally {
      setIsLoading(false);
      setIsFetchingPage(false);
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

  const handleViewMore = (item) => {
    setViewMoreCourse(item);
    setShowViewMoreModal(true);
  };

  const isComboFullyOwned = (combo) => {
    const ids = (combo.courseIds || []).map((c) => String(c._id));
    return ids.length > 0 && ids.every((id) => ownedCourseIds.has(id));
  };

  const handleComboPurchase = (combo) => {
    const dest = purchaseUrl(`/purchase/combo/${combo._id}`);
    if (!session) {
      router.push(`/login?redirect=${encodeURIComponent(dest)}`);
      return;
    }
    router.push(dest);
  };

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handlePageChange = (nextPage) => {
    setPage(nextPage);
    scrollTo("single-courses");
  };

  const totalCourseCount = pagination?.totalCourses ?? courses.length;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-red-600 border-t-transparent mx-auto" />
          <p className="mt-4 text-slate-600">Loading catalog…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {showPendingBanner && session && (
        <div className="bg-amber-50 border-b border-amber-200 text-amber-900 px-4 py-3 text-center text-sm">
          Complete your first course purchase to unlock your dashboard, referrals, and CRM.
        </div>
      )}
      {couponFromUrl && session && (
        <div className="bg-green-50 border-b border-green-200 text-green-900 px-4 py-3 text-center text-sm">
          Coupon <span className="font-mono font-semibold">{couponFromUrl.toUpperCase()}</span> applies at
          checkout.
        </div>
      )}
      {couponFromUrl && !session && status !== "loading" && (
        <div className="bg-blue-50 border-b border-blue-200 text-blue-900 px-4 py-3 text-center text-sm">
          Sign in to use coupon <span className="font-mono font-semibold">{couponFromUrl.toUpperCase()}</span>.
        </div>
      )}

      {/* Hero */}
      <PageHeader
        dark
        eyebrow="Digital Career Center"
        title="Our Courses"
        description="Save with combo bundles or pick individual courses — lifetime access on every purchase."
      >
        {combos.length > 0 && (
          <PrimaryButton onClick={() => scrollTo("combo-bundles")} className="!bg-amber-500 hover:!bg-amber-400 !text-slate-900">
            Combo bundles ({combos.length})
          </PrimaryButton>
        )}
        <PrimaryButton onClick={() => scrollTo("single-courses")} variant="secondary" className="!bg-white/10 !text-white !border-white/20">
          Single courses ({totalCourseCount})
        </PrimaryButton>
      </PageHeader>

      {/* ——— COMBO SECTION ——— */}
      <SectionShell
        id="combo-bundles"
        className="bg-gradient-to-b from-amber-50/80 via-orange-50/40 to-slate-50 border-b border-amber-100/60"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
            <div>
              <span className="inline-block text-xs font-bold uppercase tracking-wider text-amber-700 bg-amber-100 px-3 py-1 rounded-full mb-3">
                Best value
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">Combo course bundles</h2>
              <p className="text-slate-600 mt-2 max-w-xl">
                Multiple courses in one payment. One checkout — full bundle access for life.
              </p>
            </div>
            {combos.length > 0 && (
              <p className="text-sm text-slate-500 md:text-right">
                {combos.length} bundle{combos.length !== 1 ? "s" : ""} available
              </p>
            )}
          </div>

          {comboLoadError && (
            <p className="mb-6 text-sm text-amber-900 bg-amber-100/80 border border-amber-200 rounded-xl px-4 py-3">
              {comboLoadError}
            </p>
          )}

          {combos.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 lg:gap-8">
              {combos.map((combo) => (
                <ComboCard
                  key={combo._id}
                  combo={combo}
                  owned={isComboFullyOwned(combo)}
                  session={session}
                  onPurchase={handleComboPurchase}
                  onViewMore={handleViewMore}
                />
              ))}
            </div>
          ) : (
            !comboLoadError && (
              <div className="text-center py-14 bg-white/60 rounded-2xl border border-dashed border-amber-200">
                <p className="text-slate-600">No combo bundles right now. Check single courses below.</p>
              </div>
            )
          )}
        </div>
      </SectionShell>

      {/* ——— SINGLE COURSES SECTION ——— */}
      <SectionShell id="single-courses" className="bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
          <div className="mb-8">
            <span className="inline-block text-xs font-bold uppercase tracking-wider text-red-700 bg-red-50 px-3 py-1 rounded-full mb-3">
              Individual learning
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">Single courses</h2>
            <p className="text-slate-600 mt-2 max-w-xl">
              Choose one course and start at your own pace. Filter and search below.
            </p>
          </div>

          <div className="dcc-filter-panel">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">
              Find a course
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="dcc-label">Search</label>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Title or keyword…"
                  className="dcc-input text-sm py-2.5"
                />
              </div>
              <div>
                <label className="dcc-label">Category</label>
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="dcc-select text-sm py-2.5"
                >
                  <option value="">All categories</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="dcc-label">Level</label>
                <select
                  value={filterLevel}
                  onChange={(e) => setFilterLevel(e.target.value)}
                  className="dcc-select text-sm py-2.5"
                >
                  <option value="">All levels</option>
                  {levels.map((level) => (
                    <option key={level} value={level}>
                      {level}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="dcc-label">Sort</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="dcc-select text-sm py-2.5"
                >
                  <option value="newest">Newest first</option>
                  <option value="oldest">Oldest first</option>
                  <option value="price-low">Price: low to high</option>
                  <option value="price-high">Price: high to low</option>
                  <option value="popular">Most popular</option>
                </select>
              </div>
            </div>
          </div>

          {courses.length > 0 ? (
            <>
              <p className="text-sm text-slate-500 mb-6">
                {pagination
                  ? `Page ${pagination.currentPage} of ${pagination.totalPages} · ${pagination.totalCourses} course${pagination.totalCourses !== 1 ? "s" : ""} total`
                  : `Showing ${courses.length} course${courses.length !== 1 ? "s" : ""}`}
              </p>
              <div className={`grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 lg:gap-8 transition-opacity duration-200 ${isFetchingPage ? "opacity-50 pointer-events-none" : ""}`}>
                {courses.map((course) => (
                  <SingleCourseCard
                    key={course._id}
                    course={course}
                    isOwned={ownedCourseIds.has(String(course._id))}
                    session={session}
                    onPurchase={handlePurchase}
                    onViewMore={handleViewMore}
                  />
                ))}
              </div>
              <CourseCatalogPagination
                pagination={pagination}
                onPageChange={handlePageChange}
              />
            </>
          ) : (
            <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-200">
              <svg
                className="w-14 h-14 mx-auto text-slate-300 mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                />
              </svg>
              <h3 className="text-lg font-semibold text-slate-800 mb-1">No courses match your filters</h3>
              <p className="text-slate-500 text-sm">Try clearing search or filters.</p>
            </div>
          )}
        </div>
      </SectionShell>

      {/* View More Modal */}
      {showViewMoreModal && viewMoreCourse && (
        <div className="fixed inset-0 bg-slate-900/50 overflow-y-auto z-50 flex items-center justify-center p-4">
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center z-10 rounded-t-2xl">
              <h2 className="text-xl font-bold text-slate-900 pr-4">{viewMoreCourse.title}</h2>
              <button
                type="button"
                onClick={() => {
                  setShowViewMoreModal(false);
                  setViewMoreCourse(null);
                }}
                className="text-slate-400 hover:text-slate-700 p-1"
                aria-label="Close"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 space-y-5">
              {viewMoreCourse.banner && (
                <p className="text-sm font-medium text-red-800 bg-red-50 border-l-4 border-red-600 px-3 py-2 rounded">
                  {viewMoreCourse.banner}
                </p>
              )}
              {viewMoreCourse.description && (
                <div>
                  <h3 className="font-semibold text-slate-900 mb-2">Description</h3>
                  <p className="text-slate-700 whitespace-pre-wrap leading-relaxed">
                    {viewMoreCourse.description}
                  </p>
                </div>
              )}
              {viewMoreCourse.viewMore && (
                <div>
                  <h3 className="font-semibold text-slate-900 mb-2">Details</h3>
                  <div className="text-slate-700 whitespace-pre-wrap bg-slate-50 p-4 rounded-xl text-sm">
                    {viewMoreCourse.viewMore}
                  </div>
                </div>
              )}
              {viewMoreCourse.courseIds?.length > 0 && (
                <div>
                  <h3 className="font-semibold text-slate-900 mb-2">Included courses</h3>
                  <ul className="space-y-1 text-sm text-slate-600">
                    {viewMoreCourse.courseIds.map((c) => (
                      <li key={c._id}>• {c.title}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            <div className="sticky bottom-0 bg-white border-t px-6 py-4 flex justify-end rounded-b-2xl">
              <button
                type="button"
                onClick={() => {
                  setShowViewMoreModal(false);
                  setViewMoreCourse(null);
                }}
                className="bg-red-600 hover:bg-red-700 text-white px-6 py-2.5 rounded-xl font-semibold text-sm"
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
