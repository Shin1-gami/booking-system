import { useMemo, useState } from 'react';
import { DayPicker } from 'react-day-picker';
import { uk } from 'date-fns/locale';
import { CalendarDays } from 'lucide-react';
import { Link } from 'react-router-dom';
import 'react-day-picker/style.css';
import Badge from '@/components/common/Badge';
import Button from '@/components/common/Button';
import type { Booking } from '@/types';
import { BOOKING_STATUS_META, formatDateTime } from '@/utils/format';

interface BookingCalendarProps {
  bookings?: Booking[];
  selectedDate?: Date;
  onSelectDate?: (date: Date | undefined) => void;
}

export default function BookingCalendar({
  bookings = [],
  selectedDate: controlledDate,
  onSelectDate,
}: BookingCalendarProps) {
  const [internalDate, setInternalDate] = useState<Date | undefined>(new Date());
  const activeDate = controlledDate ?? internalDate;

  const handleSelect = (day: Date | undefined) => {
    setInternalDate(day);
    onSelectDate?.(day);
  };

  const bookedDays = useMemo(
    () => bookings.map((b) => new Date(b.startTime)),
    [bookings]
  );

  const selectedDayBookings = useMemo(() => {
    if (!activeDate) return [];
    return bookings.filter((b) => {
      const d = new Date(b.startTime);
      return (
        d.getFullYear() === activeDate.getFullYear() &&
        d.getMonth() === activeDate.getMonth() &&
        d.getDate() === activeDate.getDate()
      );
    });
  }, [bookings, activeDate]);

  return (
    <div className="grid gap-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 lg:grid-cols-2">
      <div className="flex flex-col items-center justify-center">
        <DayPicker
          mode="single"
          selected={activeDate}
          onSelect={handleSelect}
          locale={uk}
          modifiers={{ booked: bookedDays }}
          modifiersStyles={{
            booked: {
              fontWeight: 700,
              textDecoration: 'underline',
              color: '#2563eb',
            },
          }}
          className="rounded-xl border border-slate-100 p-3 dark:border-slate-800"
        />
      </div>

      <div className="flex flex-col justify-between border-t border-slate-100 pt-4 dark:border-slate-800 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-6">
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h4 className="flex items-center gap-2 text-base font-bold text-slate-900 dark:text-white">
              <CalendarDays className="h-4 w-4 text-primary-600" />
              <span>
                {activeDate
                  ? `Бронювання на ${activeDate.toLocaleDateString('uk-UA')}`
                  : 'Оберіть дату в календарі'}
              </span>
            </h4>
            <Badge variant="info">{selectedDayBookings.length}</Badge>
          </div>

          {selectedDayBookings.length === 0 ? (
            <p className="py-6 text-sm text-slate-500 dark:text-slate-400">
              На обрану дату запланованих бронювань немає. Усі часові слоти вільні!
            </p>
          ) : (
            <ul className="space-y-2.5">
              {selectedDayBookings.map((b) => {
                const meta = BOOKING_STATUS_META[b.status];
                return (
                  <li
                    key={b.id}
                    className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 p-3 text-xs dark:bg-slate-800/60"
                  >
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white">
                        {b.resource?.name ?? `Ресурс #${b.resourceId}`}
                      </p>
                      <p className="mt-0.5 text-slate-500">
                        {formatDateTime(b.startTime)} — {formatDateTime(b.endTime)}
                      </p>
                    </div>
                    <Badge variant={meta.variant}>{meta.label}</Badge>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
          <Link to="/dashboard/bookings/new">
            <Button size="sm" className="w-full">
              Забронювати ресурс на обрану дату
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}