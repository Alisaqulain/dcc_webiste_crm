'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';

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
    <div className="relative h-52 w-full bg-gradient-to-br from-slate-100 to-slate-50 dcc-image-zoom">
      {thumb ? (
        isDataUrl(thumb) ? (
          <img src={thumb} alt={alt} className="absolute inset-0 w-full h-full object-cover dcc-zoom-target" />
        ) : (
          <Image src={thumb} alt={alt} fill className="object-cover dcc-zoom-target" unoptimized />
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
      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/30 via-transparent to-transparent opacity-60 pointer-events-none" />
      {badge}
    </div>
  );
}

export function ComboCard({ combo, owned, session, onPurchase, onViewMore }) {
  const courseCount = combo.courseCount || (combo.courseIds || []).length;

  return (
    <motion.article
      whileHover={{ y: -8 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className="group flex flex-col h-full dcc-card-premium border-amber-200/70 hover:border-amber-300/80"
    >
      <CatalogImage
        src={combo.thumbnail}
        alt={combo.title}
        badge={
          <>
            <span className="absolute top-3 left-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-md">
              COMBO · {courseCount} courses
            </span>
            <span className="absolute top-3 right-3 bg-emerald-600/95 text-white text-xs font-semibold px-2.5 py-1 rounded-full shadow-md backdrop-blur-sm">
              Lifetime access
            </span>
          </>
        }
      />
      <div className="flex flex-col flex-1 p-5 sm:p-6">
        <h3 className="text-lg font-bold text-slate-900 group-hover:text-red-700 transition-colors duration-200 line-clamp-2">
          {combo.title}
        </h3>
        <p className="text-sm text-slate-600 mt-2 line-clamp-2 flex-1 leading-relaxed">
          {combo.shortDescription}
        </p>
        {(combo.courseIds || []).length > 0 && (
          <ul className="mt-3 space-y-1.5">
            {(combo.courseIds || []).slice(0, 3).map((c) => (
              <li key={c._id} className="text-xs text-slate-500 flex items-center gap-1.5">
                <span className="text-amber-500 font-bold">✓</span>
                <span className="truncate">{c.title}</span>
              </li>
            ))}
            {courseCount > 3 && (
              <li className="text-xs text-slate-400 font-medium">+{courseCount - 3} more included</li>
            )}
          </ul>
        )}
        <div className="mt-5 pt-5 border-t border-slate-100">
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
                className="flex-1 dcc-btn-primary dcc-btn-md w-full sm:w-auto"
              >
                {session ? 'Buy bundle' : 'Login to buy'}
              </button>
            )}
            <Link
              href={`/combo/${combo._id}`}
              className="flex-1 dcc-btn-secondary dcc-btn-md text-center"
            >
              View details
            </Link>
            <button
              type="button"
              onClick={() => onViewMore(combo)}
              className="dcc-btn-outline dcc-btn-md px-4"
            >
              More info
            </button>
          </div>
        </div>
      </div>
    </motion.article>
  );
}

export function SingleCourseCard({
  course,
  isOwned,
  accessCourseId,
  session,
  onPurchase,
  onViewMore,
}) {
  const openId = accessCourseId || course._id;
  const levelClass =
    course.level === 'Beginner'
      ? 'bg-emerald-100/90 text-emerald-800 border border-emerald-200/60'
      : course.level === 'Intermediate'
        ? 'bg-amber-100/90 text-amber-800 border border-amber-200/60'
        : 'bg-rose-100/90 text-rose-800 border border-rose-200/60';

  return (
    <motion.article
      whileHover={{ y: -8 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className="group flex flex-col h-full dcc-card-premium hover:border-red-100/80"
    >
      <CatalogImage
        src={course.thumbnail}
        alt={course.title}
        badge={
          <>
            {course.isFeatured && (
              <span className="absolute top-3 left-3 dcc-badge-red shadow-md">
                Featured
              </span>
            )}
            <span
              className={`absolute top-3 right-3 text-xs font-semibold px-2.5 py-1 rounded-full shadow-sm backdrop-blur-sm ${levelClass}`}
            >
              {course.level}
            </span>
          </>
        }
      />
      <div className="flex flex-col flex-1 p-5 sm:p-6">
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            {course.category}
          </span>
          <span className="text-xs text-slate-400 font-medium">{course.duration}</span>
        </div>
        <h3 className="text-lg font-bold text-slate-900 group-hover:text-red-700 transition-colors duration-200 line-clamp-2">
          {course.title}
        </h3>
        {course.banner && (
          <p className="mt-2 text-xs font-medium text-red-700 bg-red-50 border border-red-100 rounded-lg px-2.5 py-1 line-clamp-1">
            {course.banner}
          </p>
        )}
        <p className="text-sm text-slate-600 mt-2 line-clamp-3 flex-1 leading-relaxed">
          {course.shortDescription || course.description}
        </p>
        {course.perks?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {course.perks.slice(0, 2).map((perk, i) => (
              <span
                key={i}
                className="text-xs bg-emerald-50 text-emerald-800 border border-emerald-100 px-2 py-0.5 rounded-full font-medium"
              >
                {perk}
              </span>
            ))}
          </div>
        )}
        <div className="mt-5 pt-5 border-t border-slate-100">
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
                href={`/course/${openId}`}
                className="dcc-btn-success dcc-btn-md dcc-btn-block text-center"
              >
                Continue learning
              </Link>
            ) : (
              <button
                type="button"
                onClick={() => onPurchase(course)}
                className="dcc-btn-primary dcc-btn-md dcc-btn-block"
              >
                {session ? 'Purchase' : 'Login to purchase'}
              </button>
            )}
            <div className="grid grid-cols-2 gap-2">
              <Link
                href={`/course/${course._id}`}
                className="dcc-btn-secondary dcc-btn-sm text-center py-2.5"
              >
                View course
              </Link>
              <button
                type="button"
                onClick={() => onViewMore(course)}
                disabled={!course.viewMore}
                className={`dcc-btn-sm py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                  course.viewMore
                    ? 'dcc-btn-outline'
                    : 'text-slate-300 border border-slate-100 cursor-not-allowed bg-slate-50'
                }`}
              >
                More info
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.article>
  );
}

export function SectionShell({ id, children, className = '' }) {
  return (
    <section id={id} className={`scroll-mt-24 ${className}`}>
      {children}
    </section>
  );
}
