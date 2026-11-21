import { useState } from 'react';
import {
  Combobox,
  ComboboxButton,
  ComboboxInput,
  ComboboxOption,
  ComboboxOptions,
} from '@headlessui/react';
import { Check, ChevronsUpDown, Search, X } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
  subtitle?: string;
}

interface SearchableSelectProps {
  label?: string;
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  emptyText?: string;
  disabled?: boolean;
  error?: string;
}

export default function SearchableSelect({
  label,
  options,
  value,
  onChange,
  placeholder = 'Оберіть або введіть для пошуку...',
  emptyText = 'Нічого не знайдено',
  disabled = false,
  error,
}: SearchableSelectProps) {
  const [query, setQuery] = useState('');

  const selectedOption = options.find((opt) => opt.value === value) ?? null;

  const filteredOptions =
    query.trim() === ''
      ? options
      : options.filter((opt) => {
          const q = query.toLowerCase();
          return (
            opt.label.toLowerCase().includes(q) ||
            Boolean(opt.subtitle?.toLowerCase().includes(q))
          );
        });

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">{label}</label>
      )}

      <Combobox
        value={selectedOption}
        disabled={disabled}
        onChange={(opt) => {
          onChange(opt ? opt.value : '');
          setQuery('');
        }}
        onClose={() => setQuery('')}
      >
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <ComboboxInput
            aria-label={label ?? placeholder}
            displayValue={(opt: SelectOption | null) => opt?.label ?? ''}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={placeholder}
            className={`w-full rounded-lg border border-slate-300 bg-white py-2 pr-14 pl-9 text-sm text-slate-900 placeholder-slate-400 transition focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/25 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 ${
              error ? 'border-red-500 focus:border-red-500 focus:ring-red-500/25' : ''
            }`}
          />

          <div className="absolute inset-y-0 right-0 flex items-center gap-0.5 pr-2">
            {selectedOption && !disabled && (
              <button
                type="button"
                aria-label="Очистити вибір"
                onClick={() => onChange('')}
                className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-700"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
            <ComboboxButton className="rounded p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
              <ChevronsUpDown className="h-4 w-4" aria-hidden="true" />
            </ComboboxButton>
          </div>

          <ComboboxOptions
            transition
            className="absolute z-40 mt-1.5 max-h-60 w-full overflow-auto rounded-xl border border-slate-200 bg-white p-1 shadow-xl duration-150 ease-out empty:invisible data-closed:scale-95 data-closed:opacity-0 dark:border-slate-700 dark:bg-slate-800"
          >
            {filteredOptions.length === 0 ? (
              <div className="px-3 py-4 text-center text-xs text-slate-500 dark:text-slate-400">
                {emptyText}
              </div>
            ) : (
              filteredOptions.map((opt) => (
                <ComboboxOption
                  key={opt.value}
                  value={opt}
                  className="group flex cursor-pointer items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm text-slate-700 select-none data-focus:bg-primary-50 data-focus:text-primary-700 dark:text-slate-200 dark:data-focus:bg-primary-950/70 dark:data-focus:text-primary-300"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">{opt.label}</p>
                    {opt.subtitle && (
                      <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                        {opt.subtitle}
                      </p>
                    )}
                  </div>
                  <Check className="invisible h-4 w-4 shrink-0 text-primary-600 group-data-selected:visible dark:text-primary-400" />
                </ComboboxOption>
              ))
            )}
          </ComboboxOptions>
        </div>
      </Combobox>

      {error && <p className="text-xs font-medium text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
}