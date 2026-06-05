'use client';

import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Calendar, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { useI18n } from '@/i18n';
import {
  formatDateDisplay,
  getTodayDateKey,
  parseDateKey,
} from '@/lib/date-format';
import {
  buildCalendarMonth,
  formatMonthYearLabel,
  isDateKeyInRange,
  monthKeyFromDateKey,
  shiftMonthKey,
} from '@/lib/date-picker-calendar.util';

export type DatePickerVariant = 'default' | 'light' | 'amber' | 'compact';

export type DatePickerProps = {
  value: string;
  onChange: (dateKey: string) => void;
  min?: string;
  max?: string;
  disabled?: boolean;
  required?: boolean;
  id?: string;
  name?: string;
  className?: string;
  placeholder?: string;
  variant?: DatePickerVariant;
  accentColor?: string;
  clearable?: boolean;
  'aria-label'?: string;
};

const WEEKDAY_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;

const DASHBOARD_ICON = 'text-gray-500 dark:text-white';

function variantStyles(variant: DatePickerVariant) {
  switch (variant) {
    case 'light':
      return {
        trigger:
          'bg-white border-gray-200 text-gray-900 hover:border-gray-300 focus:ring-[var(--tenant-primary,#2563eb)]/30',
        icon: 'text-gray-400',
        chevron: 'text-gray-400',
        popover: 'bg-white border-gray-200 text-gray-900 shadow-xl',
        muted: 'text-gray-400',
        day: 'text-gray-700 hover:bg-gray-100',
        dayOutside: 'text-gray-300',
        dayDisabled: 'text-gray-200',
        footer: 'border-gray-100',
        todayBtn: 'text-gray-600 hover:bg-gray-100',
      };
    case 'amber':
      return {
        trigger:
          'bg-amber-950/40 border-amber-700/50 text-amber-50 hover:border-amber-600/60 focus:ring-amber-500/30',
        icon: 'text-amber-200',
        chevron: 'text-amber-300/70',
        popover: 'bg-amber-950 border-amber-700/60 text-amber-50 shadow-xl',
        muted: 'text-amber-400/70',
        day: 'text-amber-50 hover:bg-amber-900/60',
        dayOutside: 'text-amber-600/50',
        dayDisabled: 'text-amber-800/40',
        footer: 'border-amber-800/50',
        todayBtn: 'text-amber-200 hover:bg-amber-900/50',
      };
    case 'compact':
      return {
        trigger:
          'bg-white border-gray-300 text-gray-900 hover:border-gray-400 text-sm py-1.5 px-2.5 min-h-0 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100 dark:hover:border-gray-600',
        icon: DASHBOARD_ICON,
        chevron: 'text-gray-400 opacity-70 dark:text-white/60',
        popover: 'bg-white border-gray-200 text-gray-900 shadow-xl dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100',
        muted: 'text-gray-500 dark:text-gray-500',
        day: 'text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800',
        dayOutside: 'text-gray-300 dark:text-gray-600',
        dayDisabled: 'text-gray-200 dark:text-gray-700',
        footer: 'border-gray-100 dark:border-gray-800',
        todayBtn: 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800',
      };
    default:
      return {
        trigger:
          'bg-white border-gray-300 text-gray-900 hover:border-gray-400 focus:ring-blue-500/30 dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100 dark:hover:border-gray-600',
        icon: DASHBOARD_ICON,
        chevron: 'text-gray-400 opacity-70 dark:text-white/60',
        popover: 'bg-white border-gray-200 text-gray-900 shadow-xl dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100',
        muted: 'text-gray-500',
        day: 'text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800',
        dayOutside: 'text-gray-300 dark:text-gray-600',
        dayDisabled: 'text-gray-200 dark:text-gray-700',
        footer: 'border-gray-100 dark:border-gray-800',
        todayBtn: 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800',
      };
  }
}

