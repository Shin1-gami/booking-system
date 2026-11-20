interface LoadingProps {
  text?: string;
  size?: 'sm' | 'md' | 'lg';
  fullScreen?: boolean;
}

const spinnerSizes = {
  sm: 'h-5 w-5 border-2',
  md: 'h-8 w-8 border-3',
  lg: 'h-12 w-12 border-4',
};

export default function Loading({
  text = 'Завантаження даних...',
  size = 'md',
  fullScreen = false,
}: LoadingProps) {
  const containerClass = fullScreen
    ? 'flex min-h-[60vh] flex-col items-center justify-center gap-3'
    : 'flex flex-col items-center justify-center gap-2 py-8';

  return (
    <div role="status" aria-live="polite" className={containerClass}>
      <div
        className={`animate-spin rounded-full border-primary-600 border-t-transparent ${spinnerSizes[size]}`}
      />
      {text && <p className="text-sm text-gray-600 dark:text-gray-400">{text}</p>}
    </div>
  );
}