import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import Breadcrumbs from '@/components/common/Breadcrumbs';
import Button from '@/components/common/Button';
import ErrorAlert from '@/components/common/ErrorAlert';
import Input, { Textarea } from '@/components/common/Input';
import Loading from '@/components/common/Loading';
import {
  useCategoryQuery,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
} from '@/hooks/queries/useCategories';
import { categorySchema, type CategoryFormValues } from '@/schemas/validation';
import { extractApiErrorMessage } from '@/services/api';

export default function CategoryFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEditMode = Boolean(id);
  const navigate = useNavigate();

  const categoryQuery = useCategoryQuery(id);
  const createMutation = useCreateCategoryMutation();
  const updateMutation = useUpdateCategoryMutation(id ?? '');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: { name: '', description: '' },
  });

  useEffect(() => {
    if (isEditMode && categoryQuery.data) {
      reset({
        name: categoryQuery.data.name,
        description: categoryQuery.data.description ?? '',
      });
    }
  }, [isEditMode, categoryQuery.data, reset]);

  const onSubmit = async (values: CategoryFormValues) => {
    const payload = {
      name: values.name,
      description: values.description || undefined,
    };
    if (isEditMode && id) {
      await updateMutation.mutateAsync(payload);
    } else {
      await createMutation.mutateAsync(payload);
    }
    navigate('/dashboard/categories');
  };

  if (isEditMode && categoryQuery.isLoading) {
    return <Loading text="Завантаження даних категорії..." />;
  }

  const mutationError = createMutation.error || updateMutation.error || categoryQuery.error;
  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="mx-auto max-w-xl">
      <Breadcrumbs
        items={[
          { label: 'Панель керування', to: '/dashboard' },
          { label: 'Категорії', to: '/dashboard/categories' },
          { label: isEditMode ? 'Редагування категорії' : 'Нова категорія' },
        ]}
      />

      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          {isEditMode
            ? `Редагування: ${categoryQuery.data?.name ?? ''}`
            : 'Створення нової категорії'}
        </h1>
        <Link to="/dashboard/categories">
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
          label="Назва категорії *"
          placeholder="Конференц-зали"
          error={errors.name?.message}
          {...register('name')}
        />

        <Textarea
          label="Опис категорії"
          rows={4}
          placeholder="Короткий опис призначення цієї категорії..."
          error={errors.description?.message}
          {...register('description')}
        />

        <div className="flex justify-end gap-3 border-t border-slate-100 pt-4 dark:border-slate-800">
          <Link to="/dashboard/categories">
            <Button type="button" variant="outline">
              Скасувати
            </Button>
          </Link>
          <Button type="submit" isLoading={isSaving}>
            <Save className="h-4 w-4" />
            {isEditMode ? 'Зберегти зміни' : 'Створити категорію'}
          </Button>
        </div>
      </form>
    </div>
  );
}