export function DatePicker({
  value,
  onChange,
  min,
  max,
  disabled = false,
  required = false,
  id: idProp,
  name,
  className = '',
  placeholder,
  variant = 'default',
  accentColor,
  clearable = false,
  'aria-label': ariaLabel,
}: DatePickerProps) {
  const { t, locale } = useI18n();
  const autoId = useId();
  const id = idProp ?? autoId;
  const styles = variantStyles(variant);
  const todayKey = getTodayDateKey();
  const accent = accentColor ?? 'var(--tenant-primary, #2563eb)';

  const [open, setOpen] = useState(false);
  const [viewMonthKey, setViewMonthKey] = useState(() =>
    value ? monthKeyFromDateKey(value) : monthKeyFromDateKey(todayKey),
  );
  const [popoverPos, setPopoverPos] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

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

  const displayValue = value
    ? formatDateDisplay(value, locale)
    : placeholder ?? t('datePicker.selectDate');

  const updatePopoverPosition = useCallback(() => {
    const el = triggerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const width = 296;
    const height = 360;
    let top = rect.bottom + 8;
    let left = rect.left;
    if (top + height > window.innerHeight - 12) {
      top = Math.max(12, rect.top - height - 8);
    }
    if (left + width > window.innerWidth - 12) {
      left = Math.max(12, window.innerWidth - width - 12);
    }
    setPopoverPos({ top, left });
  }, []);

  useEffect(() => {
    if (!open) return;
    updatePopoverPosition();
    const onResize = () => updatePopoverPosition();
    window.addEventListener('resize', onResize);
    window.addEventListener('scroll', onResize, true);
    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('scroll', onResize, true);
    };
  }, [open, updatePopoverPosition]);

  useEffect(() => {
    if (open) {
      queueMicrotask(() => setViewMonthKey(value ? monthKeyFromDateKey(value) : monthKeyFromDateKey(todayKey)));
    }
  }, [open, value, todayKey]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (triggerRef.current?.contains(target) || popoverRef.current?.contains(target)) return;
      setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const selectDay = (dateKey: string) => {
    if (!isDateKeyInRange(dateKey, min, max)) return;
    onChange(dateKey);
    setOpen(false);
  };

  const popover =
    open && typeof document !== 'undefined'
      ? createPortal(
          <div
            ref={popoverRef}
            role="dialog"
            aria-modal="true"
            aria-label={ariaLabel ?? t('datePicker.selectDate')}
            className={`fixed z-[250] w-[296px] rounded-2xl border p-3 ${styles.popover}`}
            style={{ top: popoverPos.top, left: popoverPos.left }}
          >
            <div className="flex items-center justify-between gap-2 mb-3">
              <button
                type="button"
                className={`p-1.5 rounded-lg transition-colors ${styles.todayBtn}`}
                aria-label={t('datePicker.prevMonth')}
                onClick={() => setViewMonthKey((m) => shiftMonthKey(m, -1))}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <p className="text-sm font-semibold flex-1 text-center">{monthLabel}</p>
              <button
                type="button"
                className={`p-1.5 rounded-lg transition-colors ${styles.todayBtn}`}
                aria-label={t('datePicker.nextMonth')}
                onClick={() => setViewMonthKey((m) => shiftMonthKey(m, 1))}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-7 gap-0.5 mb-1">
              {weekdayLabels.map((label) => (
                <span
                  key={label}
                  className={`text-center text-[10px] font-semibold uppercase tracking-wide py-1 ${styles.muted}`}
                >
                  {label}
                </span>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-0.5">
              {monthCells.map((cell) => {
                const dayNum = parseDateKey(cell.dateKey)?.getUTCDate() ?? '';
                const selected = value === cell.dateKey;
                const isToday = cell.dateKey === todayKey;
                const allowed = isDateKeyInRange(cell.dateKey, min, max);
                const dayClass = !cell.inMonth
                  ? styles.dayOutside
                  : allowed
                    ? styles.day
                    : styles.dayDisabled;

                return (
                  <button
                    key={cell.dateKey}
                    type="button"
                    disabled={!allowed}
                    onClick={() => selectDay(cell.dateKey)}
                    className={`relative h-9 w-full rounded-full text-sm font-medium transition-colors disabled:cursor-not-allowed ${dayClass} ${
                      selected ? 'text-white shadow-sm' : ''
                    }`}
                    style={
                      selected
                        ? { backgroundColor: variant === 'amber' ? '#d97706' : accent }
                        : isToday && !selected
                          ? { boxShadow: `inset 0 0 0 2px ${variant === 'amber' ? '#f59e0b' : accent}` }
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

            <div className={`flex items-center justify-between gap-2 mt-3 pt-3 border-t ${styles.footer}`}>
              <button
                type="button"
                className={`text-xs font-medium px-2.5 py-1.5 rounded-lg transition-colors ${styles.todayBtn}`}
                onClick={() => {
                  if (isDateKeyInRange(todayKey, min, max)) {
                    onChange(todayKey);
                    setOpen(false);
                  }
                }}
                disabled={!isDateKeyInRange(todayKey, min, max)}
              >
                {t('datePicker.today')}
              </button>
              {clearable && (
                <button
                  type="button"
                  className={`text-xs font-medium px-2.5 py-1.5 rounded-lg transition-colors ${styles.todayBtn}`}
                  onClick={() => {
                    onChange('');
                    setOpen(false);
                  }}
                >
                  {t('datePicker.clear')}
                </button>
              )}
            </div>
          </div>,
          document.body,
        )
      : null;

  return (
    <>
      {name ? <input type="hidden" name={name} value={value} /> : null}
      <button
        ref={triggerRef}
        id={id}
        type="button"
        disabled={disabled}
        aria-required={required}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={ariaLabel ?? displayValue}
        onClick={() => {
          if (disabled) return;
          setOpen((v) => !v);
        }}
        className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed ${styles.trigger} ${className}`}
      >
        <Calendar className={`w-4 h-4 shrink-0 ${styles.icon}`} />
        <span className={value ? '' : 'opacity-60'}>{displayValue}</span>
        <ChevronDown
          className={`w-4 h-4 shrink-0 transition-transform ${styles.chevron} ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {popover}
    </>
  );
}
