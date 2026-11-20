import type { ReactNode } from 'react';

interface CardProps {
  title?: string;
  subtitle?: string;
  headerAction?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
  className?: string;
}

export default function Card({
  title,
  subtitle,
  headerAction,
  footer,
  children,
  className = '',
}: CardProps) {
  return (
    <div
      className={`flex flex-col justify-between rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md dark:border-gray-800 dark:bg-gray-900 ${className}`}
    >
      <div>
        {(title || subtitle || headerAction) && (
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              {title && (
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
              )}
              {subtitle && (
                <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>
              )}
            </div>
            {headerAction && <div className="shrink-0">{headerAction}</div>}
          </div>
        )}
        <div className="text-gray-700 dark:text-gray-300">{children}</div>
      </div>

      {footer && (
        <div className="mt-5 border-t border-gray-100 pt-4 dark:border-gray-800">{footer}</div>
      )}
    </div>
  );
}