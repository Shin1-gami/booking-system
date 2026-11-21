import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, Pencil, Plus, Trash2 } from 'lucide-react';
import Breadcrumbs from '@/components/common/Breadcrumbs';
import Button from '@/components/common/Button';
import Card from '@/components/common/Card';
import ConfirmModal from '@/components/common/ConfirmModal';
import ErrorAlert from '@/components/common/ErrorAlert';
import Pagination from '@/components/common/Pagination';
import { GridSkeleton, ListSkeleton, TableSkeleton } from '@/components/common/Skeleton';
import DataGrid from '@/components/data-display/DataGrid';
import DataList from '@/components/data-display/DataList';
import DataTable, { type TableColumn } from '@/components/data-display/DataTable';
import FilterBar from '@/components/data-display/FilterBar';
import ViewModeToggle, { type ViewMode } from '@/components/data-display/ViewModeToggle';
import { useCategoriesQuery, useDeleteCategoryMutation } from '@/hooks/queries/useCategories';
import { useDebounce } from '@/hooks/useDebounce';
import { extractApiErrorMessage } from '@/services/api';
import { useAuthStore } from '@/stores/authStore';
import type { Category, SortOrder } from '@/types';
import { formatDateTime } from '@/utils/format';

export default function CategoriesListPage() {
  const navigate = useNavigate();
  const isAdmin = useAuthStore((s) => s.user?.role === 'ADMIN');

  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(9);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);

  const debouncedSearch = useDebounce(search, 350);

  const categoriesQuery = useCategoriesQuery({
    page,
    limit,
    ...(debouncedSearch.trim() && { search: debouncedSearch.trim() }),
    sortBy,
    sortOrder,
  });

  const deleteMutation = useDeleteCategoryMutation();

  const sortedCategories = useMemo(() => {
    const list = [...(categoriesQuery.data?.data ?? [])];
    list.sort((a, b) => {
      const cmp =
        sortBy === 'createdAt'
          ? new Date(a.createdAt ?? 0).getTime() - new Date(b.createdAt ?? 0).getTime()
          : a.name.localeCompare(b.name, 'uk');
      return sortOrder === 'asc' ? cmp : -cmp;
    });
    return list;
  }, [categoriesQuery.data?.data, sortBy, sortOrder]);

  const handleConfirmDelete = async () => {
    if (!categoryToDelete) return;
    await deleteMutation.mutateAsync(categoryToDelete.id);
    setCategoryToDelete(null);
  };

  const renderActions = (cat: Category) => (
    <div
      className="flex items-center justify-end gap-1.5"
      onClick={(e) => e.stopPropagation()}
    >
      <Link
        to={`/dashboard/categories/${cat.id}`}
        title="Детальніше"
        className="rounded-lg p-1.5 text-slate-600 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
      >
        <Eye className="h-4 w-4" />
      </Link>
      {isAdmin && (
        <>
          <Link
            to={`/dashboard/categories/${cat.id}/edit`}
            title="Редагувати"
            className="rounded-lg p-1.5 text-primary-600 transition hover:bg-primary-50 dark:text-primary-400 dark:hover:bg-primary-950/50"
          >
            <Pencil className="h-4 w-4" />
          </Link>
          <button
            type="button"
            onClick={() => setCategoryToDelete(cat)}
            title="Видалити"
            className="rounded-lg p-1.5 text-red-600 transition hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/50"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </>
      )}
    </div>
  );

  const columns: TableColumn<Category>[] = [
    {
      key: 'name',
      header: 'Назва категорії',
      sortKey: 'name',
      render: (c) => <span className="font-semibold text-slate-900 dark:text-white">{c.name}</span>,
    },
    {
      key: 'description',
      header: 'Опис',
      render: (c) => (
        <span className="line-clamp-2 text-slate-600 dark:text-slate-400">
          {c.description || '—'}
        </span>
      ),
    },
    {
      key: 'createdAt',
      header: 'Створено',
      sortKey: 'createdAt',
      render: (c) => formatDateTime(c.createdAt),
    },
    {
      key: 'actions',
      header: 'Дії',
      className: 'text-right',
      render: renderActions,
    },
  ];

  return (
    <div>
      <Breadcrumbs />

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Категорії ресурсів
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Класифікація ресурсів для зручного пошуку та фільтрації
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <ViewModeToggle value={viewMode} onChange={setViewMode} />
          {isAdmin && (
            <Link to="/dashboard/categories/new">
              <Button size="sm">
                <Plus className="h-4 w-4" />
                Нова категорія
              </Button>
            </Link>
          )}
        </div>
      </div>

      <FilterBar
        search={search}
        onSearchChange={(val) => {
          setSearch(val);
          setPage(1);
        }}
        searchPlaceholder="Пошук категорій..."
        sortBy={sortBy}
        sortOrder={sortOrder}
        sortOptions={[
          { value: 'name', label: 'Назвою' },
          { value: 'createdAt', label: 'Датою створення' },
        ]}
        onSortByChange={setSortBy}
        onSortOrderToggle={() => setSortOrder((o) => (o === 'asc' ? 'desc' : 'asc'))}
        hasActiveFilters={Boolean(search)}
        onReset={() => {
          setSearch('');
          setSortBy('name');
          setSortOrder('asc');
          setPage(1);
        }}
      />

      {categoriesQuery.error && (
        <ErrorAlert
          message={extractApiErrorMessage(categoriesQuery.error)}
          onRetry={() => categoriesQuery.refetch()}
          className="mb-5"
        />
      )}

      {categoriesQuery.isLoading ? (
        viewMode === 'table' ? (
          <TableSkeleton rows={limit} cols={4} />
        ) : viewMode === 'list' ? (
          <ListSkeleton rows={limit} />
        ) : (
          <GridSkeleton count={limit} />
        )
      ) : viewMode === 'table' ? (
        <DataTable
          data={sortedCategories}
          columns={columns}
          keyExtractor={(c) => c.id}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSort={(key) => {
            if (sortBy === key) setSortOrder((o) => (o === 'asc' ? 'desc' : 'asc'));
            else {
              setSortBy(key);
              setSortOrder('asc');
            }
          }}
          onRowClick={(c) => navigate(`/dashboard/categories/${c.id}`)}
          emptyMessage="Категорій не знайдено."
        />
      ) : viewMode === 'list' ? (
        <DataList
          data={sortedCategories}
          keyExtractor={(c) => c.id}
          emptyMessage="Категорій не знайдено."
          renderItem={(c) => (
            <div className="flex items-center justify-between gap-4">
              <div>
                <Link
                  to={`/dashboard/categories/${c.id}`}
                  className="text-base font-semibold text-slate-900 hover:text-primary-600 dark:text-white"
                >
                  {c.name}
                </Link>
                {c.description && (
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    {c.description}
                  </p>
                )}
              </div>
              {renderActions(c)}
            </div>
          )}
        />
      ) : (
        <DataGrid
          data={sortedCategories}
          keyExtractor={(c) => c.id}
          emptyMessage="Категорій не знайдено."
          renderCard={(c) => (
            <Card
              title={c.name}
              subtitle={`ID #${c.id}`}
              className="h-full"
              footer={<div className="flex justify-end">{renderActions(c)}</div>}
            >
              <p className="line-clamp-3 text-sm text-slate-600 dark:text-slate-400">
                {c.description || 'Опис категорії відсутній.'}
              </p>
            </Card>
          )}
        />
      )}

      <Pagination
        pagination={categoriesQuery.data?.pagination}
        onPageChange={setPage}
        onLimitChange={(newLimit) => {
          setLimit(newLimit);
          setPage(1);
        }}
      />

      <ConfirmModal
        isOpen={Boolean(categoryToDelete)}
        title="Видалити категорію?"
        description={`Ви дійсно бажаєте видалити категорію «${categoryToDelete?.name ?? ''}»?`}
        isLoading={deleteMutation.isPending}
        onConfirm={handleConfirmDelete}
        onCancel={() => setCategoryToDelete(null)}
      />
    </div>
  );
}