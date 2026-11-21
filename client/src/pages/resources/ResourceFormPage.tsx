import { lazy, Suspense, useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import Breadcrumbs from '@/components/common/Breadcrumbs';
import Button from '@/components/common/Button';
import ErrorAlert from '@/components/common/ErrorAlert';
import Input, { Select } from '@/components/common/Input';
import Loading from '@/components/common/Loading';
import SearchableSelect from '@/components/common/SearchableSelect';
import { useFlatCategoriesQuery } from '@/hooks/queries/useCategories';
import {
  useCreateResourceMutation,
  useResourceQuery,
  useUpdateResourceMutation,
} from '@/hooks/queries/useResources';
import { resourceSchema, type ResourceFormValues } from '@/schemas/validation';
import { extractApiErrorMessage } from '@/services/api';

const RichTextEditor = lazy(() => import('@/components/interactive/RichTextEditor'));
const ImageCropUploader = lazy(() => import('@/components/interactive/ImageCropUploader'));

export default function ResourceFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEditMode = Boolean(id);
  const navigate = useNavigate();

  const resourceQuery = useResourceQuery(id);
  const categoriesQuery = useFlatCategoriesQuery();
  const createMutation = useCreateResourceMutation();
  const updateMutation = useUpdateResourceMutation(id ?? '');

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ResourceFormValues>({
    resolver: zodResolver(resourceSchema),
    defaultValues: {
      name: '',
      description: '',
      location: '',
      price: 0,
      capacity: undefined,
      status: 'AVAILABLE',
      categoryId: '',
    },
  });

  useEffect(() => {
    if (isEditMode && resourceQuery.data) {
      const r = resourceQuery.data;
      reset({
        name: r.name,
        description: r.description ?? '',
        location: r.location ?? '',
        price: Number(r.price),
        capacity: r.capacity ?? undefined,
        status: r.status ?? 'AVAILABLE',
        categoryId: r.categoryId ? String(r.categoryId) : '',
      });
    }
  }, [isEditMode, resourceQuery.data, reset]);

  const onSubmit = async (values: ResourceFormValues) => {
    const plainDescription = values.description?.replace(/<[^>]+>/g, '').trim();
    const payload = {
      name: values.name,
      location: values.location,
      price: Number(values.price),
      categoryId: Number(values.categoryId),
      ...(plainDescription ? { description: plainDescription } : {}),
    };

    if (isEditMode && id) {
      await updateMutation.mutateAsync(payload);
    } else {
      await createMutation.mutateAsync(payload);
    }
    navigate('/dashboard/resources');
  };

  if (isEditMode && resourceQuery.isLoading) {
    return <Loading text="Завантаження даних ресурсу..." />;
  }

  const mutationError = createMutation.error || updateMutation.error || resourceQuery.error;
  const isSaving = createMutation.isPending || updateMutation.isPending;

  const categoryOptions = (categoriesQuery.data ?? []).map((cat) => ({
    value: String(cat.id),
    label: cat.name,
    subtitle: cat._count?.resources !== undefined ? `Ресурсів: ${cat._count.resources}` : undefined,
  }));

  return (
    <div className="mx-auto max-w-2xl">
      <Breadcrumbs
        items={[
          { label: 'Панель керування', to: '/dashboard' },
          { label: 'Ресурси', to: '/dashboard/resources' },
          { label: isEditMode ? 'Редагування ресурсу' : 'Новий ресурс' },
        ]}
      />

      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          {isEditMode ? `Редагування: ${resourceQuery.data?.name ?? ''}` : 'Створення нового ресурсу'}
        </h1>
        <Link to="/dashboard/resources">
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
        <Input
          label="Назва ресурсу *"
          placeholder="Конференц-зала «Горизонт»"
          error={errors.name?.message}
          {...register('name')}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <Controller
            name="categoryId"
            control={control}
            render={({ field }) => (
              <SearchableSelect
                label="Категорія *"
                options={categoryOptions}
                value={field.value}
                onChange={field.onChange}
                placeholder="Пошук категорії..."
                error={errors.categoryId?.message}
              />
            )}
          />

          <Select label="Статус доступності" error={errors.status?.message} {...register('status')}>
            <option value="AVAILABLE">Доступний</option>
            <option value="MAINTENANCE">На обслуговуванні</option>
            <option value="UNAVAILABLE">Недоступний</option>
          </Select>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Ціна за годину (₴) *"
            type="number"
            step="0.01"
            min="0"
            error={errors.price?.message}
            {...register('price', { valueAsNumber: true })}
          />

          <Input
            label="Місткість (осіб)"
            type="number"
            min="1"
            placeholder="12"
            error={errors.capacity?.message}
            {...register('capacity', {
              setValueAs: (v) =>
                v === '' || v === null || Number.isNaN(Number(v)) ? undefined : Number(v),
            })}
          />
        </div>

        <Input
          label="Локація / Адреса *"
          placeholder="Корпус А, 3-й поверх, ауд. 305"
          error={errors.location?.message}
          {...register('location')}
        />

        <Suspense fallback={<Loading text="Завантаження редактора..." />}>
          <Controller
            name="description"
            control={control}
            render={({ field }) => (
              <RichTextEditor
                label="Опис ресурсу"
                value={field.value ?? ''}
                onChange={field.onChange}
                error={errors.description?.message}
              />
            )}
          />
        </Suspense>

        <Suspense fallback={<Loading text="Завантаження модуля зображень..." />}>
          <ImageCropUploader />
        </Suspense>

        <div className="flex justify-end gap-3 border-t border-slate-100 pt-4 dark:border-slate-800">
          <Link to="/dashboard/resources">
            <Button type="button" variant="outline">
              Скасувати
            </Button>
          </Link>
          <Button type="submit" isLoading={isSaving}>
            <Save className="h-4 w-4" />
            {isEditMode ? 'Зберегти зміни' : 'Створити ресурс'}
          </Button>
        </div>
      </form>
    </div>
  );
}