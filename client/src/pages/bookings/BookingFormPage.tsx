import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import Breadcrumbs from '@/components/common/Breadcrumbs';
import Button from '@/components/common/Button';
import ErrorAlert from '@/components/common/ErrorAlert';
import Input, { Select, Textarea } from '@/components/common/Input';
import Loading from '@/components/common/Loading';
import SearchableSelect from '@/components/common/SearchableSelect';
import {
  useBookingQuery,
  useCreateBookingMutation,
  useUpdateBookingMutation,
} from '@/hooks/queries/useBookings';
import { useResourcesQuery } from '@/hooks/queries/useResources';
import { bookingSchema, type BookingFormValues } from '@/schemas/validation';
import { extractApiErrorMessage } from '@/services/api';
import { useAuthStore } from '@/stores/authStore';
import { formatCurrency, toDateTimeLocalValue } from '@/utils/format';

export default function BookingFormPage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const preselectedResourceId = searchParams.get('resourceId') ?? '';
  const isEditMode = Boolean(id);
  const navigate = useNavigate();
  const isAdmin = useAuthStore((s) => s.user?.role === 'ADMIN');

  const bookingQuery = useBookingQuery(id);
  const resourcesQuery = useResourcesQuery({ page: 1, limit: 100 });
  const createMutation = useCreateBookingMutation();
  const updateMutation = useUpdateBookingMutation(id ?? '');

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<BookingFormValues>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      resourceId: preselectedResourceId,
      startTime: '',
      endTime: '',
      status: 'PENDING',
      notes: '',
    },
  });

  useEffect(() => {
    if (isEditMode && bookingQuery.data) {
      const b = bookingQuery.data;
      reset({
        resourceId: String(b.resourceId),
        startTime: toDateTimeLocalValue(b.startTime),
        endTime: toDateTimeLocalValue(b.endTime),
        status: b.status,
        notes: b.notes ?? '',
      });
    } else if (!isEditMode && preselectedResourceId) {
      reset((prev) => ({ ...prev, resourceId: preselectedResourceId }));
    }
  }, [isEditMode, bookingQuery.data, preselectedResourceId, reset]);

  const onSubmit = async (values: BookingFormValues) => {
    if (isEditMode && id) {
      await updateMutation.mutateAsync({
        startTime: new Date(values.startTime).toISOString(),
        endTime: new Date(values.endTime).toISOString(),
        ...(values.status ? { status: values.status } : {}),
      });
    } else {
      await createMutation.mutateAsync({
        resourceId: Number(values.resourceId),
        startTime: new Date(values.startTime).toISOString(),
        endTime: new Date(values.endTime).toISOString(),
        ...(values.notes ? { notes: values.notes } : {}),
      });
    }
    navigate('/dashboard/bookings');
  };

  if (isEditMode && bookingQuery.isLoading) {
    return <Loading text="Завантаження даних бронювання..." />;
  }

  const mutationError = createMutation.error || updateMutation.error || bookingQuery.error;
  const isSaving = createMutation.isPending || updateMutation.isPending;

  const resourceOptions = (resourcesQuery.data?.data ?? []).map((res) => ({
    value: String(res.id),
    label: `${res.name} (${formatCurrency(res.price)}/год)`,
    subtitle: res.location ?? res.category?.name ?? undefined,
  }));

  return (
    <div className="mx-auto max-w-2xl">
      <Breadcrumbs
        items={[
          { label: 'Панель керування', to: '/dashboard' },
          { label: 'Бронювання', to: '/dashboard/bookings' },
          { label: isEditMode ? `Редагування #${id}` : 'Нове бронювання' },
        ]}
      />

      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          {isEditMode ? `Редагування бронювання #${id}` : 'Створення нового бронювання'}
        </h1>
        <Link to="/dashboard/bookings">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4" />
            Назад
          </Button>
        </Link>
      </div>

      {mutationError && (
        <ErrorAlert message={extractApiErrorMessage(mutationError)} className="mb-5" />
      )}

      <form
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        className="space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900"
      >
        <Controller
          name="resourceId"
          control={control}
          render={({ field }) => (
            <SearchableSelect
              label="Ресурс для бронювання *"
              options={resourceOptions}
              value={field.value}
              onChange={field.onChange}
              disabled={isEditMode}
              placeholder="Пошук ресурсу за назвою або локацією..."
              error={errors.resourceId?.message}
            />
          )}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Дата та час початку *"
            type="datetime-local"
            error={errors.startTime?.message}
            {...register('startTime')}
          />

          <Input
            label="Дата та час завершення *"
            type="datetime-local"
            error={errors.endTime?.message}
            {...register('endTime')}
          />
        </div>

        {isEditMode && (
          <Select label="Статус бронювання" error={errors.status?.message} {...register('status')}>
            <option value="PENDING">Очікує підтвердження</option>
            {isAdmin && <option value="CONFIRMED">Підтверджено</option>}
            {isAdmin && <option value="COMPLETED">Завершено</option>}
            <option value="CANCELLED">Скасовано</option>
          </Select>
        )}

        <Textarea
          label="Коментар або побажання"
          rows={3}
          placeholder="Додаткова інформація щодо бронювання..."
          error={errors.notes?.message}
          {...register('notes')}
        />

        <div className="flex justify-end gap-3 border-t border-slate-100 pt-4 dark:border-slate-800">
          <Link to="/dashboard/bookings">
            <Button type="button" variant="outline">
              Скасувати
            </Button>
          </Link>
          <Button type="submit" isLoading={isSaving}>
            <Save className="h-4 w-4" />
            {isEditMode ? 'Оновити бронювання' : 'Підтвердити бронювання'}
          </Button>
        </div>
      </form>
    </div>
  );
}