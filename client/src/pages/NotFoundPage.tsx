import { Link } from 'react-router';
import Button from '@/components/common/Button';

export default function NotFoundPage() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center text-center">
      <p className="text-6xl font-extrabold text-primary-600">404</p>
      <h1 className="mt-4 text-2xl font-bold">Сторінку не знайдено</h1>
      <p className="mt-2 max-w-md text-gray-600 dark:text-gray-400">
        Запитана адреса не існує або була переміщена. Поверніться на головну сторінку системи
        бронювання.
      </p>
      <Link to="/" className="mt-6">
        <Button>На головну</Button>
      </Link>
    </div>
  );
}