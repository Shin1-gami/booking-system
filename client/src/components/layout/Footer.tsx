import { Link } from 'react-router-dom';
import { APP_CONFIG } from '@/constants/config';

export default function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white py-6 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 sm:flex-row sm:px-6">
        <p>
          © {new Date().getFullYear()} {APP_CONFIG.name}. Усі права захищено.
        </p>
        <div className="flex gap-6">
          <Link to="/" className="transition hover:text-primary-600 dark:hover:text-primary-400">
            Каталог
          </Link>
          <Link
            to="/about"
            className="transition hover:text-primary-600 dark:hover:text-primary-400"
          >
            Про систему
          </Link>
        </div>
      </div>
    </footer>
  );
}