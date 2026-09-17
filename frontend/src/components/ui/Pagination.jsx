import cn from '@/utils/cn';

/** Windowed page list with ellipses: 1 … 4 5 [6] 7 8 … 20 */
const buildPages = (page, totalPages) => {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, index) => index + 1);

  const pages = new Set([1, totalPages, page, page - 1, page + 1]);
  if (page <= 3) [2, 3, 4].forEach((value) => pages.add(value));
  if (page >= totalPages - 2) [totalPages - 3, totalPages - 2, totalPages - 1].forEach((v) => pages.add(v));

  const sorted = [...pages].filter((value) => value >= 1 && value <= totalPages).sort((a, b) => a - b);

  return sorted.reduce((acc, value, index) => {
    if (index > 0 && value - sorted[index - 1] > 1) acc.push('…');
    acc.push(value);
    return acc;
  }, []);
};

const Chevron = ({ direction }) => (
  <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
    {direction === 'left' ? (
      <path fillRule="evenodd" d="M12.8 4.3a1 1 0 010 1.4L8.5 10l4.3 4.3a1 1 0 01-1.4 1.4l-5-5a1 1 0 010-1.4l5-5a1 1 0 011.4 0z" clipRule="evenodd" />
    ) : (
      <path fillRule="evenodd" d="M7.2 15.7a1 1 0 010-1.4L11.5 10 7.2 5.7a1 1 0 011.4-1.4l5 5a1 1 0 010 1.4l-5 5a1 1 0 01-1.4 0z" clipRule="evenodd" />
    )}
  </svg>
);

const Pagination = ({ meta, onPageChange, className, compact = false }) => {
  if (!meta || meta.totalPages <= 1) return null;

  const { page, totalPages, total, limit, hasPrevPage, hasNextPage } = meta;
  const pages = buildPages(page, totalPages);
  const from = (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  const base =
    'inline-flex h-10 min-w-10 items-center justify-center rounded-xl px-3 text-sm font-semibold transition-all duration-200 active:scale-95';
  const idle = 'border border-ink-200 bg-surface text-ink-700 shadow-soft hover:border-ink-300 hover:bg-ink-50';

  return (
    <nav className={cn('flex flex-col items-center gap-4 sm:flex-row sm:justify-between', className)} aria-label="Pagination">
      {!compact && (
        <p className="text-sm text-ink-500">
          Showing <span className="font-semibold text-ink-800">{from}</span>–
          <span className="font-semibold text-ink-800">{to}</span> of{' '}
          <span className="font-semibold text-ink-800">{total}</span>
        </p>
      )}

      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={!hasPrevPage}
          className={cn(base, idle, 'disabled:cursor-not-allowed disabled:opacity-40 disabled:active:scale-100')}
          aria-label="Previous page"
        >
          <Chevron direction="left" />
          <span className="ml-1 hidden sm:inline">Prev</span>
        </button>

        <div className="hidden items-center gap-1.5 sm:flex">
          {pages.map((value, index) =>
            value === '…' ? (
              <span key={`gap-${index}`} className="px-1.5 text-sm text-ink-400">…</span>
            ) : (
              <button
                key={value}
                type="button"
                onClick={() => onPageChange(value)}
                aria-current={value === page ? 'page' : undefined}
                className={cn(base, value === page ? 'bg-brand-600 text-white shadow-glow-sm' : idle)}
              >
                {value}
              </button>
            )
          )}
        </div>

        <span className="rounded-xl bg-ink-100 px-3 py-2 text-sm font-semibold text-ink-700 sm:hidden">
          {page} / {totalPages}
        </span>

        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={!hasNextPage}
          className={cn(base, idle, 'disabled:cursor-not-allowed disabled:opacity-40 disabled:active:scale-100')}
          aria-label="Next page"
        >
          <span className="mr-1 hidden sm:inline">Next</span>
          <Chevron direction="right" />
        </button>
      </div>
    </nav>
  );
};

export default Pagination;
