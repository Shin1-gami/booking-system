import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Boxes, Calendar, Clock, Pencil, Trash2, User } from 'lucide-react';
import Badge from '@/components/common/Badge';
import Breadcrumbs from '@/components/common/Breadcrumbs';
import Button from '@/components/common/Button';
import ConfirmModal from '@/components/common/ConfirmModal';
import ErrorAlert from '@/components/common/ErrorAlert';
import { DetailsSkeleton } from '@/components/common/Skeleton';
import { useBookingQuery, useDeleteBookingMutation } from '@/hooks/queries/useBookings';
import { extractApiErrorMessage } from '@/services/api';
import { BOOKING_STATUS_META, formatCurrency, formatDateTime } from '@/utils/format';

export default function BookingDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const bookingQuery = useBookingQuery(id);
  const deleteMutation = useDeleteBookingMutation();

  const handleDelete = async () => {
    if (!id) return;
    await deleteMutation.mutateAsync(id);
    navigate('/dashboard/bookings', { replace: true });
  };

  if (bookingQuery.isLoading) {
    return <DetailsSkeleton />;
  }

  if (bookingQuery.error || !bookingQuery.data) {
    return (
      <div className="space-y-4">
        <Breadcrumbs currentLabel="Бронювання не знайдено" />
        <ErrorAlert
          message={extractApiErrorMessage(
            bookingQuery.error ?? new Error('Бронювання не знайдено')
          )}
          onRetry={() => bookingQuery.refetch()}
        />
      </div>
    );
  }

  const booking = bookingQuery.data;
  const statusMeta = BOOKING_STATUS_META[booking.status];

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: 'Панель керування', to: '/dashboard' },
          { label: 'Бронювання', to: '/dashboard/bookings' },
          { label: `Бронювання #${booking.id}` },
        ]}
      />

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col gap-4 border-b border-slate-100 pb-6 dark:border-slate-800 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                Бронювання #{booking.id}
              </h1>
              <Badge variant={statusMeta.variant}>{statusMeta.label}</Badge>
            </div>
            {booking.createdAt && (
              <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                Створено: {formatDateTime(booking.createdAt)}
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Link to="/dashboard/bookings">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4" />
                До списку
              </Button>
            </Link>
            <Link to={`/dashboard/bookings/${booking.id}/edit`}>
              <Button variant="secondary" size="sm">
                <Pencil className="h-4 w-4" />
                Редагувати
              </Button>
            </Link>
            <Button variant="danger" size="sm" onClick={() => setIsDeleteOpen(true)}>
              <Trash2 className="h-4 w-4" />
              Видалити
            </Button>
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800/50">
            <p className="flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">
              <Boxes className="h-3.5 w-3.5" />
              Ресурс
            </p>
            <Link
              to={`/dashboard/resources/${booking.resourceId}`}
              className="mt-1 block text-sm font-semibold text-primary-600 hover:underline dark:text-primary-400"
            >
              {booking.resource?.name ?? `Ресурс #${booking.resourceId}`}
            </Link>
          </div>

          <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800/50">
            <p className="flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">
              <Calendar className="h-3.5 w-3.5" />
              Початок
            </p>
            <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">
              {formatDateTime(booking.startTime)}
            </p>
          </div>

          <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800/50">
            <p className="flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">
              <Clock className="h-3.5 w-3.5" />
              Завершення
            </p>
            <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">
              {formatDateTime(booking.endTime)}
            </p>
          </div>

          <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800/50">
            <p className="flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">
              <User className="h-3.5 w-3.5" />
              Замовник / Вартість
            </p>
            <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">
              {booking.user?.name ?? 'Поточний користувач'}
              {booking.totalPrice ? ` • ${formatCurrency(booking.totalPrice)}` : ''}
            </p>
          </div>
        </div>

        <div className="mt-6">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Примітки</h2>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
            {booking.notes || 'Додаткових приміток не вказано.'}
          </p>
        </div>
      </div>

      <ConfirmModal
        isOpen={isDeleteOpen}
        title="Видалити бронювання?"
        description={`Ви впевнені, що бажаєте остаточно видалити бронювання #${booking.id}?`}
        isLoading={deleteMutation.isPending}
        onConfirm={handleDelete}
        onCancel={() => setIsDeleteOpen(false)}
      />
    </div>
  );
}