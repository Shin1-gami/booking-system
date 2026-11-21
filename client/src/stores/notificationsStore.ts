import { create } from 'zustand';
import type { NotificationPriority } from '@/types';

export interface AppNotification {
  id: string;
  backendId?: number;
  type: 'info' | 'success' | 'warning' | 'error';
  priority?: NotificationPriority;
  title: string;
  message: string;
  timestamp: number;
  read: boolean;
}

export interface BackendNotificationPayload {
  id: number;
  userId?: number;
  message: string;
  isRead?: boolean;
  priority?: NotificationPriority;
  createdAt?: string;
}

interface NotificationsState {
  notifications: AppNotification[];
  add: (n: Pick<AppNotification, 'type' | 'title' | 'message'> & { priority?: NotificationPriority }) => void;
  addFromBackend: (payload: BackendNotificationPayload) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
  clearAll: () => void;
}

function priorityToType(priority?: NotificationPriority): AppNotification['type'] {
  switch (priority) {
    case 'URGENT':
      return 'error';
    case 'HIGH':
      return 'warning';
    case 'LOW':
      return 'success';
    default:
      return 'info';
  }
}

export const useNotificationsStore = create<NotificationsState>((set) => ({
  notifications: [],

  add: (n) =>
    set((state) => ({
      notifications: [
        {
          ...n,
          id: crypto.randomUUID(),
          timestamp: Date.now(),
          read: false,
        },
        ...state.notifications,
      ].slice(0, 50),
    })),

  addFromBackend: (payload) =>
    set((state) => {
      const id = String(payload.id);
      if (state.notifications.some((item) => item.id === id)) {
        return state;
      }
      const nextItem: AppNotification = {
        id,
        backendId: payload.id,
        type: priorityToType(payload.priority),
        priority: payload.priority,
        title:
          payload.priority === 'URGENT'
            ? 'Термінове сповіщення'
            : payload.priority === 'HIGH'
              ? 'Важливе сповіщення'
              : 'Сповіщення системи',
        message: payload.message,
        timestamp: payload.createdAt ? new Date(payload.createdAt).getTime() : Date.now(),
        read: Boolean(payload.isRead),
      };
      return {
        notifications: [nextItem, ...state.notifications].slice(0, 50),
      };
    }),

  markAsRead: (id) =>
    set((state) => ({
      notifications: state.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
    })),

  markAllAsRead: () =>
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
    })),

  removeNotification: (id) =>
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    })),

  clearAll: () => set({ notifications: [] }),
}));

export const selectUnreadCount = (state: NotificationsState): number =>
  state.notifications.filter((n) => !n.read).length;