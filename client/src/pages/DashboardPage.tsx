import { lazy, Suspense, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BarChart3,
  Boxes,
  CalendarCheck2,
  CalendarDays,
  Clock,
  FolderKanban,
  Infinity as InfinityIcon,
  ListTodo,
  Plus,
} from 'lucide-react';
import Badge from '@/components/common/Badge';
import Breadcrumbs from '@/components/common/Breadcrumbs';
import Button from '@/components/common/Button';
import ErrorAlert from '@/components/common/ErrorAlert';
import Loading from '@/components/common/Loading';
import OnlineStatusBadge from '@/components/common/OnlineStatusBadge';
import { Skeleton } from '@/components/common/Skeleton';
import Tabs from '@/components/common/Tabs';
import TaskBoard from '@/components/interactive/TaskBoard';
import { useBookingsQuery } from '@/hooks/queries/useBookings';
import { useCategoriesQuery } from '@/hooks/queries/useCategories';
import { useResourcesQuery } from '@/hooks/queries/useResources';
import { useDocumentMeta } from '@/hooks/useDocumentMeta';
import { extractApiErrorMessage } from '@/services/api';
import { useAuthStore } from '@/stores/authStore';
import { BOOKING_STATUS_META, formatCurrency, formatDateTime } from '@/utils/format';

// Відкладене завантаження важких візуальних модулів (Recharts, DayPicker, InfiniteScroll)
const StatsChart = lazy(() => import('@/components/interactive/StatsChart'));
const BookingCalendar = lazy(() => import('@/components/interactive/BookingCalendar'));
const InfiniteResourcesFeed = lazy(() => import('@/components/interactive/InfiniteResourcesFeed'));

export default function DashboardPage() {
  useDocumentMeta('Панель керування — BookingSystem', 'Аналітика, графіки, календар та управління бронюваннями');

  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === 'ADMIN';

  const resourcesQuery = useResourcesQuery({ page: 1, limit: 50 });
  const bookingsQuery = useBookingsQuery({ page: 1, limit: 50 });
  const categoriesQuery = useCategoriesQuery({ page: 1, limit: 50 });

  const isLoading =
    resourcesQuery.isLoading || bookingsQuery.isLoading || categoriesQuery.isLoading;
  const queryError = resourcesQuery.error || bookingsQuery.error || categoriesQuery.error;

  const bookingsByStatusChart = useMemo(() => {
    const list = bookingsQuery.data?.data ?? [];
    const counts: Record<string, number> = {
      PENDING: 0,
      CONFIRMED: 0,
      COMPLETED: 0,
      CANCELLED: 0,
    };
    list.forEach((b) => {
      counts[b.status] = (counts[b.status] ?? 0) + 1;
    });
    return [
      { name: 'Очікують', value: counts.PENDING },
      { name: 'Підтверджені', value: counts.CONFIRMED },
      { name: 'Завершені', value: counts.COMPLETED },
      { name: 'Скасовані', value: counts.CANCELLED },
    ];
  }, [bookingsQuery.data?.data]);

  const resourcesByCategoryChart = useMemo(() => {
    const categories = categoriesQuery.data?.data ?? [];
    return categories.map((cat) => ({
      name: cat.name,
      value:
        cat._count?.resources ??
        (resourcesQuery.data?.data ?? []).filter((r) => String(r.categoryId) === String(cat.id)).length,
    }));
  }, [categoriesQuery.data?.data, resourcesQuery.data?.data]);

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
            Огляд ресурсів, реальна статистика бронювань та інтерактивні інструменти планування
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

      {/* Картки ключових показників */}
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

      {/* Організація контенту через таби Headless UI */}
      <Tabs
        className="mb-8"
        items={[
          {
            id: 'analytics',
            label: 'Аналітика та графіки',
            icon: <BarChart3 className="h-4 w-4" />,
            content: (
              <Suspense fallback={<Loading text="Завантаження графіків..." />}>
                <div className="grid gap-6 lg:grid-cols-2">
                  <StatsChart
                    title="Динаміка бронювань за статусами"
                    subtitle="Актуальний розподіл заявок у системі"
                    data={bookingsByStatusChart}
                    variant="area"
                    valueLabel="Бронювань"
                  />
                  <StatsChart
                    title="Ресурси за категоріями"
                    subtitle="Кількість доступних локацій та обладнання"
                    data={resourcesByCategoryChart}
                    variant="bar"
                    valueLabel="Ресурсів"
                    color="#10b981"
                  />
                </div>
              </Suspense>
            ),
          },
          {
            id: 'tasks',
            label: 'Планувальник (Drag & Drop)',
            icon: <ListTodo className="h-4 w-4" />,
            content: <TaskBoard />,
          },
          {
            id: 'calendar',
            label: 'Календар бронювань',
            icon: <CalendarDays className="h-4 w-4" />,
            badge: bookingsQuery.data?.pagination.total ?? 0,
            content: (
              <Suspense fallback={<Loading text="Завантаження календаря..." />}>
                <BookingCalendar bookings={bookingsQuery.data?.data ?? []} />
              </Suspense>
            ),
          },
          {
            id: 'infinite-feed',
            label: 'Стрічка ресурсів (Infinite Scroll)',
            icon: <InfinityIcon className="h-4 w-4" />,
            content: (
              <Suspense fallback={<Loading text="Завантаження каталогу..." />}>
                <InfiniteResourcesFeed />
              </Suspense>
            ),
          },
        ]}
      />

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
              {bookingsQuery.data?.data.slice(0, 5).map((booking) => {
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
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                          {booking.resource?.name ?? `Ресурс #${booking.resourceId}`}
                        </p>
                        {booking.userId && <OnlineStatusBadge userId={booking.userId} showLabel={false} />}
                      </div>
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
              {resourcesQuery.data?.data.slice(0, 5).map((resource) => (
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