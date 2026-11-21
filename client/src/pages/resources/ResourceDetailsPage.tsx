import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  CalendarPlus,
  FolderKanban,
  MapPin,
  Pencil,
  Trash2,
  Users,
} from 'lucide-react';
import Badge from '@/components/common/Badge';
import Breadcrumbs from '@/components/common/Breadcrumbs';
import Button from '@/components/common/Button';
import ConfirmModal from '@/components/common/ConfirmModal';
import ErrorAlert from '@/components/common/ErrorAlert';
import OnlineStatusBadge from '@/components/common/OnlineStatusBadge';
import { DetailsSkeleton } from '@/components/common/Skeleton';
import { bookingKeys, useBookingsQuery } from '@/hooks/queries/useBookings';
import {
  resourceKeys,
  useDeleteResourceMutation,
  useResourceQuery,
} from '@/hooks/queries/useResources';
import { useSocketEvent } from '@/hooks/useSocketEvent';
import { extractApiErrorMessage } from '@/services/api';
import { joinResourceRoom, leaveResourceRoom } from '@/services/socket';
import { useAuthStore } from '@/stores/authStore';
import { usePresenceStore } from '@/stores/presenceStore';
import {
  BOOKING_STATUS_META,
  formatCurrency,
  formatDateTime,
  RESOURCE_STATUS_META,
} from '@/utils/format';

export default function ResourceDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const isConnected = usePresenceStore((s) => s.isConnected);
  const isAdmin = user?.role === 'ADMIN';

  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const resourceQuery = useResourceQuery(id);
  const resourceBookingsQuery = useBookingsQuery({
    page: 1,
    limit: 5,
    ...(id && { resourceId: id }),
  });
  const deleteMutation = useDeleteResourceMutation();

  // Підключення до Socket.IO-кімнати поточного ресурсу (та повторний вхід після реконекту)
  useEffect(() => {
    if (!id || !isConnected) return;
    joinResourceRoom(id);
    return () => leaveResourceRoom(id);
  }, [id, isConnected]);

  const invalidateResourceBookings = () => {
    queryClient.invalidateQueries({ queryKey: bookingKeys.lists() });
  };

  useSocketEvent('booking:created', invalidateResourceBookings);
  useSocketEvent('booking:updated', invalidateResourceBookings);
  useSocketEvent('booking:cancelled', invalidateResourceBookings);
  useSocketEvent('resources:changed', () => {
    if (id) {
      queryClient.invalidateQueries({ queryKey: resourceKeys.detail(id) });
    }
  });

  const handleDelete = async () => {
    if (!id) return;
    await deleteMutation.mutateAsync(id);
    navigate('/dashboard/resources', { replace: true });
  };

  if (resourceQuery.isLoading) {
    return <DetailsSkeleton />;
  }

  if (resourceQuery.error || !resourceQuery.data) {
    return (
      <div className="space-y-4">
        <Breadcrumbs currentLabel="Помилка завантаження" />
        <ErrorAlert
          message={extractApiErrorMessage(resourceQuery.error ?? new Error('Ресурс не знайдено'))}
          onRetry={() => resourceQuery.refetch()}
        />
      </div>
    );
  }

  const resource = resourceQuery.data;
  const statusMeta = RESOURCE_STATUS_META[resource.status ?? 'AVAILABLE'];

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: 'Панель керування', to: '/dashboard' },
          { label: 'Ресурси', to: '/dashboard/resources' },
          { label: resource.name },
        ]}
      />

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col gap-4 border-b border-slate-100 pb-6 dark:border-slate-800 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                {resource.name}
              </h1>
              <Badge variant={statusMeta.variant}>{statusMeta.label}</Badge>
            </div>
            <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
              ID запису: #{resource.id}
              {resource.createdAt ? ` • Створено: ${formatDateTime(resource.createdAt)}` : ''}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Link to="/dashboard/resources">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4" />
                До списку
              </Button>
            </Link>
            <Link to={`/dashboard/bookings/new?resourceId=${resource.id}`}>
              <Button size="sm">
                <CalendarPlus className="h-4 w-4" />
                Забронювати
              </Button>
            </Link>
            {isAdmin && (
              <>
                <Link to={`/dashboard/resources/${resource.id}/edit`}>
                  <Button variant="secondary" size="sm">
                    <Pencil className="h-4 w-4" />
                    Редагувати
                  </Button>
                </Link>
                <Button variant="danger" size="sm" onClick={() => setIsDeleteOpen(true)}>
                  <Trash2 className="h-4 w-4" />
                  Видалити
                </Button>
              </>
            )}
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800/50">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Вартість</p>
            <p className="mt-1 text-xl font-bold text-primary-600 dark:text-primary-400">
              {formatCurrency(resource.price)}
            </p>
          </div>

          <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800/50">
            <p className="flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">
              <FolderKanban className="h-3.5 w-3.5" />
              Категорія
            </p>
            <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">
              {resource.category?.name ?? 'Без категорії'}
            </p>
          </div>

          <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800/50">
            <p className="flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">
              <MapPin className="h-3.5 w-3.5" />
              Локація
            </p>
            <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">
              {resource.location || 'Не вказано'}
            </p>
          </div>

          <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800/50">
            <p className="flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">
              <Users className="h-3.5 w-3.5" />
              Місткість
            </p>
            <p class