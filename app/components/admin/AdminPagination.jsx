'use client';

export default function AdminPagination({ pagination, page, onPageChange, label = 'items' }) {
  if (!pagination || pagination.totalPages <= 1) {
    if (pagination?.total > 0) {
      return (
        <p className="mt-6 text-sm text-gray-600">
          Showing {pagination.total} {label}
        </p>
      );
    }
    return null;
  }

  const total = pagination.totalPages || 1;
  const windowSize = 5;
  let start = Math.max(1, page - 2);
  let end = Math.min(total, start + windowSize - 1);
  start = Math.max(1, end - windowSize + 1);
  const pageNumbers = [];
  for (let i = start; i <= end; i++) pageNumbers.push(i);

  return (
    <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
      <p className="text-sm text-gray-600">
        Page {pagination.page} of {pagination.totalPages} ({pagination.total} {label})
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={!pagination.hasPrev}
          className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Previous
        </button>
        {pageNumbers.map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onPageChange(n)}
            className={`min-w-[2.5rem] px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              n === page
                ? 'bg-red-600 text-white shadow'
                : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            {n}
          </button>
        ))}
        <button
          type="button"
          onClick={() => onPageChange(Math.min(pagination.totalPages, page + 1))}
          disabled={!pagination.hasNext}
          className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Next
        </button>
      </div>
    </div>
  );
}
