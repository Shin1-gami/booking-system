import { Outlet, useNavigate } from 'react-router-dom';
import { useIsFetching, useQueryClient } from '@tanstack/react-query';
import { Loader2, LogOut, Menu, Moon, Sun, UserCircle2 } from 'lucide-react';
import ErrorBoundary from '@/components/common/ErrorBoundary';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/stores/authStore';
import { useToast, useUiStore } from '@/stores/uiStore';
import Sidebar from './Sidebar';

export default function DashboardLayout() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isFetching = useIsFetching();
  const { theme, toggleTheme } = useTheme();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const toggleMobileSidebar = useUiStore((s) => s.toggleMobileSidebar);
  const toast = useToast();

  const handleLogout = async () => {
    await logout();
    queryClient.clear();
    toast.info('Ви вийшли з облікового запису');
    navigate('/login', { replace: true });
  };

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <Sidebar />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white/90 px-4 backdrop-blur dark:border-slate-800 dark:bg-slate-900/90 sm:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={toggleMobileSidebar}
              aria-label="Відкрити навігаційне меню"
              className="rounded-lg border border-slate-200 p-2 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800 lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>

            {isFetching > 0 && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-50 px-2.5 py-1 text-xs font-medium text-primary-700 dark:bg-primary-950 dark:text-primary-300">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span className="hidden sm:inline">Синхронізація...</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={toggleTheme}
              aria-label="Перемкнути тему оформлення"
              className="rounded-lg border border-slate-200 p-2 text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>

            <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 dark:border-slate-800 dark:bg-slate-800/60">
              <UserCircle2 className="h-4 w-4 text-primary-600 dark:text-primary-400" />
              <div className="hidden text-xs sm:block">
                <p className="font-semibold text-slate-800 dark:text-slate-100">
                  {user?.name ?? 'Користувач'}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {user?.role ?? 'USER'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-red-50 hover:border-red-200 hover:text-red-700 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-red-950/40 dark:hover:text-red-300"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Вийти</span>
            </button>
          </div>
        </header>

        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6">
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
}