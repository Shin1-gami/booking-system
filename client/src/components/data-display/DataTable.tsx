import type { ReactNode } from 'react';
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
import type { SortOrder } from '@/types';

export interface TableColumn<T> {
  key: string;
  header: string;
  sortKey?: string;
  className?: string;
  render: (item: T) => ReactNode;
}

interface DataTableProps<T> {
  data: T[];
  columns: TableColumn<T>[];
  keyExtractor: (item: T) => string | number;
  sortBy?: string;
  sortOrder?: SortOrder;
  onSort?: (sortKey: string) => void;
  onRowClick?: (item: T) => void;
  emptyMessage?: string;
}

export default function DataTable<T>({
  data,
  columns,
  keyExtractor,
  sortBy,
  sortOrder,
  onSort,
  onRowClick,
  emptyMessage = 'Записів не знайдено.',
}: DataTableProps<T>) {
  if (data.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
      <table className="min-w-full divide-y divide-slate-200 text-left text-sm dark:divide-slate-800">
        <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-600 dark:bg-slate-800/60 dark:text-slate-300">
          <tr>
            {columns.map((col) => {
              const sortable = Boolean(col.sortKey && onSort);
              const isActive = sortable && sortBy === col.sortKey;

              return (
                <th key={col.key} scope="col" className={`px-4 py-3.5 ${col.className ?? ''}`}>
                  {sortable ? (
                    <button
                      type="button"
                      onClick={() => onSort?.(col.sortKey!)}
                      className="inline-flex items-center gap-1.5 font-semibold transition hover:text-primary-600 dark:hover:text-primary-400"
                    >
                      <span>{col.header}</span>
                      {isActive ? (
                        sortOrder === 'asc' ? (
                          <ArrowUp className="h-3.5 w-3.5 text-primary-600" />
                        ) : (
                          <ArrowDown className="h-3.5 w-3.5 text-primary-600" />
                        )
                      ) : (
                        <ArrowUpDown className="h-3.5 w-3.5 opacity-40" />
                      )}
                    </button>
                  ) : (
                    col.header
                  )}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
          {data.map((item) => (
            <tr
              key={keyExtractor(item)}
              onClick={onRowClick ? () => onRowClick(item) : undefined}
              className={`transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/40 ${
                onRowClick ? 'cursor-pointer' : ''
              }`}
            >
              {columns.map((col) => (
                <td
                  key={col.key}
                  className={`px-4 py-3.5 text-slate-700 dark:text-slate-300 ${col.className ?? ''}`}
                >
                  {col.render(item)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}