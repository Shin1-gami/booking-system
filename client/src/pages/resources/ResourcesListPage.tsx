import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CalendarPlus, Eye, MapPin, Pencil, Plus, Trash2, Users } from 'lucide-react';
import Badge from '@/components/common/Badge';
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
import { useFlatCategoriesQuery } from '@/hooks/queries/useCategories';
import { useDeleteResourceMutation, useResourcesQuery } from '@/hooks/queries/useResources';
import { useDebounce } from '@/hooks/useDebounce';
import { extractApiErrorMessage } from '@/services/api';
import { useAuthStore } from '@/stores/authStore';
import type { Resource, ResourceStatus, SortOrder } from '@/types';
import { formatCurrency, RESOURCE_STATUS_META } from '@/utils/format';

export default function ResourcesListPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === 'ADMIN';

  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(9);
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [status, setStatus] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [resourceToDelete, setResourceToDelete] = useState<Resource | null>(null);

  const debouncedSearch = useDebounce(search, 350);

  const categoriesQuery = useFlatCategoriesQuery();
  const resourcesQuery = useResourcesQuery({
    page,
    limit,
    ...(debouncedSearch.trim() && { search: debouncedSearch.trim() }),
    ...(categoryId && { categoryId }),
    ...(status && { status }),
    sortBy,
    sortOrder,
  });

  const deleteMutation = useDeleteResourceMutation();

  const sortedItems = useMemo(() => {
    const items = [...(resourcesQuery.data?.data ?? [])];
    items.sort((a, b) => {
     let comparison: number;
if (sortBy === 'name') {
  comparison = a.name.localeCompare(b.name, 'uk');
} else if (sortBy === 'price') {
  comparison = Number(a.price) - Number(b.price);
} else {
  comparison =
    new Date(a.createdAt ?? 0).getTime() - new Date(b.createdAt ?? 0).getTime();
}
return sortOrder === 'asc' ? comparison : -comparison;
    });
    return items;
  }, [resourcesQuery.data?.data, sortBy, sortOrder]);

  const handleHeaderSort = (key: string) => {
    if (sortBy === key) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(key);
      setSortOrder('asc');
    }
  };

  const handleResetFilters = () => {
    setSearch('');
    setCategoryId('');
    setStatus('');
    setSortBy('createdAt');
    setSortOrder('desc');
    setPage(1);
  };

  const handleConfirmDelete = async () => {
    if (!resourceToDelete) return;
    await deleteMutation.mutateAsync(resourceToDelete.id);
    setResourceToDelete(null);
  };

  const renderStatusBadge = (resourceStatus?: ResourceStatus) => {
    const meta = RESOURCE_STATUS_META[resourceStatus ?? 'AVAILABLE'];
    return <Badge variant={meta.variant}>{meta.label}</Badge>;
  };

  const renderActions = (resource: Resource) => (
    <div
      className="flex items-center justify-end gap-1.5"
      onClick={(e) => e.stopPropagation()}
    >
      <Link
        to={`/dashboard/bookings/new?resourceId=${resource.id}`}
        title="Забронювати"
        className="rounded-lg p-1.5 text-emerald-600 transition hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/50"
      >
        <CalendarPlus className="h-4 w-4" />
      </Link>
      <Link
        to={`/dashboard/resources/${resource.id}`}
        title="Детальніше"
        className="rounded-lg p-1.5 text-slate-600 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
      >
        <Eye className="h-4 w-4" />
      </Link>
      {isAdmin && (
        <>
          <Link
            to={`/dashboard/resources/${resource.id}/edit`}
            title="Редагувати"
            className="rounded-lg p-1.5 text-primary-600 transition hover:bg-primary-50 dark:text-primary-400 dark:hover:bg-primary-950/50"
          >
            <Pencil className="h-4 w-4" />
          </Link>
          <button
            type="button"
            onClick={() => setResourceToDelete(resource)}
            title="Видалити"
            className="rounded-lg p-1.5 text-red-600 transition hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/50"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </>
      )}
    </div>
  );

  const columns: TableColumn<Resource>[] = [
    {
      key: 'name',
      header: 'Назва',
      sortKey: 'name',
      render: (r) => (
        <div>
          <p className="font-semibold text-slate-900 dark:text-white">{r.name}</p>
          {r.location && (
            <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-500">
              <MapPin className="h-3 w-3" />
              {r.location}
            </p>
          )}
        </div>
      ),
    },
    {
      key: 'category',
      header: 'Категорія',
      render: (r) => (
        <Badge variant="info">{r.category?.name ?? 'Загальна категорія'}</Badge>
      ),
    },
    {
      key: 'price',
      header: 'Вартість',
      sortKey: 'price',
      render: (r) => (
        <span className="font-bold text-slate-900 dark:text-white">
          {formatCurrency(r.price)}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Статус',
      render: (r) => renderStatusBadge(r.status),
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
            Ресурси системи
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Керування приміщеннями, обладнанням та доступними локаціями
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <ViewModeToggle value={viewMode} onChange={setViewMode} />
          {isAdmin && (
            <Link to="/dashboard/resources/new">
              <Button size="sm">
                <Plus className="h-4 w-4" />
                Додати ресурс
              </Button>
            </Link>
          )}
        </div>
      </div>

      <FilterBar
        search={search}
        onSearchChange={(v) => {
          setSearch(v);
          setPage(1);
        }}
        searchPlaceholder="Пошук за назвою або локацією..."
        sortBy={sortBy}
        sortOrder={sortOrder}
        sortOptions={[
          { value: 'createdAt', label: 'Датою додавання' },
          { value: 'name', label: 'Назвою' },
          { value: 'price', label: 'Ціною' },
        ]}
        onSortByChange={setSortBy}
        onSortOrderToggle={() => setSortOrder((o) => (o === 'asc' ? 'desc' : 'asc'))}
        hasActiveFilters={Boolean(search || categoryId || status)}
        onReset={handleResetFilters}
        extraFilters={
          <div className="flex flex-wrap gap-2">
            <select
              aria-label="Фільтр за категорією"
              value={categoryId}
              onChange={(e) => {
                setCategoryId(e.target.value);
                setPage(1);
              }}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-primary-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
              <option value="">Усі категорії</option>
              {categoriesQuery.data?.map((cat) => (
                <option key={cat.id} value={String(cat.id)}>
                  {cat.name}
                </option>
              ))}
            </select>

            <select
              aria-label="Фільтр за статусом"
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-primary-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
              <option value="">Усі статуси</option>
              <option value="AVAILABLE">Доступний</option>
              <option value="MAINTENANCE">Обслуговування</option>
              <option value="UNAVAILABLE">Недоступний</option>
            </select>
          </div>
        }
      />

      {resourcesQuery.error && (
        <ErrorAlert
          message={extractApiErrorMessage(resourcesQuery.error)}
          onRetry={() => resourcesQuery.refetch()}
          className="mb-5"
        />
      )}

      {resourcesQuery.isLoading ? (
        viewMode === 'table' ? (
          <TableSkeleton rows={limit} cols={5} />
        ) : viewMode === 'list' ? (
          <ListSkeleton rows={limit} />
        ) : (
          <GridSkeleton count={limit} />
        )
      ) : viewMode === 'table' ? (
        <DataTable
          data={sortedItems}
          columns={columns}
          keyExtractor={(r) => r.id}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSort={handleHeaderSort}
          onRowClick={(r) => navigate(`/dashboard/resources/${r.id}`)}
          emptyMessage="За вказаними критеріями ресурсів не знайдено."
        />
      ) : viewMode === 'list' ? (
        <DataList
          data={sortedItems}
          keyExtractor={(r) => r.id}
          emptyMessage="За вказаними критеріями ресурсів не знайдено."
          renderItem={(r) => (
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    to={`/dashboard/resources/${r.id}`}
                    className="text-base font-semibold text-slate-900 hover:text-primary-600 dark:text-white dark:hover:text-primary-400"
                  >
                    {r.name}
                  </Link>
                  <Badge variant="info">{r.category?.name ?? 'Загальна'}</Badge>
                  {renderStatusBadge(r.status)}
                </div>
                <div className="mt-1.5 flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                  {r.location && (
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" />
                      {r.location}
                    </span>
                  )}
                  {r.capacity && (
                    <span className="inline-flex items-center gap-1">
                      <Users className="h-3.5 w-3.5" />
                      До {r.capacity} осіб
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between gap-4 sm:justify-end">
                <span className="text-base font-bold text-slate-900 dark:text-white">
                  {formatCurrency(r.price)}
                </span>
                {renderActions(r)}
              </div>
            </div>
          )}
        />
      ) : (
        <DataGrid
          data={sortedItems}
          keyExtractor={(r) => r.id}
          emptyMessage="За вказаними критеріями ресурсів не знайдено."
          renderCard={(r) => (
            <Card
              title={r.name}
              subtitle={r.location ?? undefined}
              headerAction={renderStatusBadge(r.status)}
              className="h-full"
              footer={
                <div className="flex items-center justify-between">
                  <span className="text-base font-bold text-primary-600 dark:text-primary-400">
                    {formatCurrency(r.price)}
                  </span>
                  {renderActions(r)}
                </div>
              }
            >
              <div className="mb-3">
                <Badge variant="info">{r.category?.name ?? 'Загальна категорія'}</Badge>
              </div>
              <p className="line-clamp-3 text-sm text-slate-600 dark:text-slate-400">
                {r.description || 'Опис ресурсу не додано.'}
              </p>
            </Card>
          )}
        />
      )}

      <Pagination
        pagination={resourcesQuery.data?.pagination}
        onPageChange={setPage}
        onLimitChange={(newLimit) => {
          setLimit(newLimit);
          setPage(1);
        }}
      />

      <ConfirmModal
        isOpen={Boolean(resourceToDelete)}
        title="Видалити ресурс?"
        description={`Ви дійсно бажаєте видалити ресурс «${resourceToDelete?.name ?? ''}»? Цю дію неможливо скасувати.`}
        isLoading={deleteMutation.isPending}
        onConfirm={handleConfirmDelete}
        onCancel={() => setResourceToDelete(null)}
      />
    </div>
  );
}