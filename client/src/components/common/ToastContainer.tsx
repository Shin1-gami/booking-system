import { AlertTriangle, CheckCircle2, Info, X, XCircle } from 'lucide-react';
import { useUiStore, type ToastType } from '@/stores/uiStore';

const toastStyles: Record<
  ToastType,
  {
    wrapper: string;
    icon: typeof CheckCircle2;
    iconClass: string;
  }
> = {
  success: {
    wrapper:
      'border-emerald-200 bg-white text-slate-900 dark:border-emerald-800/70 dark:bg-slate-900 dark:text-white',
    icon: CheckCircle2,
    iconClass: 'text-emerald-600 dark:text-emerald-400',
  },
  error: {
    wrapper:
      'border-red-200 bg-white text-slate-900 dark:border-red-800/70 dark:bg-slate-900 dark:text-white',
    icon: XCircle,
    iconClass: 'text-red-600 dark:text-red-400',
  },
  warning: {
    wrapper:
      'border-amber-200 bg-white text-slate-900 dark:border-amber-800/70 dark:bg-slate-900 dark:text-white',
    icon: AlertTriangle,
    iconClass: 'text-amber-600 dark:text-amber-400',
  },
  info: {
    wrapper:
      'border-blue-200 bg-white text-slate-900 dark:border-blue-800/70 dark:bg-slate-900 dark:text-white',
    icon: Info,
    iconClass: 'text-blue-600 dark:text-blue-400',
  },
};

export default function ToastContainer() {
  const toasts = useUiStore((s) => s.toasts);
  const removeToast = useUiStore((s) => s.removeToast);

  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      className="fixed right-4 bottom-4 z-50 flex w-full max-w-sm flex-col gap-2.5 px-4 sm:px-0"
    >
      {toasts.map((toast) => {
        const style = toastStyles[toast.type];
        const Icon = style.icon;
        return (
          <div
            key={toast.id}
            role="status"
            className={`flex items-start gap-3 rounded-xl border p-4 shadow-lg transition-all ${style.wrapper}`}
          >
            <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${style.iconClass}`} />
            <div className="min-w-0 flex-1">
              {toast.title && <p className="text-sm font-semibold">{toast.title}</p>}
              <p className="mt-0.5 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                {toast.message}
              </p>
            </div>
            <button
              type="button"
              onClick={() => removeToast(toast.id)}
              aria-label="Закрити сповіщення"
              className="rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}