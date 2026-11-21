import { Link } from 'react-router-dom';
import Button from '@/components/common/Button';

export default function NotFoundPage() {
  return (
    <div className="mx-auto my-16 max-w-md text-center">
      <p className="text-6xl font-extrabold text-primary-600 dark:text-primary-400">404</p>
      <h1 className="mt-4 text-2xl font-bold text-slate-900 dark:text-white">
        Сторінку не знайдено
      </h1>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
        Запитувана адреса не існує або була переміщена.
      </p>
      <div className="mt-6 flex justify-center gap-3">
        <Link to="/">
          <Button variant="outline">На головну</Button>
        </Link>
        <Link to="/dashboard">
          <Button>У панель керування</Button>
        </Link>
      </div>
    </div>
  );
}