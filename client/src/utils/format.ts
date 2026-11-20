import type { BookingStatus } from '@/types';

export function formatDate(iso: string, locale = 'uk-UA'): string {
  return new Intl.DateTimeFormat(locale, { dateStyle: 'long' }).format(new Date(iso));
}

export function formatDateTime(iso: string, locale = 'uk-UA'): string {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(iso));
}

export function formatPrice(value: number, currency = 'UAH', locale = 'uk-UA'): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

export function getBookingStatusMeta(status: BookingStatus): {
  label: string;
  variant: 'warning' | 'success' | 'danger' | 'neutral';
} {
  const map: Record<BookingStatus, { label: string; variant: 'warning' | 'success' | 'danger' | 'neutral' }> = {
    PENDING: { label: 'Очікує підтвердження', variant: 'warning' },
    CONFIRMED: { label: 'Підтверджено', variant: 'success' },
    CANCELLED: { label: 'Скасовано', variant: 'danger' },
    COMPLETED: { label: 'Завершено', variant: 'neutral' },
  };
  return map[status];
}