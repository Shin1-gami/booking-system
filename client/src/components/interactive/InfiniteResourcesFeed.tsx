import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useInfiniteQuery } from '@tanstack/react-query';
import { CalendarPlus, Loader2, MapPin, Search } from 'lucide-react';
import Badge from '@/components/common/Badge';
import Button from '@/components/common/Button';
import ErrorAlert from '@/components/common/ErrorAlert';
import { useDebounce } from '@/hooks/useDebounce';
import { extractApiErrorMessage, resourcesService } from '@/services/api';
import { formatCurrency } from '@/utils/format';

export default function InfiniteResourcesFeed() {
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 350);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const {
    data,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    refetch,
  } = useInfiniteQuery({
    queryKey: ['resources', 'infinite', debouncedSearch],
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      resourcesService.getAll({
        page: pageParam,
        limit: 6,
        ...(debouncedSearch.trim() && { search: debouncedSearch.trim() }),
      }),
    getNextPageParam: (lastPage) =>
      lastPage.pagination.page < lastPage.pagination.totalPages
        ? lastPage.pagination.page + 1
        : undefined,
  });

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasNextPage) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { rootMargin: '120px' }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const items = data?.pages.flatMap((page) => page.data) ?? [];
  const totalCount = data?.pages[0]?.pagination.total ?? 0;

  return (
    <div className="space-y-4">
      <div className="flex flex-col justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 sm:flex-row sm:items-center">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            Стрічка ресурсів (Infinite Scroll)
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Завантажено {items.length} із {totalCount} доступних ресурсів
          </p>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Швидкий пошук у стрічці..."
            className="w-full rounded-lg border border-slate-300 bg-white py-2 pr-3 pl-9 text-sm text-slate-900 focus:border-primary-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          />
        </div>
      </div>

      {error && (
        <ErrorAlert message={extractApiErrorMessage(error)} onRetry={() => refetch()} />
      )}

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900">
          Ресурсів не знайдено.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((resource) => (
            <div
              key={resource.id}
              className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition hover:border-primary-300 dark:border-slate-800 dark:bg-slate-900"
            >
              <div>
                <div className="mb-3 flex items-center justify-between gap-2">
                  <Badge variant="info">{resource.category?.name ?? 'Загальна'}</Badge>
                  <span className="text-base font-bold text-primary-600 dark:text-primary-400">
                    {formatCurrency(resource.price)}
                  </span>
                </div>
                <Link
                  to={`/dashboard/resources/${resource.id}`}
                  className="text-base font-bold text-slate-900 hover:text-primary-600 dark:text-white"
                >
                  {resource.name}
                </Link>
                {resource.location && (
                  <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                    <MapPin className="h-3.5 w-3.5" />
                    {resource.location}
                  </p>
                )}
                <p className="mt-2 line-clamp-2 text-xs text-slate-600 dark:text-slate-400">
                  {resource.description || 'Опис відсутній.'}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                <Link to={`/dashboard/bookings/new?resourceId=${resource.id}`}>
                  <Button size="sm" variant="outline" className="w-full">
                    <CalendarPlus className="h-3.5 w-3.5" />
                    Забронювати
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Елемент-сторож для IntersectionObserver */}
      <div ref={sentinelRef} className="flex flex-col items-center justify-center py-4">
        {isFetchingNextPage && (
          <div className="inline-flex items-center gap-2 text-xs font-medium text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin text-primary-600" />
            <span>Підвантаження наступної сторінки...</span>
          </div>
        )}
        {!hasNextPage && items.length > 0 && (
          <p className="text-xs text-slate-400">Усі ресурси завантажено</p>
        )}
      </div>
    </div>
  );
}