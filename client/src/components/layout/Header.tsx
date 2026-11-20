import { Link, NavLink } from 'react-router';
import { APP_CONFIG } from '@/constants/config';
import { useTheme } from '@/hooks/useTheme';

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `text-sm font-medium transition-colors ${
    isActive
      ? 'text-primary-600 dark:text-primary-500'
      : 'text-gray-700 hover:text-primary-600 dark:text-gray-300 dark:hover:text-primary-500'
  }`;

export default function Header() {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="sticky top-0 z-30 border-b border-gray-200 bg-white/90 backdrop-blur dark:border-gray-800 dark:bg-gray-900/90">
      <nav className="container mx-auto flex flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2 text-xl font-bold text-primary-600">
          <span>📅</span>
          <span>{APP_CONFIG.name}</span>
        </Link>

        <div className="flex items-center gap-6">
          <NavLink to="/" end className={navLinkClass}>
            Головна
          </NavLink>
          <NavLink to="/about" className={navLinkClass}>
            Про систему
          </NavLink>
          <button
            type="button"
            onClick={toggleTheme}
            aria-label="Перемкнути тему"
            className="rounded-lg border border-gray-200 p-2 text-base transition-colors hover:bg-gray-100 dark:border-gray-700 dark:hover:bg-gray-800"
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
        </div>
      </nav>
    </header>
  );
}