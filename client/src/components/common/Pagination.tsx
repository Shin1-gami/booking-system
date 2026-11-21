import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { PaginationMeta } from '@/types';

interface PaginationProps {
  pagination: PaginationMeta | undefined;
  onPageChange: (page: number) => void;
  onLimitChange?: (limit: number) => void;
  pageSizeOptions?: number[];
}

export default function Pagination({
  pagination,
  onPageChange,
  onLimitChange,
  pageSizeOptions = [6, 9, 12, 24],
}: PaginationProps) {
  if (!pagination || pagination.total === 0) return null;

  const { page, limit, total, totalPages, hasPreviousPage, hasNextPage } = pagination;
  const from = (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  const getPageNumbers = (): Array<number | 'ellipsis'> => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    const pages: Array<number | 'ellipsis'> = [1];
    if (page > 3) pages.push('ellipsis');
    const start = Math.max(2, page - 1);
    const end = Math.min(totalPages - 1, page + 1);
    for (let i = start; i <= end; i += 1) pages.push(i);
    if (page < totalPages - 2) pages.push('ellipsis');
    pages.push(totalPages);
    return pages;
  };

  return (
    <div className="mt-6 flex flex-col items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm dark:border-slate-800 dark:bg-slate-900 sm:flex-row">
      <div className="flex flex-wrap items-center gap-3 text-slate-600 dark:text-slate-400">
        <span>
          Показано <strong className="text-slate-900 dark:text-white">{from}</strong>–
          <strong className="text-slate-900 dark:text-white">{to}</strong> із{' '}
          <strong className="text-slate-900 dark:text-white">{total}</strong> записів
        </span>

        {onLimitChange && (
          <label className="flex items-center gap-2">
            <span>На сторінці:</span>
            <select
              value={limit}
              onChange={(e) => onLimitChange(Number(e.target.value))}
              className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs font-medium text-slate-900 focus:border-primary-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            >
              {pageSizeOptions.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>

      {totalPages > 1 && (
        <nav aria-label="Навігація по сторінках" className="flex items-center gap-1.5">
          <button
            type="button"
            disabled={!hasPreviousPage}
            onClick={() => onPageChange(page - 1)}
            aria-label="Попередня сторінка"
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-300 text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          {getPageNumbers().map((item, idx) =>
            item === 'ellipsis' ? (
              <span key={`ellipsis-${idx}`} className="px-2 text-slate-400">
                ...
              </span>
            ) : (
              <button
                key={item}
                type="button"
                onClick={() => onPageChange(item)}
                className={`inline-flex h-8 min-w-8 items-center justify-center rounded-lg px-2.5 text-xs font-semibold transition ${
                  item === page
                    ? 'bg-primary-600 text-white shadow-xs'
                    : 'border border-slate-300 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800'
                }`}
              >
                {item}
              </button>
            )
          )}

          <button
            type="button"
            disabled={!hasNextPage}
            onClick={() => onPageChange(page + 1)}
            aria-label="Наступна сторінка"
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-300 text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </nav>
      )}
    </div>
  );
}