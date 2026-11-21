import type { ReactNode } from 'react';

interface DataGridProps<T> {
  data: T[];
  keyExtractor: (item: T) => string | number;
  renderCard: (item: T) => ReactNode;
  columns?: 2 | 3 | 4;
  emptyMessage?: string;
}

const gridColsClass = {
  2: 'grid-cols-1 md:grid-cols-2',
  3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
  4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
};

export default function DataGrid<T>({
  data,
  keyExtractor,
  renderCard,
  columns = 3,
  emptyMessage = 'Елементи відсутні.',
}: DataGridProps<T>) {
  if (data.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className={`grid gap-5 ${gridColsClass[columns]}`}>
      {data.map((item) => (
        <div key={keyExtractor(item)} className="h-full">
          {renderCard(item)}
        </div>
      ))}
    </div>
  );
}