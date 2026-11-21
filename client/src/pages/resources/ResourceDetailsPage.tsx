import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Building2,
  Calendar,
  Clock,
  DollarSign,
  Edit,
  MapPin,
  Trash2,
  Users,
} from 'lucide-react';
import {
  resourceKeys,
  useDeleteResourceMutation,
  useResourceQuery,
} from '@/hooks/queries/useResources';
import { bookingKeys, useBookingsQuery } from '@/hooks/queries/useBookings';
import { useSocketEvent } from '@/hooks/useSocketEvent';
import { joinResourceRoom, leaveResourceRoom } from '@/services/socket';
import { useAuthStore } from '@/stores/authStore';
import ConfirmModal from '@/components/common/ConfirmModal';
import BookingCalendar from '@/components/interactive/BookingCalendar';
import type { Booking } from '@/types';

export function ResourceDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const isAdmin = user?.role === 'ADMIN';

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const { data: resource, isLoading, error } = useResourceQuery(id);
  const { data: bookingsResponse } = useBookingsQuery({ resourceId: id, limit: 100 });
  const deleteResource = useDeleteResourceMutation();

  useEffect(() => {
    if (!id) return;
    joinResourceRoom(id);
    return () => {
      leaveResourceRoom(id);
    };
  }, [id]);

  useSocketEvent('booking:created', () => {
    queryClient.invalidateQueries({ queryKey: bookingKeys.all });
    if (id) {
      queryClient.invalidateQueries({ queryKey: resourceKeys.detail(id) });
    }
  });

  useSocketEvent('booking:updated', () => {
    queryClient.invalidateQueries({ queryKey: bookingKeys.all });
    if (id) {
      queryClient.invalidateQueries({ queryKey: resourceKeys.detail(id) });
    }
  });

  useSocketEvent('booking:cancelled', () => {
    queryClient.invalidateQueries({ queryKey: bookingKeys.all });
    if (id) {
      queryClient.invalidateQueries({ queryKey: resourceKeys.detail(id) });
    }
  });

  const handleDelete = async () => {
    if (!id) return;
    await deleteResource.mutateAsync(id);
    setIsDeleteModalOpen(false);
    navigate('/resources');
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
      </div>
    );
  }

  if (error || !resource) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center dark:border-red-900/50 dark:bg-red-950/30">
        <p className="text-red-600 dark:text-red-400">
          Не вдалося завантажити інформацію про ресурс.
        </p>
        <Link
          to="/resources"
          className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
        >
          <ArrowLeft className="h-4 w-4" />
          Повернутися до списку ресурсів
        </Link>
      </div>
    );
  }

  const isAvailable = (resource.status ?? 'AVAILABLE') === 'AVAILABLE';
  const bookingsList: Booking[] = bookingsResponse?.data ?? [];
  const activeBookingsCount = bookingsList.filter(
    (booking) => booking.status !== 'CANCELLED'
  ).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Link
          to="/resources"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition-colors hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Назад до ресурсів
        </Link>

        <div className="flex flex-wrap items-center gap-3">
          {isAvailable && (
            <Link
              to={`/bookings/new?resourceId=${resource.id}`}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-xs transition-colors hover:bg-indigo-500"
            >
              <Calendar className="h-4 w-4" />
              Забронювати
            </Link>
          )}

          {isAdmin && (
            <>
              <Link
                to={`/resources/${resource.id}/edit`}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
              >
                <Edit className="h-4 w-4" />
                Редагувати
              </Link>
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(true)}
                className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-100 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400 dark:hover:bg-red-950/50"
              >
                <Trash2 className="h-4 w-4" />
                Видалити
              </button>
            </>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        {resource.imageUrl && (
          <div className="mb-6 overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800">
            <img
              src={resource.imageUrl}
              alt={resource.name}
              className="h-64 w-full object-cover sm:h-80"
            />
          </div>
        )}

        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                {resource.name}
              </h1>
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  isAvailable
                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400'
                    : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                }`}
              >
                {isAvailable ? 'Доступний' : 'Недоступний'}
              </span>
            </div>

            {resource.category && (
              <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400">
                <Building2 className="h-4 w-4" />
                {resource.category.name}
              </p>
            )}
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800/50">
            <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
              <Users className="h-4 w-4 text-indigo-500" />
              <span>Місткість</span>
            </div>
            <p className="mt-1 text-lg font-semibold text-slate-900 dark:text-white">
              {resource.capacity ? `${resource.capacity} осіб` : 'Не вказано'}
            </p>
          </div>

          <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800/50">
            <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
              <DollarSign className="h-4 w-4 text-emerald-500" />
              <span>Вартість</span>
            </div>
            <p className="mt-1 text-lg font-semibold text-slate-900 dark:text-white">
              {Number(resource.price) > 0 ? `${resource.price} ₴ / год` : 'Безкоштовно'}
            </p>
          </div>

          <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800/50">
            <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
              <MapPin className="h-4 w-4 text-rose-500" />
              <span>Розташування</span>
            </div>
            <p className="mt-1 text-lg font-semibold text-slate-900 dark:text-white">
              {resource.location || 'Основний корпус'}
            </p>
          </div>

          <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800/50">
            <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
              <Clock className="h-4 w-4 text-amber-500" />
              <span>Активних бронювань</span>
            </div>
            <p className="mt-1 text-lg font-semibold text-slate-900 dark:text-white">
              {activeBookingsCount}
            </p>
          </div>
        </div>

        {resource.description && (
          <div className="mt-6 border-t border-slate-200 pt-6 dark:border-slate-800">
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">
              Опис ресурсу
            </h2>
            <div
              className="prose prose-slate dark:prose-invert mt-2 max-w-none text-sm text-slate-600 dark:text-slate-300"
              dangerouslySetInnerHTML={{ __html: resource.description }}
            />
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">
          Календар зайнятості
        </h2>
        <BookingCalendar bookings={bookingsList} />
      </div>

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onCancel={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDelete}
        title="Видалити ресурс?"
        description={`Ви дійсно бажаєте видалити «${resource.name}»? Цю дію неможливо скасувати.`}
        confirmLabel="Видалити"
        isLoading={deleteResource.isPending}
      />
    </div>
  );
}

export default ResourceDetailsPage;