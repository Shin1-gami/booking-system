import { create } from 'zustand';

interface PresenceState {
  isConnected: boolean;
  onlineUserIds: string[];
  setConnected: (connected: boolean) => void;
  setOnlineUsers: (userIds: Array<string | number>) => void;
  setUserOnline: (userId: string | number) => void;
  setUserOffline: (userId: string | number) => void;
  clear: () => void;
}

export const usePresenceStore = create<PresenceState>((set) => ({
  isConnected: false,
  onlineUserIds: [],

  setConnected: (isConnected) => set({ isConnected }),

  setOnlineUsers: (userIds) =>
    set({
      onlineUserIds: Array.from(new Set(userIds.map((id) => String(id)))),
    }),

  setUserOnline: (userId) =>
    set((state) => {
      const normalized = String(userId);
      if (state.onlineUserIds.includes(normalized)) return state;
      return { onlineUserIds: [...state.onlineUserIds, normalized] };
    }),

  setUserOffline: (userId) =>
    set((state) => {
      const normalized = String(userId);
      return {
        onlineUserIds: state.onlineUserIds.filter((id) => id !== normalized),
      };
    }),

  clear: () => set({ isConnected: false, onlineUserIds: [] }),
}));