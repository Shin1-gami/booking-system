import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { bookingKeys } from '@/hooks/queries/useBookings';
import { categoryKeys } from '@/hooks/queries/useCategories';
import { resourceKeys } from '@/hooks/queries/useResources';
import { useSocketEvent } from '@/hooks/useSocketEvent';
import { connectSocket, disconnectSocket, socket } from '@/services/socket';
import { useAuthStore } from '@/stores/authStore';
import { useNotificationsStore, type BackendNotificationPayload } from '@/stores/notificationsStore';
import { usePresenceStore } from '@/stores/presenceStore';
import { useToast } from '@/stores/uiStore';

interface PresenceEventPayload {
  userId?: number | string;
  id?: number | string;
  users?: Array<number | string | { id: number | string; userId?: number | string }>;
}

export function useSocketConnection(): void {
  const token = useAuthStore((s) => s.accessToken);
  const currentUserId = useAuthStore((s) => s.user?.id);
  const queryClient = useQueryClient();
  const toast = useToast();

  const setConnected = usePresenceStore((s) => s.setConnected);
  const setOnlineUsers = usePresenceStore((s) => s.setOnlineUsers);
  const setUserOnline = usePresenceStore((s) => s.setUserOnline);
  const setUserOffline = usePresenceStore((s) => s.setUserOffline);
  const clearPresence = usePresenceStore((s) => s.clear);

  const addNotification = useNotificationsStore((s) => s.add);
  const addFromBackend = useNotificationsStore((s) => s.addFromBackend);
  const markAsRead = useNotificationsStore((s) => s.markAsRead);
  const removeNotification = useNotificationsStore((s) => s.removeNotification);

  useEffect(() => {
    if (!token) {
      disconnectSocket();
      clearPresence();
      return;
    }

    const handleConnect = () => {
      setConnected(true);
      if (currentUserId !== undefined) {
        setUserOnline(currentUserId);
      }
    };

    const handleDisconnect = () => {
      setConnected(false);
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    connectSocket(token);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      disconnectSocket();
      clearPresence();
    };
  }, [token, currentUserId, setConnected, setUserOnline, clearPresence]);

  // Відстеження онлайн-присутності користувачів
  useSocketEvent<PresenceEventPayload>('presence:list', (data) => {
    const ids = (data?.users ?? []).map((item) =>
      typeof item === 'object' && item !== null ? (item.userId ?? item.id) : item
    );
    if (currentUserId !== undefined) {
      ids.push(currentUserId);
    }
    setOnlineUsers(ids);
  });

  useSocketEvent<PresenceEventPayload | number | string>('presence:online', (data) => {
    const uid = typeof data === 'object' && data !== null ? (data.userId ?? data.id) : data;
    if (uid !== undefined) setUserOnline(uid);
  });

  useSocketEvent<PresenceEventPayload | number | string>('user:online', (data) => {
    const uid = typeof data === 'object' && data !== null ? (data.userId ?? data.id) : data;
    if (uid !== undefined) setUserOnline(uid);
  });

  useSocketEvent<PresenceEventPayload | number | string>('presence:offline', (data) => {
    const uid = typeof data === 'object' && data !== null ? (data.userId ?? data.id) : data;
    if (uid !== undefined) setUserOffline(uid);
  });

  useSocketEvent<PresenceEventPayload | number | string>('user:offline', (data) => {
    const uid = typeof data === 'object' && data !== null ? (data.userId ?? data.id) : data;
    if (uid !== undefined) setUserOffline(uid);
  });

  // Сповіщення в реальному часі з черги BullMQ / Socket.IO
  useSocketEvent<BackendNotificationPayload>('notification:new', (payload) => {
    addFromBackend(payload);
    toast.info(payload.message, 'Нове сповіщення');
  });

  useSocketEvent<{ type?: 'info' | 'success' | 'warning' | 'error'; title?: string; message: string }>(
    'notification',
    (payload) => {
      addNotification({
        type: payload.type ?? 'info',
        title: payload.title ?? 'Сповіщення',
        message: payload.message,
      });
      toast.info(payload.message, payload.title ?? 'Сповіщення');
    }
  );

  useSocketEvent<{ id: number | string; isRead?: boolean }>('notification:updated', (payload) => {
    if (payload.isRead) {
      markAsRead(String(payload.id));
    }
  });

  useSocketEvent<{ id: number | string }>('notification:deleted', (payload) => {
    removeNotification(String(payload.id));
  });

  // Автоматичне оновлення кешу списків при змінах на сервері
  useSocketEvent('booking:created', () => {
    queryClient.invalidateQueries({ queryKey: bookingKeys.all });
  });

  useSocketEvent('booking:updated', () => {
    queryClient.invalidateQueries({ queryKey: bookingKeys.all });
  });

  useSocketEvent('booking:cancelled', () => {
    queryClient.invalidateQueries({ queryKey: bookingKeys.all });
  });

  useSocketEvent('resources:changed', () => {
    queryClient.invalidateQueries({ queryKey: resourceKeys.all });
  });

  useSocketEvent('categories:changed', () => {
    queryClient.invalidateQueries({ queryKey: categoryKeys.all });
  });
}