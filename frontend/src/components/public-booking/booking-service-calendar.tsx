'use client';

import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { useI18n } from '@/i18n';
import { formatDateDisplay, getTodayDateKey, parseDateKey } from '@/lib/date-format';
import {
  buildCalendarMonth,
  formatMonthYearLabel,
  isDateKeyInRange,
  monthKeyFromDateKey,
  shiftMonthKey,
} from '@/lib/date-picker-calendar.util';
import { monthBoundsFromMonthKey } from '@/lib/service-bookable-dates.util';

const WEEKDAY_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;

export interface BookingServiceCalendarProps {
  selectedDateKey: string;
  onSelectDateKey: (dateKey: string) => void;
  primaryColor: string;
  minDateKey: string;
  timeZone?: string;
  isDateEnabled: (dateKey: string) => boolean;
  scanning: boolean;
  scanDates: (fromKey: string, toKey: string) => Promise<void>;
}

export function BookingServiceCalendar({
  selectedDateKey,
  onSelectDateKey,
  primaryColor,
  minDateKey,
  timeZone,
  isDateEnabled,
  scanning,
  scanDates,
}: BookingServiceCalendarProps) {
  const { t, locale } = useI18n();
  const todayKey = getTodayDateKey(timeZone);
  const [viewMonthKey, setViewMonthKey] = useState(() =>
    monthKeyFromDateKey(selectedDateKey || minDateKey),
  );

  useEffect(() => {
    queueMicrotask(() => {
      setViewMonthKey(monthKeyFromDateKey(selectedDateKey || minDateKey));
    });
  }, [minDateKey, selectedDateKey]);

  useEffect(() => {
    const { from, to } = monthBoundsFromMonthKey(viewMonthKey);
    void scanDates(from, to);
  }, [scanDates, viewMonthKey]);

  const weekdayLabels = useMemo(
    () =>
      WEEKDAY_KEYS.map((key) => {
        const label = t(`datePicker.weekdays.${key}`);
        return label.startsWith('datePicker.') ? key.slice(0, 2).toUpperCase() : label;
      }),
    [t],
  );

  const monthCells = useMemo(() => buildCalendarMonth(viewMonthKey), [viewMonthKey]);
  const monthLabel = formatMonthYearLabel(viewMonthKey, locale);

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-2">
        <p className="text-sm font-medium text-gray-900">{t('datePicker.selectDate')}</p>
        {scanning ? (
          <Loader2 className="h-4 w-4 animate-spin text-gray-400" aria-hidden />
        ) : null}
      </div>

      <div className="mb-3 flex items-center justify-between gap-2">
        <button
          type="button"
          className="rounded-lg p-1.5 text-gray-600 transition-colors hover:bg-gray-100"
          aria-label={t('datePicker.prevMonth')}
          onClick={() => setViewMonthKey((month) => shiftMonthKey(month, -1))}
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <p className="flex-1 text-center text-sm font-semibold text-gray-900">{monthLabel}</p>
        <button
          type="button"
          className="rounded-lg p-1.5 text-gray-600 transition-colors hover:bg-gray-100"
          aria-label={t('datePicker.nextMonth')}
          onClick={() => setViewMonthKey((month) => shiftMonthKey(month, 1))}
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <div className="mb-1 grid grid-cols-7 gap-0.5">
        {weekdayLabels.map((label) => (
          <span
            key={label}
            className="py-1 text-center text-[10px] font-semibold uppercase tracking-wide text-gray-400"
          >
            {label}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-0.5">
        {monthCells.map((cell) => {
          const dayNum = parseDateKey(cell.dateKey)?.getUTCDate() ?? '';
          const selected = selectedDateKey === cell.dateKey;
          const isToday = cell.dateKey === todayKey;
          const inMinRange = isDateKeyInRange(cell.dateKey, minDateKey);
          const bookable = inMinRange && isDateEnabled(cell.dateKey);
          const disabled = !cell.inMonth || !inMinRange || !bookable;

          return (
            <button
              key={cell.dateKey}
              type="button"
              disabled={disabled}
              onClick={() => {
                if (disabled) return;
                onSelectDateKey(cell.dateKey);
              }}
              className={`relative h-9 w-full rounded-full text-sm font-medium transition-colors disabled:cursor-not-allowed ${
                !cell.inMonth
                  ? 'text-gray-200'
                  : disabled
                    ? 'text-gray-300'
                    : 'text-gray-700 hover:bg-gray-100'
              } ${selected ? 'text-white shadow-sm' : ''}`}
              style={
                selected
                  ? { backgroundColor: primaryColor }
                  : isToday && !selected && bookable
                    ? { boxShadow: `inset 0 0 0 2px ${primaryColor}` }
                    : undefined
              }
              aria-pressed={selected}
              aria-label={formatDateDisplay(cell.dateKey, locale)}
            >
              {dayNum}
            </button>
          );
        })}
      </div>
    </div>
  );
}
