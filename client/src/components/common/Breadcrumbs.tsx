import { Fragment } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

export interface BreadcrumbItem {
  label: string;
  to?: string;
}

const ROUTE_LABELS: Record<string, string> = {
  dashboard: 'Панель керування',
  resources: 'Ресурси',
  bookings: 'Бронювання',
  categories: 'Категорії',
  new: 'Створення',
  edit: 'Редагування',
  about: 'Про систему',
};

interface BreadcrumbsProps {
  items?: BreadcrumbItem[];
  currentLabel?: string;
}

export default function Breadcrumbs({ items, currentLabel }: BreadcrumbsProps) {
  const location = useLocation();

  const resolvedItems: BreadcrumbItem[] = (() => {
    if (items) return items;

    const segments = location.pathname.split('/').filter(Boolean);
    const list: BreadcrumbItem[] = [];
    let accumulatedPath = '';

    segments.forEach((segment, idx) => {
      accumulatedPath += `/${segment}`;
      const isLast = idx === segments.length - 1;
      const mappedLabel = ROUTE_LABELS[segment] ?? segment;

      list.push({
        label: isLast && currentLabel ? currentLabel : mappedLabel,
        to: isLast ? undefined : accumulatedPath,
      });
    });

    return list;
  })();

  if (resolvedItems.length === 0) return null;

  return (
    <nav aria-label="Хлібні крихти" className="mb-5">
      <ol className="flex flex-wrap items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">
        <li>
          <Link
            to="/"
            className="inline-flex items-center gap-1 rounded px-1 py-0.5 transition hover:text-primary-600 dark:hover:text-primary-400"
          >
            <Home className="h-3.5 w-3.5" />
            <span>Головна</span>
          </Link>
        </li>

        {resolvedItems.map((item, idx) => (
          <Fragment key={`${item.label}-${idx}`}>
            <li>
              <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
            </li>
            <li>
              {item.to ? (
                <Link
                  to={item.to}
                  className="rounded px-1 py-0.5 transition hover:text-primary-600 dark:hover:text-primary-400"
                >
                  {item.label}
                </Link>
              ) : (
                <span className="px-1 py-0.5 font-semibold text-slate-800 dark:text-slate-200">
                  {item.label}
                </span>
              )}
            </li>
          </Fragment>
        ))}
      </ol>
    </nav>
  );
}