import { AlertCircle, RefreshCw, X } from 'lucide-react';
import Button from './Button';

interface ErrorAlertProps {
  title?: string;
  message: string | null | undefined;
  onRetry?: () => void;
  onDismiss?: () => void;
  className?: string;
}

export default function ErrorAlert({
  title = 'Помилка виконання операції',
  message,
  onRetry,
  onDismiss,
  className = '',
}: ErrorAlertProps) {
  if (!message) return null;

  return (
    <div
      role="alert"
      className={`flex items-start justify-between gap-4 rounded-xl border border-red-200 bg-red-50 p-4 text-red-800 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200 ${className}`}
    >
      <div className="flex items-start gap-3">
        <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600 dark:text-red-400" />
        <div>
          <h4 className="text-sm font-semibold">{title}</h4>
          <p className="mt-1 text-sm text-red-700 dark:text-red-300">{message}</p>
          {onRetry && (
            <div className="mt-3">
              <Button type="button" variant="danger" size="sm" onClick={onRetry}>
                <RefreshCw className="h-3.5 w-3.5" />
                Повторити спробу
              </Button>
            </div>
          )}
        </div>
      </div>

      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Закрити повідомлення про помилку"
          className="rounded-lg p-1 text-red-500 transition hover:bg-red-100 dark:hover:bg-red-900/40"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}