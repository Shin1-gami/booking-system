import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Pencil, Trash2 } from 'lucide-react';
import Breadcrumbs from '@/components/common/Breadcrumbs';
import Button from '@/components/common/Button';
import ConfirmModal from '@/components/common/ConfirmModal';
import ErrorAlert from '@/components/common/ErrorAlert';
import { DetailsSkeleton } from '@/components/common/Skeleton';
import { useCategoryQuery, useDeleteCategoryMutation } from '@/hooks/queries/useCategories';
import { useResourcesQuery } from '@/hooks/queries/useResources';
import { extractApiErrorMessage } from '@/services/api';
import { useAuthStore } from '@/stores/authStore';
import { formatCurrency, formatDateTime } from '@/utils/format';

export default function CategoryDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isAdmin = useAuthStore((s) => s.user?.role === 'ADMIN');
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const categoryQuery = useCategoryQuery(id);
  const resourcesQuery = useResourcesQuery({
    page: 1,
    limit: 20,
    ...(id && { categoryId: id }),
  });
  const deleteMutation = useDeleteCategoryMutation();

  const handleDelete = async () => {
    if (!id) return;
    await deleteMutation.mutateAsync(id);
    navigate('/dashboard/categories', { replace: true });
  };

  if (categoryQuery.isLoading) {
    return <DetailsSkeleton />;
  }

  if (categoryQuery.error || !categoryQuery.data) {
    return (
      <div className="space-y-4">
        <Breadcrumbs currentLabel="Категорію не знайдено" />
        <ErrorAlert
          message={extractApiErrorMessage(
            categoryQuery.error ?? new Error('Категорію не знайдено')
          )}
          onRetry={() => categoryQuery.refetch()}
        />
      </div>
    );
  }

  const category = categoryQuery.data;

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: 'Панель керування', to: '/dashboard' },
          { label: 'Категорії', to: '/dashboard/categories' },
          { label: category.name },
        ]}
      />

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col gap-4 border-b border-slate-100 pb-6 dark:border-slate-800 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{category.name}</h1>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              ID: #{category.id}
              {category.createdAt ? ` • Створено: ${formatDateTime(category.createdAt)}` : ''}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Link to="/dashboard/categories">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4" />
                До списку
              </Button>
            </Link>
            {isAdmin && (
              <>
                <Link to={`/dashboard/categories/${category.id}/edit`}>
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

        <p className="mt-5 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
          {category.description || 'Опис для цієї категорії не вказано.'}
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">
          Ресурси у цій категорії ({resourcesQuery.data?.pagination.total ?? 0})
        </h2>

        {(resourcesQuery.data?.data.length ?? 0) === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">
            У цій категорії поки що немає жодного ресурсу.
          </p>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {resourcesQuery.data?.data.map((res) => (
              <Link
                key={res.id}
                to={`/dashboard/resources/${res.id}`}
                className="flex items-center justify-between py-3 text-sm hover:bg-slate-50 dark:hover:bg-slate-800/40"
              >
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white">{res.name}</p>
                  {res.location && <p className="text-xs text-slate-500">{res.location}</p>}
                </div>
                <span className="font-bold text-primary-600 dark:text-primary-400">
                  {formatCurrency(res.price)}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={isDeleteOpen}
        title="Видалити категорію?"
        description={`Ви дійсно бажаєте видалити категорію «${category.name}»?`}
        isLoading={deleteMutation.isPending}
        onConfirm={handleDelete}
        onCancel={() => setIsDeleteOpen(false)}
      />
    </div>
  );
}