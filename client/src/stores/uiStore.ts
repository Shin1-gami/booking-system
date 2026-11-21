import { create } from 'zustand';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastItem {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
}

interface UiState {
  isMobileSidebarOpen: boolean;
  isDesktopSidebarCollapsed: boolean;
  toasts: ToastItem[];

  openMobileSidebar: () => void;
  closeMobileSidebar: () => void;
  toggleMobileSidebar: () => void;
  toggleDesktopSidebar: () => void;

  addToast: (toast: Omit<ToastItem, 'id'>) => void;
  removeToast: (id: string) => void;
}

export const useUiStore = create<UiState>((set) => ({
  isMobileSidebarOpen: false,
  isDesktopSidebarCollapsed: false,
  toasts: [],

  openMobileSidebar: () => set({ isMobileSidebarOpen: true }),
  closeMobileSidebar: () => set({ isMobileSidebarOpen: false }),
  toggleMobileSidebar: () =>
    set((state) => ({ isMobileSidebarOpen: !state.isMobileSidebarOpen })),
  toggleDesktopSidebar: () =>
    set((state) => ({ isDesktopSidebarCollapsed: !state.isDesktopSidebarCollapsed })),

  addToast: (toast) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const duration = toast.duration ?? 4500;

    set((state) => ({
      toasts: [...state.toasts, { ...toast, id, duration }],
    }));

    if (duration > 0) {
      setTimeout(() => {
        set((state) => ({
          toasts: state.toasts.filter((t) => t.id !== id),
        }));
      }, duration);
    }
  },

  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),
}));

export const useUIStore = useUiStore;

export function useToast() {
  const addToast = useUiStore((s) => s.addToast);
  return {
    success: (message: string, title = 'Успішно') =>
      addToast({ type: 'success', title, message }),
    error: (message: string, title = 'Помилка') =>
      addToast({ type: 'error', title, message, duration: 6000 }),
    info: (message: string, title = 'Інформація') =>
      addToast({ type: 'info', title, message }),
    warning: (message: string, title = 'Увага') =>
      addToast({ type: 'warning', title, message }),
  };
}