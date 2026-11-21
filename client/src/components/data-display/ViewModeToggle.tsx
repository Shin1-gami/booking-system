import { LayoutGrid, List, Table2 } from 'lucide-react';

export type ViewMode = 'table' | 'list' | 'grid';

interface ViewModeToggleProps {
  value: ViewMode;
  onChange: (mode: ViewMode) => void;
}

const MODES: Array<{ id: ViewMode; label: string; icon: typeof Table2 }> = [
  { id: 'table', label: 'Таблиця', icon: Table2 },
  { id: 'list', label: 'Список', icon: List },
  { id: 'grid', label: 'Сітка', icon: LayoutGrid },
];

export default function ViewModeToggle({ value, onChange }: ViewModeToggleProps) {
  return (
    <div
      role="group"
      aria-label="Режим відображення"
      className="inline-flex rounded-lg border border-slate-200 bg-slate-100 p-1 dark:border-slate-700 dark:bg-slate-800"
    >
      {MODES.map(({ id, label, icon: Icon }) => {
        const active = value === id;
        return (
          <button
            key={id}
            type="button"
            onClick={() => onChange(id)}
            title={label}
            className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition ${
              active
                ? 'bg-white text-primary-600 shadow-xs dark:bg-slate-900 dark:text-primary-400'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            <Icon className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{label}</span>
          </button>
        );
      })}
    </div>
  );
}