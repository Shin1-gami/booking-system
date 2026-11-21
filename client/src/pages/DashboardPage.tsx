import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Boxes,
  CalendarCheck2,
  Clock,
  FolderKanban,
  Plus,
} from 'lucide-react';
import Badge from '@/components/common/Badge';
import Breadcrumbs from '@/components/common/Breadcrumbs';
import Button from '@/components/common/Button';
import ErrorAlert from '@/components/common/ErrorAlert';
import { Skeleton } from '@/components/common/Skeleton';
import { useBookingsQuery } from '@/hooks/queries/useBookings';
import { useCategoriesQuery } from '@/hooks/queries/useCategories';
import { useResourcesQuery } from '@/hooks/queries/useResources';
import { extractApiErrorMessage } from '@/services/api';
import { useAuthStore } from '@/stores/authStore';
import { BOOKING_STATUS_META, formatCurrency, formatDateTime } from '@/utils/format';

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === 'ADMIN';

  const resourcesQuery = useResourcesQuery({ page: 1, limit: 5 });
  const bookingsQuery = useBookingsQuery({ page: 1, limit: 5 });
  const categoriesQuery = useCategoriesQuery({ page: 1, limit: 5 });

  const isLoading =
    resourcesQuery.isLoading || bookingsQuery.isLoading || categoriesQuery.isLoading;
  const queryError = resourcesQuery.error || bookingsQuery.error || categoriesQuery.error;

  const stats = [
    {
      title: 'Усього ресурсів',
      value: resourcesQuery.data?.pagination.total ?? 0,
      icon: Boxes,
      to: '/dashboard/resources',
      accent: 'bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400',
    },
    {
      title: 'Бронювання',
      value: bookingsQuery.data?.pagination.total ?? 0,
      icon: CalendarCheck2,
      to: '/dashboard/bookings',
      accent: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400',
    },
    {
      title: 'Категорії',
      value: categoriesQuery.data?.pagination.total ?? 0,
      icon: FolderKanban,
      to: '/dashboard/categories',
      accent: 'bg-purple-50 text-purple-600 dark:bg-purple-950/60 dark:text-purple-400',
    },
  ];

  return (
    <div>
      <Breadcrumbs items={[{ label: 'Панель керування' }]} />

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white sm:text-3xl">
            Вітаємо, {user?.name ?? 'користувачу'}!
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Огляд ресурсів, активних бронювань та швидкий доступ до основних розділів
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5">
          <Link to="/dashboard/bookings/new">
            <Button size="sm">
              <Plus className="h-4 w-4" />
              Нове бронювання
            </Button>
          </Link>
          {isAdmin && (
            <Link to="/dashboard/resources/new">
              <Button variant="outline" size="sm">
                <Plus className="h-4 w-4" />
                Додати ресурс
              </Button>
            </Link>
          )}
        </div>
      </div>

      {queryError && (
        <ErrorAlert
          message={extractApiErrorMessage(queryError)}
          onRetry={() => {
            resourcesQuery.refetch();
            bookingsQuery.refetch();
            categoriesQuery.refetch();
          }}
          className="mb-6"
        />
      )}

      {/* Картки статистики */}
      <div className="mb-8 grid gap-5 sm:grid-cols-3">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link
              key={stat.title}
              to={stat.to}
              className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition hover:border-primary-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-primary-800"
            >
              <div className="flex items-center justify-between">
                <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${stat.accent}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <ArrowRight className="h-4 w-4 text-slate-400 transition group-hover:translate-x-1 group-hover:text-primary-600" />
              </div>
              <p className="mt-4 text-sm font-medium text-slate-500 dark:text-slate-400">
                {stat.title}
              </p>
              {isLoading ? (
                <Skeleton className="mt-1.5 h-8 w-20" />
              ) : (
                <p className="mt-1 text-3xl font-bold text-slate-900 dark:text-white">
                  {stat.value}
                </p>
              )}
            </Link>
          );
        })}
      </div>

      {/* Останні бронювання та доступні ресурси */}
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
              Останні бронювання
            </h2>
            <Link
              to="/dashboard/bookings"
              className="text-xs font-semibold text-primary-600 hover:underline dark:text-primary-400"
            >
              Усі бронювання →
            </Link>
          </div>

          {bookingsQuery.isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : (bookingsQuery.data?.data.length ?? 0) === 0 ? (
            <p className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">
              Бронювань поки що немає.
            </p>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {bookingsQuery.data?.data.map((booking) => {
                const statusMeta = BOOKING_STATUS_META[booking.status] ?? {
                  label: booking.status,
                  variant: 'neutral' as const,
                };
                return (
                  <Link
                    key={booking.id}
                    to={`/dashboard/bookings/${booking.id}`}
                    className="flex items-center justify-between gap-3 py-3 transition hover:bg-slate-50 dark:hover:bg-slate-800/40"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                        {booking.resource?.name ?? `Ресурс #${booking.resourceId}`}
                      </p>
                      <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                        <Clock className="h-3 w-3" />
                        <span>{formatDateTime(booking.startTime)}</span>
                      </p>
                    </div>
                    <Badge variant={statusMeta.variant}>{statusMeta.label}</Badge>
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
              Популярні ресурси
            </h2>
            <Link
              to="/dashboard/resources"
              className="text-xs font-semibold text-primary-600 hover:underline dark:text-primary-400"
            >
              Усі ресурси →
            </Link>
          </div>

          {resourcesQuery.isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : (resourcesQuery.data?.data.length ?? 0) === 0 ? (
            <p className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">
              Ресурси відсутні.
            </p>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {resourcesQuery.data?.data.map((resource) => (
                <Link
                  key={resource.id}
                  to={`/dashboard/resources/${resource.id}`}
                  className="flex items-center justify-between gap-3 py-3 transition hover:bg-slate-50 dark:hover:bg-slate-800/40"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                      {resource.name}
                    </p>
                    <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                      {resource.category?.name ?? 'Без категорії'}
                      {resource.location ? ` • ${resource.location}` : ''}
                    </p>
                  </div>
                  <span className="shrink-0 text-sm font-bold text-primary-600 dark:text-primary-400">
                    {formatCurrency(resource.price)}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}