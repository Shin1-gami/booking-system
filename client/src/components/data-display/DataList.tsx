import type { ReactNode } from 'react';

interface DataListProps<T> {
  data: T[];
  keyExtractor: (item: T) => string | number;
  renderItem: (item: T) => ReactNode;
  emptyMessage?: string;
}

export default function DataList<T>({
  data,
  keyExtractor,
  renderItem,
  emptyMessage = 'Список порожній.',
}: DataListProps<T>) {
  if (data.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
        {emptyMessage}
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {data.map((item) => (
        <li
          key={keyExtractor(item)}
          className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs transition hover:border-primary-300 hover:shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:hover:border-primary-800"
        >
          {renderItem(item)}
        </li>
      ))}
    </ul>
  );
}