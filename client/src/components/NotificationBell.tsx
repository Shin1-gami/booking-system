import { useEffect, useRef, useState } from 'react';
import { Bell, CheckCheck, Trash2 } from 'lucide-react';
import { useSocketEvent } from '@/hooks/useSocketEvent';
import { apiClient } from '@/services/api';
import {
  selectUnreadCount,
  useNotificationsStore,
  type AppNotification,
} from '@/stores/notificationsStore';

interface DirectNotificationPayload {
  type?: 'info' | 'success' | 'warning' | 'error';
  title?: string;
  message: string;
}

const PRIORITY_BADGE: Record<string, string> = {
  URGENT: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300',
  HIGH: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
  NORMAL: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
  LOW: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
};

export default function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const notifications = useNotificationsStore((state) => state.notifications);
  const unreadCount = useNotificationsStore(selectUnreadCount);
  const add = useNotificationsStore((state) => state.add);
  const markAsRead = useNotificationsStore((state) => state.markAsRead);
  const markAllAsRead = useNotificationsStore((state) => state.markAllAsRead);
  const clearAll = useNotificationsStore((state) => state.clearAll);

  // Пряма підписка на подію notification (ізольована за посиланням на обробник)
  useSocketEvent<DirectNotificationPayload>('notification', (data) => {
    add({
      type: data.type ?? 'info',
      title: data.title ?? 'Сповіщення',
      message: data.message,
    });
  });

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleNotificationClick = async (item: AppNotification) => {
    markAsRead(item.id);
    if (item.backendId && !item.read) {
      await apiClient.put(`/notifications/${item.backendId}`, { isRead: true }).catch(() => {});
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-label={`Сповіщення: непрочитаних ${unreadCount}`}
        aria-expanded={isOpen}
        className="relative rounded-lg border border-slate-200 p-2 text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
      >
        <Bell className="h-4 w-4" aria-hidden="true" />
        {unreadCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[11px] font-bold text-white shadow-xs">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900 sm:w-96">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Сповіщення</h3>
              {unreadCount > 0 && (
                <span className="rounded-full bg-primary-100 px-2 py-0.5 text-xs font-semibold text-primary-700 dark:bg-primary-950 dark:text-primary-300">
                  {unreadCount} нових
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {notifications.length > 0 && (
                <>
                  <button
                    type="button"
                    onClick={markAllAsRead}
                    title="Прочитати всі"
                    className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-primary-600 transition hover:bg-primary-50 dark:text-primary-400 dark:hover:bg-primary-950/60"
                  >
                    <CheckCheck className="h-3.5 w-3.5" />
                    <span>Прочитати всі</span>
                  </button>
                  <button
                    type="button"
                    onClick={clearAll}
                    title="Очистити список"
                    className="rounded-md p-1 text-slate-400 transition hover:bg-slate-100 hover:text-red-600 dark:hover:bg-slate-800"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </>
              )}
            </div>
          </div>

          <ul className="max-h-96 divide-y divide-slate-100 overflow-y-auto dark:divide-slate-800">
            {notifications.length === 0 ? (
              <li className="px-4 py-8 text-center text-sm text-slate-500 dark:text-slate-400">
                Немає сповіщень
              </li>
            ) : (
              notifications.map((n) => (
                <li key={n.id}>
                  <button
                    type="button"
                    onClick={() => handleNotificationClick(n)}
                    className={`block w-full px-4 py-3 text-left transition hover:bg-slate-50 dark:hover:bg-slate-800/60 ${
                      n.read ? 'opacity-75' : 'bg-primary-50/50 dark:bg-primary-950/30'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-semibold text-slate-900 dark:text-white">
                        {n.title}
                      </span>
                      {n.priority && (
                        <span
                          className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                            PRIORITY_BADGE[n.priority] ?? PRIORITY_BADGE.NORMAL
                          }`}
                        >
                          {n.priority}
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                      {n.message}
                    </p>
                    <span className="mt-1.5 block text-[11px] text-slate-400">
                      {new Date(n.timestamp).toLocaleString('uk-UA')}
                    </span>
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
}