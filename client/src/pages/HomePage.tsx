import { useEffect, useState, type SyntheticEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  bookingService,
  extractApiErrorMessage,
  tokenStorage,
} from '../services/api';
import type { Category, EntityId, PaginationMeta, Resource } from '../types';

export const HomePage = () => {
  const navigate = useNavigate();
  const [resources, setResources] = useState<Resource[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);

  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [page, setPage] = useState<number>(1);

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [bookingResource, setBookingResource] = useState<Resource | null>(null);
  const [startTime, setStartTime] = useState<string>('');
  const [endTime, setEndTime] = useState<string>('');
  const [bookingFeedback, setBookingFeedback] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const [submittingBooking, setSubmittingBooking] = useState<boolean>(false);

  useEffect(() => {
    bookingService
      .getCategories()
      .then(setCategories)
      .catch(() => {
        // Категорії не критичні для базового рендеру каталогу
      });
  }, []);

  useEffect(() => {
    let isMounted = true;

    bookingService
      .getResources({
        page,
        limit: 9,
        ...(searchQuery.trim() && { search: searchQuery.trim() }),
        ...(selectedCategory && { categoryId: selectedCategory }),
      })
      .then((response) => {
        if (!isMounted) return;
        setResources(response.data);
        setPagination(response.pagination);
        setError(null);
      })
      .catch((err) => {
        if (!isMounted) return;
        setError(extractApiErrorMessage(err));
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [page, searchQuery, selectedCategory]);

  const handleOpenBooking = (resource: Resource) => {
    if (!tokenStorage.getAccessToken()) {
      navigate('/login');
      return;
    }
    setBookingFeedback(null);
    setBookingResource(resource);
  };

  const handleCreateBooking = async (e: SyntheticEvent) => {
    e.preventDefault();
    if (!bookingResource) return;

    setSubmittingBooking(true);
    setBookingFeedback(null);

    try {
      await bookingService.createBooking({
        resourceId: bookingResource.id as EntityId,
        startTime: new Date(startTime).toISOString(),
        endTime: new Date(endTime).toISOString(),
      });
      setBookingFeedback({
        type: 'success',
        text: `Ресурс «${bookingResource.name}» успішно заброньовано!`,
      });
      setStartTime('');
      setEndTime('');
    } catch (err) {
      setBookingFeedback({
        type: 'error',
        text: extractApiErrorMessage(err),
      });
    } finally {
      setSubmittingBooking(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
            Каталог ресурсів
          </h1>
          <p className="mt-1 text-slate-600 dark:text-slate-400">
            Оберіть локацію або обладнання та забронюйте зручний часовий слот
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setLoading(true);
              setPage(1);
              setSearchQuery(e.target.value);
            }}
            placeholder="Пошук за назвою або локацією..."
            className="rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          />

          <select
            value={selectedCategory}
            onChange={(e) => {
              setLoading(true);
              setPage(1);
              setSelectedCategory(e.target.value);
            }}
            className="rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          >
            <option value="">Усі категорії</option>
            {categories.map((cat) => (
              <option key={cat.id} value={String(cat.id)}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/50 dark:text-red-300">
          {error}
        </div>
      )}

      {loading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, idx) => (
            <div
              key={idx}
              className="h-56 animate-pulse rounded-2xl border border-slate-200 bg-slate-100 dark:border-slate-800 dark:bg-slate-800/60"
            />
          ))}
        </div>
      ) : resources.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
          За вашим запитом ресурсів не знайдено.
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {resources.map((resource) => (
            <article
              key={resource.id}
              className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
            >
              <div>
                <div className="mb-3 flex items-center justify-between gap-2">
                  <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                    {resource.category?.name || 'Загальна категорія'}
                  </span>
                  <span className="text-lg font-bold text-slate-900 dark:text-white">
                    {Number(resource.price).toFixed(2)} ₴
                  </span>
                </div>

                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                  {resource.name}
                </h2>

                {resource.location && (
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Локація: {resource.location}
                  </p>
                )}

                {resource.description && (
                  <p className="mt-3 line-clamp-3 text-sm text-slate-600 dark:text-slate-300">
                    {resource.description}
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={() => handleOpenBooking(resource)}
                className="mt-6 w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
              >
                Забронювати
              </button>
            </article>
          ))}
        </div>
      )}

      {pagination && pagination.totalPages > 1 && (
        <div className="mt-8 flex items-center justify-center gap-4">
          <button
            type="button"
            disabled={!pagination.hasPreviousPage}
            onClick={() => {
              setLoading(true);
              setPage((p) => Math.max(1, p - 1));
            }}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium disabled:opacity-40 dark:border-slate-700 dark:text-white"
          >
            Назад
          </button>
          <span className="text-sm text-slate-600 dark:text-slate-400">
            Сторінка {pagination.page} з {pagination.totalPages}
          </span>
          <button
            type="button"
            disabled={!pagination.hasNextPage}
            onClick={() => {
              setLoading(true);
              setPage((p) => p + 1);
            }}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium disabled:opacity-40 dark:border-slate-700 dark:text-white"
          >
            Далі
          </button>
        </div>
      )}

      {bookingResource && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-900">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
              Бронювання: {bookingResource.name}
            </h3>

            {bookingFeedback && (
              <div
                className={`mt-4 rounded-lg p-3 text-sm ${
                  bookingFeedback.type === 'success'
                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                    : 'bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-300'
                }`}
              >
                {bookingFeedback.text}
              </div>
            )}

            <form onSubmit={handleCreateBooking} className="mt-4 space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Початок
                </label>
                <input
                  type="datetime-local"
                  required
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Завершення
                </label>
                <input
                  type="datetime-local"
                  required
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setBookingResource(null)}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm dark:border-slate-700 dark:text-slate-300"
                >
                  Закрити
                </button>
                <button
                  type="submit"
                  disabled={submittingBooking}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {submittingBooking ? 'Збереження...' : 'Підтвердити'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default HomePage;