import { create } from 'zustand';
import { authService, extractApiErrorMessage, tokenStorage } from '@/services/api';
import type { User } from '@/types';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: tokenStorage.getUser(),
  accessToken: tokenStorage.getAccessToken(),
  isAuthenticated: Boolean(tokenStorage.getAccessToken()),
  isLoading: false,
  error: null,

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const data = await authService.login(email, password);
      set({
        user: data.user,
        accessToken: data.accessToken,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
    } catch (err) {
      const message = extractApiErrorMessage(err);
      set({ isLoading: false, error: message });
      throw new Error(message, { cause: err });
    }
  },

  register: async (name, email, password) => {
    set({ isLoading: true, error: null });
    try {
      const data = await authService.register(name, email, password);
      const hasToken = Boolean(data.accessToken);
      set({
        user: data.user ?? null,
        accessToken: data.accessToken ?? null,
        isAuthenticated: hasToken,
        isLoading: false,
        error: null,
      });
    } catch (err) {
      const message = extractApiErrorMessage(err);
      set({ isLoading: false, error: message });
      throw new Error(message, { cause: err });
    }
  },

  logout: async () => {
    set({ isLoading: true });
    await authService.logout();
    set({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });
  },

  refreshProfile: async () => {
    if (!tokenStorage.getAccessToken()) return;
    try {
      const user = await authService.getMe();
      set({ user, isAuthenticated: true });
    } catch (err) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 401) {
        tokenStorage.clear();
        set({ user: null, accessToken: null, isAuthenticated: false });
      }
    }
  },

  clearError: () => set({ error: null }),
}));

if (typeof window !== 'undefined') {
  window.addEventListener('auth:unauthorized', () => {
    useAuthStore.setState({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      error: null,
    });
  });
}