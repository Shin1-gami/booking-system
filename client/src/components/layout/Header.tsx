import { Link, NavLink, useNavigate } from 'react-router-dom';
import { CalendarCheck2, LayoutDashboard, LogOut, Moon, Sun } from 'lucide-react';
import { APP_CONFIG } from '@/constants/config';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/stores/authStore';
import { useToast } from '@/stores/uiStore';

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `text-sm font-medium transition-colors ${
    isActive
      ? 'text-primary-600 dark:text-primary-400'
      : 'text-slate-700 hover:text-primary-600 dark:text-slate-300 dark:hover:text-primary-400'
  }`;

export default function Header() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const toast = useToast();

  const handleLogout = async () => {
    await logout();
    toast.info('Ви вийшли із системи');
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur dark:border-slate-800 dark:bg-slate-900/90">
      <nav className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <Link
          to="/"
          className="flex items-center gap-2 text-xl font-bold text-primary-600 dark:text-primary-400"
        >
          <CalendarCheck2 className="h-6 w-6" />
          <span>{APP_CONFIG.name}</span>
        </Link>

        <div className="flex flex-wrap items-center gap-4 sm:gap-6">
          <NavLink to="/" end className={navLinkClass}>
            Каталог
          </NavLink>
          <NavLink to="/about" className={navLinkClass}>
            Про проєкт
          </NavLink>

          <button
            type="button"
            onClick={toggleTheme}
            aria-label="Перемкнути тему"
            className="rounded-lg border border-slate-200 p-2 text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>

          {isAuthenticated ? (
            <div className="flex items-center gap-2.5">
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-1.5 rounded-lg bg-primary-600 px-3.5 py-2 text-xs font-medium text-white transition hover:bg-primary-700"
              >
                <LayoutDashboard className="h-3.5 w-3.5" />
                <span>Кабінет ({user?.name})</span>
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                title="Вийти"
                className="rounded-lg border border-slate-300 p-2 text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="rounded-lg border border-slate-300 px-3.5 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                Увійти
              </Link>
              <Link
                to="/register"
                className="rounded-lg bg-primary-600 px-3.5 py-1.5 text-sm font-medium text-white transition hover:bg-primary-700"
              >
                Реєстрація
              </Link>
            </div>
          )}
        </div>
      </nav>
    </header>
  );
}