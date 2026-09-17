import cn from '@/utils/cn';
import { LoadingBlock } from './Spinner';
import { EmptyState, ErrorState } from './States';

/**
 * Admin table.
 *
 * Desktop renders a real <table> with a sticky header; below `md` each row
 * renders through `renderMobileCard`, so phones get a card list rather than a
 * table squeezed sideways.
 *
 * columns: [{ key, header, render?, className?, headerClassName? }]
 */
const DataTable = ({
  columns,
  rows,
  rowKey = (row) => row._id,
  loading,
  error,
  onRetry,
  emptyTitle = 'No records found',
  emptyDescription,
  emptyAction,
  renderMobileCard,
  onRowClick,
  className,
  dense = false,
}) => {
  if (loading) return <LoadingBlock label="Loading records…" />;
  if (error) return <ErrorState error={error} onRetry={onRetry} />;
  if (!rows?.length) {
    return <EmptyState compact title={emptyTitle} description={emptyDescription} action={emptyAction} />;
  }

  return (
    <div className={cn('animate-fade-in', className)}>
      {/* Desktop / laptop */}
      <div className="hidden overflow-hidden rounded-2xl border border-ink-200/80 bg-surface shadow-card md:block">
        <div className="scrollbar-thin max-h-[70vh] overflow-auto">
          <table className="w-full min-w-[640px] border-collapse text-left text-sm">
            <thead className="sticky top-0 z-10">
              <tr className="border-b border-ink-200 bg-ink-50/95 backdrop-blur">
                {columns.map((column) => (
                  <th
                    key={column.key}
                    scope="col"
                    className={cn(
                      'whitespace-nowrap px-4 py-3 text-[11px] font-bold uppercase tracking-[0.12em] text-ink-500',
                      column.headerClassName
                    )}
                  >
                    {column.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {rows.map((row) => (
                <tr
                  key={rowKey(row)}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  className={cn('row-hover', onRowClick && 'cursor-pointer')}
                >
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className={cn('align-middle', dense ? 'px-4 py-2.5' : 'px-4 py-3.5', column.className)}
                    >
                      {column.render ? column.render(row) : row[column.key]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Tablet / mobile */}
      <div className="flex flex-col gap-3 md:hidden">
        {rows.map((row, index) => (
          <div key={rowKey(row)} className="animate-fade-up" style={{ animationDelay: `${Math.min(index, 8) * 40}ms` }}>
            {renderMobileCard ? (
              renderMobileCard(row)
            ) : (
              <div className="card p-4">
                <dl className="space-y-2.5">
                  {columns
                    .filter((column) => column.header)
                    .map((column) => (
                      <div key={column.key} className="flex items-start justify-between gap-4">
                        <dt className="text-[11px] font-bold uppercase tracking-[0.12em] text-ink-500">{column.header}</dt>
                        <dd className="text-right text-sm text-ink-800">
                          {column.render ? column.render(row) : row[column.key]}
                        </dd>
                      </div>
                    ))}
                </dl>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default DataTable;
