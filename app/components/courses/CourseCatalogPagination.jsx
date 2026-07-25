'use client';

export default function CourseCatalogPagination({ pagination, onPageChange }) {
  if (!pagination) return null;

  const { currentPage, totalPages, totalCourses, hasPrev, hasNext } = pagination;

  if (totalCourses <= 0) return null;

  const windowSize = 5;
  let start = Math.max(1, currentPage - 2);
  let end = Math.min(totalPages, start + windowSize - 1);
  start = Math.max(1, end - windowSize + 1);
  const pageNumbers = [];
  for (let i = start; i <= end; i++) pageNumbers.push(i);

  return (
    <div className="mt-10 pt-8 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
      <p className="text-sm text-slate-600">
        Showing {(currentPage - 1) * pagination.limit + 1}–
        {Math.min(currentPage * pagination.limit, totalCourses)} of {totalCourses} courses
      </p>

      {totalPages > 1 && (
        <div className="flex flex-wrap items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            disabled={!hasPrev}
            className="px-4 py-2 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 hover:bg-white hover:border-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            aria-label="Previous page"
          >
            ← Previous
          </button>

          {pageNumbers.map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => onPageChange(n)}
              aria-label={`Page ${n}`}
              aria-current={n === currentPage ? 'page' : undefined}
              className={`min-w-[2.5rem] px-3 py-2 rounded-xl text-sm font-semibold transition-colors ${
                n === currentPage
                  ? 'bg-red-600 text-white shadow-md shadow-red-600/20'
                  : 'border border-slate-200 text-slate-700 hover:bg-white hover:border-slate-300'
              }`}
            >
              {n}
            </button>
          ))}

          <button
            type="button"
            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
            disabled={!hasNext}
            className="px-4 py-2 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 hover:bg-white hover:border-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            aria-label="Next page"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
