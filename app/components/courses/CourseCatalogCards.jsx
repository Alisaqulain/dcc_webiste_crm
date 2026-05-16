'use client';

import Image from 'next/image';
import Link from 'next/link';

export function getCourseThumbnail(thumbnail) {
  if (!thumbnail) return null;
  if (
    thumbnail.startsWith('http://') ||
    thumbnail.startsWith('https://') ||
    thumbnail.startsWith('data:') ||
    thumbnail.startsWith('/')
  ) {
    return thumbnail;
  }
  return `/${thumbnail}`;
}

export function isDataUrl(url) {
  return url && url.startsWith('data:');
}

function CatalogImage({ src, alt, badge }) {
  const thumb = getCourseThumbnail(src);
  return (
    <div className="relative h-52 w-full bg-slate-100 overflow-hidden">
      {thumb ? (
        isDataUrl(thumb) ? (
          <img src={thumb} alt={alt} className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <Image src={thumb} alt={alt} fill className="object-cover" unoptimized />
        )
      ) : (
        <div className="absolute inset-0 flex items-center justify-center text-slate-400">
          <svg className="w-14 h-14" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </div>
      )}
      {badge}
    </div>
  );
}

export function ComboCard({ combo, owned, session, onPurchase, onViewMore }) {
  const courseCount = combo.courseCount || (combo.courseIds || []).length;

  return (
    <article className="group flex flex-col h-full bg-white rounded-2xl border border-amber-200/80 shadow-md hover:shadow-xl hover:border-amber-300 transition-all duration-300 overflow-hidden">
      <CatalogImage
        src={combo.thumbnail}
        alt={combo.title}
        badge={
          <>
            <span className="absolute top-3 left-3 bg-amber-500 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow">
              COMBO · {courseCount} courses
            </span>
            <span className="absolute top-3 right-3 bg-emerald-600 text-white text-xs font-semibold px-2.5 py-1 rounded-full shadow">
              Lifetime access
            </span>
          </>
        }
      />
      <div className="flex flex-col flex-1 p-5">
        <h3 className="text-lg font-bold text-slate-900 group-hover:text-red-700 transition-colors line-clamp-2">
          {combo.title}
        </h3>
        <p className="text-sm text-slate-600 mt-2 line-clamp-2 flex-1">
          {combo.shortDescription}
        </p>
        {(combo.courseIds || []).length > 0 && (
          <ul className="mt-3 space-y-1">
            {(combo.courseIds || []).slice(0, 3).map((c) => (
              <li key={c._id} className="text-xs text-slate-500 flex items-center gap-1.5">
                <span className="text-amber-500">✓</span>
                <span className="truncate">{c.title}</span>
              </li>
            ))}
            {courseCount > 3 && (
              <li className="text-xs text-slate-400">+{courseCount - 3} more included</li>
            )}
          </ul>
        )}
        <div className="mt-4 pt-4 border-t border-slate-100">
          {owned ? (
            <p className="text-base font-semibold text-emerald-700 mb-3">In your library</p>
          ) : (
            <div className="flex items-baseline gap-2 mb-4">
              <span className="text-2xl font-bold text-slate-900">
                ₹{Number(combo.price).toLocaleString('en-IN')}
              </span>
              {combo.originalPrice > combo.price && (
                <span className="text-sm text-slate-400 line-through">
                  ₹{Number(combo.originalPrice).toLocaleString('en-IN')}
                </span>
              )}
            </div>
          )}
          <div className="flex flex-col sm:flex-row gap-2">
            {!owned && (
              <button
                type="button"
                onClick={() => onPurchase(combo)}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2.5 px-4 rounded-xl text-sm font-semibold transition-colors"
              >
                {session ? 'Buy bundle' : 'Login to buy'}
              </button>
            )}
            <Link
              href={`/combo/${combo._id}`}
              className="flex-1 text-center py-2.5 px-4 rounded-xl text-sm font-semibold border border-slate-200 text-slate-800 hover:bg-slate-50 transition-colors"
            >
              View details
            </Link>
            <button
              type="button"
              onClick={() => onViewMore(combo)}
              className="py-2.5 px-4 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 border border-transparent hover:border-slate-200"
            >
              More info
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}

export function SingleCourseCard({
  course,
  isOwned,
  session,
  onPurchase,
  onViewMore,
}) {
  const levelClass =
    course.level === 'Beginner'
      ? 'bg-emerald-100 text-emerald-800'
      : course.level === 'Intermediate'
        ? 'bg-amber-100 text-amber-800'
        : 'bg-rose-100 text-rose-800';

  return (
    <article className="group flex flex-col h-full bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg hover:border-slate-300 transition-all duration-300 overflow-hidden">
      <CatalogImage
        src={course.thumbnail}
        alt={course.title}
        badge={
          <>
            {course.isFeatured && (
              <span className="absolute top-3 left-3 bg-red-600 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow">
                Featured
              </span>
            )}
            <span
              className={`absolute top-3 right-3 text-xs font-semibold px-2.5 py-1 rounded-full shadow ${levelClass}`}
            >
              {course.level}
            </span>
          </>
        }
      />
      <div className="flex flex-col flex-1 p-5">
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">
            {course.category}
          </span>
          <span className="text-xs text-slate-400">{course.duration}</span>
        </div>
        <h3 className="text-lg font-bold text-slate-900 group-hover:text-red-700 transition-colors line-clamp-2">
          {course.title}
        </h3>
        {course.banner && (
          <p className="mt-2 text-xs font-medium text-red-700 bg-red-50 border border-red-100 rounded-lg px-2 py-1 line-clamp-1">
            {course.banner}
          </p>
        )}
        <p className="text-sm text-slate-600 mt-2 line-clamp-3 flex-1">
          {course.shortDescription || course.description}
        </p>
        {course.perks?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {course.perks.slice(0, 2).map((perk, i) => (
              <span
                key={i}
                className="text-xs bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded-full"
              >
                {perk}
              </span>
            ))}
          </div>
        )}
        <div className="mt-4 pt-4 border-t border-slate-100">
          {isOwned ? (
            <p className="text-base font-semibold text-emerald-700 mb-3">In your library</p>
          ) : (
            <div className="flex items-baseline gap-2 mb-4">
              <span className="text-2xl font-bold text-slate-900">
                ₹{course.price?.toLocaleString('en-IN')}
              </span>
              {course.originalPrice > course.price && (
                <span className="text-sm text-slate-400 line-through">
                  ₹{course.originalPrice.toLocaleString('en-IN')}
                </span>
              )}
            </div>
          )}
          <div className="flex flex-col gap-2">
            {isOwned ? (
              <Link
                href={`/course/${course._id}`}
                className="w-full text-center bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-xl text-sm font-semibold transition-colors"
              >
                Continue learning
              </Link>
            ) : (
              <button
                type="button"
                onClick={() => onPurchase(course)}
                className="w-full bg-red-600 hover:bg-red-700 text-white py-2.5 rounded-xl text-sm font-semibold transition-colors"
              >
                {session ? 'Purchase' : 'Login to purchase'}
              </button>
            )}
            <div className="grid grid-cols-2 gap-2">
              <Link
                href={`/course/${course._id}`}
                className="text-center py-2 rounded-xl text-sm font-medium border border-slate-200 hover:bg-slate-50"
              >
                View course
              </Link>
              <button
                type="button"
                onClick={() => onViewMore(course)}
                disabled={!course.viewMore}
                className={`py-2 rounded-xl text-sm font-medium ${
                  course.viewMore
                    ? 'text-slate-700 hover:bg-slate-50 border border-slate-200'
                    : 'text-slate-300 border border-slate-100 cursor-not-allowed'
                }`}
              >
                More info
              </button>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

export function SectionShell({ id, children, className = '' }) {
  return (
    <section id={id} className={`scroll-mt-24 ${className}`}>
      {children}
    </section>
  );
}
