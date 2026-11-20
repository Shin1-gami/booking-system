import { Link } from 'react-router';
import { APP_CONFIG } from '@/constants/config';

export default function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-gray-50 py-8 text-sm text-gray-600 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400">
      <div className="container mx-auto flex flex-col items-center justify-between gap-4 px-4 sm:flex-row sm:px-6">
        <p>
          © {new Date().getFullYear()} {APP_CONFIG.name}. Усі права захищено.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <a href={`mailto:${APP_CONFIG.contactEmail}`} className="hover:text-primary-600">
            {APP_CONFIG.contactEmail}
          </a>
          <span>•</span>
          <span>{APP_CONFIG.contactPhone}</span>
          <span>•</span>
          <Link to="/about" className="hover:text-primary-600">
            Про проєкт
          </Link>
        </div>
      </div>
    </footer>
  );
}