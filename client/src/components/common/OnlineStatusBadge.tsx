import { usePresenceStore } from '@/stores/presenceStore';
import type { EntityId } from '@/types';

interface OnlineStatusBadgeProps {
  userId?: EntityId;
  showLabel?: boolean;
  className?: string;
}

export default function OnlineStatusBadge({
  userId,
  showLabel = true,
  className = '',
}: OnlineStatusBadgeProps) {
  const isConnected = usePresenceStore((s) => s.isConnected);
  const onlineUserIds = usePresenceStore((s) => s.onlineUserIds);

  const isOnline =
    userId !== undefined ? onlineUserIds.includes(String(userId)) : isConnected;

  return (
    <span
      title={isOnline ? 'Користувач онлайн' : 'Користувач офлайн'}
      className={`inline-flex items-center gap-1.5 text-xs font-medium ${
        isOnline
          ? 'text-emerald-700 dark:text-emerald-400'
          : 'text-slate-500 dark:text-slate-400'
      } ${className}`}
    >
      <span className="relative flex h-2.5 w-2.5">
        {isOnline && (
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
        )}
        <span
          className={`relative inline-flex h-2.5 w-2.5 rounded-full ${
            isOnline ? 'bg-emerald-500' : 'bg-slate-400 dark:bg-slate-600'
          }`}
        />
      </span>
      {showLabel && <span>{isOnline ? 'Онлайн' : 'Офлайн'}</span>}
    </span>
  );
}