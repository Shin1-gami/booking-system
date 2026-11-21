import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Clock, Eye, Pencil, Plus, Trash2 } from 'lucide-react';
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
import { useBookingsQuery, useDeleteBookingMutation } from '@/hooks/queries/useBookings';
import { useDebounce } from '@/hooks/useDebounce';
import { extractApiErrorMessage } from '@/services/api';
import type { Booking, SortOrder } from '@/types';
import { BOOKING_STATUS_META, formatCurrency, formatDateTime } from '@/utils/format';

export default function BookingsListPage() {
  const navigate = useNavigate();

  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(9);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [sortBy, setSortBy] = useState('startTime');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [bookingToDelete, setBookingToDelete] = useState<Booking | null>(null);

  const debouncedSearch = useDebounce(search, 350);

  const bookingsQuery = useBookingsQuery({
    page,
    limit,
    ...(debouncedSearch.trim() && { search: debouncedSearch.trim() }),
    ...(status && { status }),
    sortBy,
    sortOrder,
  });

  const deleteMutation = useDeleteBookingMutation();

  const sortedBookings = useMemo(() => {
    const list = [...(bookingsQuery.data?.data ?? [])];
    list.sort((a, b) => {
      let cmp: number;
if (sortBy === 'status') {
  cmp = a.status.localeCompare(b.status);
} else if (sortBy === 'createdAt') {
  cmp = new Date(a.createdAt ?? 0).getTime() - new Date(b.createdAt ?? 0).getTime();
} else {
  cmp = new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
}
return sortOrder === 'asc' ? cmp : -cmp;
    });
    return list;
  }, [bookingsQuery.data?.data, sortBy, sortOrder]);

  const handleHeaderSort = (key: string) => {
    if (sortBy === key) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(key);
      setSortOrder('asc');
    }
  };

  const handleConfirmDelete = async () => {
    if (!bookingToDelete) return;
    await deleteMutation.mutateAsync(bookingToDelete.id);
    setBookingToDelete(null);
  };

  const renderActions = (booking: Booking) => (
    <div
      className="flex items-center justify-end gap-1.5"
      onClick={(e) => e.stopPropagation()}
    >
      <Link
        to={`/dashboard/bookings/${booking.id}`}
        title="Детальніше"
        className="rounded-lg p-1.5 text-slate-600 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
      >
        <Eye className="h-4 w-4" />
      </Link>
      <Link
        to={`/dashboard/bookings/${booking.id}/edit`}
        title="Редагувати"
        className="rounded-lg p-1.5 text-primary-600 transition hover:bg-primary-50 dark:text-primary-400 dark:hover:bg-primary-950/50"
      >
        <Pencil className="h-4 w-4" />
      </Link>
      <button
        type="button"
        onClick={() => setBookingToDelete(booking)}
        title="Видалити"
        className="rounded-lg p-1.5 text-red-600 transition hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/50"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );

  const columns: TableColumn<Booking>[] = [
    {
      key: 'resource',
      header: 'Ресурс',
      render: (b) => (
        <div>
          <p className="font-semibold text-slate-900 dark:text-white">
            {b.resource?.name ?? `Ресурс #${b.resourceId}`}
          </p>
          {b.user && <p className="text-xs text-slate-500">Користувач: {b.user.name}</p>}
        </div>
      ),
    },
    {
      key: 'startTime',
      header: 'Початок',
      sortKey: 'startTime',
      render: (b) => formatDateTime(b.startTime),
    },
    {
      key: 'endTime',
      header: 'Завершення',
      render: (b) => formatDateTime(b.endTime),
    },
    {
      key: 'status',
      header: 'Статус',
      sortKey: 'status',
      render: (b) => {
        const meta = BOOKING_STATUS_META[b.status];
        return <Badge variant={meta.variant}>{meta.label}</Badge>;
      },
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
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Бронювання</h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Перегляд, створення та керування часовими слотами бронювання
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <ViewModeToggle value={viewMode} onChange={setViewMode} />
          <Link to="/dashboard/bookings/new">
            <Button size="sm">
              <Plus className="h-4 w-4" />
              Створити бронювання
            </Button>
          </Link>
        </div>
      </div>

      <FilterBar
        search={search}
        onSearchChange={(val) => {
          setSearch(val);
          setPage(1);
        }}
        searchPlaceholder="Пошук за ресурсом або приміткою..."
        sortBy={sortBy}
        sortOrder={sortOrder}
        sortOptions={[
          { value: 'startTime', label: 'Датою початку' },
          { value: 'createdAt', label: 'Датою створення' },
          { value: 'status', label: 'Статусом' },
        ]}
        onSortByChange={setSortBy}
        onSortOrderToggle={() => setSortOrder((o) => (o === 'asc' ? 'desc' : 'asc'))}
        hasActiveFilters={Boolean(search || status)}
        onReset={() => {
          setSearch('');
          setStatus('');
          setSortBy('startTime');
          setSortOrder('desc');
          setPage(1);
        }}
        extraFilters={
          <select
            aria-label="Фільтр за статусом бронювання"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-primary-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            <option value="">Усі статуси</option>
            <option value="PENDING">Очікує підтвердження</option>
            <option value="CONFIRMED">Підтверджено</option>
            <option value="COMPLETED">Завершено</option>
            <option value="CANCELLED">Скасовано</option>
          </select>
        }
      />

      {bookingsQuery.error && (
        <ErrorAlert
          message={extractApiErrorMessage(bookingsQuery.error)}
          onRetry={() => bookingsQuery.refetch()}
          className="mb-5"
        />
      )}

      {bookingsQuery.isLoading ? (
        viewMode === 'table' ? (
          <TableSkeleton rows={limit} cols={5} />
        ) : viewMode === 'list' ? (
          <ListSkeleton rows={limit} />
        ) : (
          <GridSkeleton count={limit} />
        )
      ) : viewMode === 'table' ? (
        <DataTable
          data={sortedBookings}
          columns={columns}
          keyExtractor={(b) => b.id}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSort={handleHeaderSort}
          onRowClick={(b) => navigate(`/dashboard/bookings/${b.id}`)}
          emptyMessage="Бронювань не знайдено."
        />
      ) : viewMode === 'list' ? (
        <DataList
          data={sortedBookings}
          keyExtractor={(b) => b.id}
          emptyMessage="Бронювань не знайдено."
          renderItem={(b) => {
            const meta = BOOKING_STATUS_META[b.status];
            return (
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      to={`/dashboard/bookings/${b.id}`}
                      className="text-base font-semibold text-slate-900 hover:text-primary-600 dark:text-white"
                    >
                      {b.resource?.name ?? `Ресурс #${b.resourceId}`}
                    </Link>
                    <Badge variant={meta.variant}>{meta.label}</Badge>
                  </div>
                  <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                    <Clock className="h-3.5 w-3.5" />
                    <span>
                      {formatDateTime(b.startTime)} — {formatDateTime(b.endTime)}
                    </span>
                  </p>
                </div>
                {renderActions(b)}
              </div>
            );
          }}
        />
      ) : (
        <DataGrid
          data={sortedBookings}
          keyExtractor={(b) => b.id}
          emptyMessage="Бронювань не знайдено."
          renderCard={(b) => {
            const meta = BOOKING_STATUS_META[b.status];
            return (
              <Card
                title={b.resource?.name ?? `Ресурс #${b.resourceId}`}
                subtitle={`Бронювання #${b.id}`}
                headerAction={<Badge variant={meta.variant}>{meta.label}</Badge>}
                className="h-full"
                footer={
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                      {b.totalPrice ? formatCurrency(b.totalPrice) : ''}
                    </span>
                    {renderActions(b)}
                  </div>
                }
              >
                <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
                  <p>
                    <strong>Початок:</strong> {formatDateTime(b.startTime)}
                  </p>
                  <p>
                    <strong>Завершення:</strong> {formatDateTime(b.endTime)}
                  </p>
                  {b.notes && <p className="mt-2 line-clamp-2 italic">«{b.notes}»</p>}
                </div>
              </Card>
            );
          }}
        />
      )}

      <Pagination
        pagination={bookingsQuery.data?.pagination}
        onPageChange={setPage}
        onLimitChange={(newLimit) => {
          setLimit(newLimit);
          setPage(1);
        }}
      />

      <ConfirmModal
        isOpen={Boolean(bookingToDelete)}
        title="Видалити бронювання?"
        description={`Ви дійсно бажаєте видалити бронювання #${bookingToDelete?.id ?? ''}?`}
        isLoading={deleteMutation.isPending}
        onConfirm={handleConfirmDelete}
        onCancel={() => setBookingToDelete(null)}
      />
    </div>
  );
}