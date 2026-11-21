import { Loader2 } from 'lucide-react';

interface LoadingProps {
  text?: string;
  size?: 'sm' | 'md' | 'lg';
  fullScreen?: boolean;
}

const spinnerSizes = {
  sm: 'h-5 w-5',
  md: 'h-8 w-8',
  lg: 'h-12 w-12',
};

export default function Loading({
  text = 'Завантаження даних...',
  size = 'md',
  fullScreen = false,
}: LoadingProps) {
  const containerClass = fullScreen
    ? 'flex min-h-[60vh] flex-col items-center justify-center gap-3'
    : 'flex flex-col items-center justify-center gap-2.5 py-10';

  return (
    <div role="status" aria-live="polite" className={containerClass}>
      <Loader2 className={`animate-spin text-primary-600 dark:text-primary-400 ${spinnerSizes[size]}`} />
      {text && <p className="text-sm font-medium text-slate-600 dark:text-slate-400">{text}</p>}
    </div>
  );
}