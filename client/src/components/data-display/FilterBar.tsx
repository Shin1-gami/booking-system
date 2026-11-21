import type { ReactNode } from 'react';
import { ArrowUpDown, RotateCcw, Search } from 'lucide-react';
import type { SortOrder } from '@/types';

export interface SortOption {
  value: string;
  label: string;
}

interface FilterBarProps {
  search: string;
  onSearchChange: (val: string) => void;
  searchPlaceholder?: string;
  sortBy: string;
  sortOrder: SortOrder;
  sortOptions: SortOption[];
  onSortByChange: (val: string) => void;
  onSortOrderToggle: () => void;
  onReset?: () => void;
  hasActiveFilters?: boolean;
  extraFilters?: ReactNode;
}

export default function FilterBar({
  search,
  onSearchChange,
  searchPlaceholder = 'Пошук...',
  sortBy,
  sortOrder,
  sortOptions,
  onSortByChange,
  onSortOrderToggle,
  onReset,
  hasActiveFilters = false,
  extraFilters,
}: FilterBarProps) {
  return (
    <div className="mb-5 flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full rounded-lg border border-slate-300 bg-white py-2 pr-3 pl-9 text-sm text-slate-900 placeholder-slate-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          />
        </div>

        {extraFilters}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1.5">
          <select
            aria-label="Критерій сортування"
            value={sortBy}
            onChange={(e) => onSortByChange(e.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 focus:border-primary-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            {sortOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                Сортувати: {opt.label}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={onSortOrderToggle}
            title={sortOrder === 'asc' ? 'За зростанням' : 'За спаданням'}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            <ArrowUpDown className="h-3.5 w-3.5" />
            <span>{sortOrder === 'asc' ? 'Зрост.' : 'Спад.'}</span>
          </button>
        </div>

        {hasActiveFilters && onReset && (
          <button
            type="button"
            onClick={onReset}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-2 text-xs font-medium text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Скинути</span>
          </button>
        )}
      </div>
    </div>
  );
}