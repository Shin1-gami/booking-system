import type { BookingStatus, ResourceStatus } from '@/types';

export function formatCurrency(value: number | string | null | undefined): string {
  const num = Number(value ?? 0);
  if (Number.isNaN(num)) return '0.00 ₴';
  return `${num.toFixed(2)} ₴`;
}

export function formatDateTime(isoString: string | null | undefined): string {
  if (!isoString) return '—';
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('uk-UA', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function toDateTimeLocalValue(isoString: string | null | undefined): string {
  if (!isoString) return '';
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours()
  )}:${pad(date.getMinutes())}`;
}

export const RESOURCE_STATUS_META: Record<
  ResourceStatus,
  { label: string; variant: 'success' | 'warning' | 'danger' }
> = {
  AVAILABLE: { label: 'Доступний', variant: 'success' },
  MAINTENANCE: { label: 'Обслуговування', variant: 'warning' },
  UNAVAILABLE: { label: 'Недоступний', variant: 'danger' },
};

export const BOOKING_STATUS_META: Record<
  BookingStatus,
  { label: string; variant: 'warning' | 'success' | 'danger' | 'info' }
> = {
  PENDING: { label: 'Очікує підтвердження', variant: 'warning' },
  CONFIRMED: { label: 'Підтверджено', variant: 'success' },
  CANCELLED: { label: 'Скасовано', variant: 'danger' },
  COMPLETED: { label: 'Завершено', variant: 'info' },
};