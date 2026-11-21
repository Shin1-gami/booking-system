import { io, type Socket } from 'socket.io-client';
import { APP_CONFIG } from '@/constants/config';

// Адреса сервера Socket.IO БЕЗ префікса /api (інакше /api сприймається як namespace)
export const socket: Socket = io(APP_CONFIG.socketUrl, {
  autoConnect: false,
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 1000,
});

export function connectSocket(token: string): void {
  if (!token) return;
  if (socket.active) {
    socket.disconnect();
  }
  socket.auth = { token };
  socket.connect();
}

export function disconnectSocket(): void {
  if (socket.connected || socket.active) {
    socket.disconnect();
  }
}

export function joinResourceRoom(resourceId: string | number): void {
  if (!socket.connected) return;
  socket.emit('room:join', { type: 'resource', id: Number(resourceId) });
}

export function leaveResourceRoom(resourceId: string | number): void {
  if (!socket.connected) return;
  socket.emit('room:leave', { type: 'resource', id: Number(resourceId) });
}