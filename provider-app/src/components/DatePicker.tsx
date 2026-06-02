import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  buildCalendarMonth,
  formatMonthYearLabel,
  isDateKeyInRange,
  monthKeyFromDateKey,
  shiftMonthKey,
} from '../lib/date-picker-calendar.util';
import { formatDateDisplay, getTodayDateKey, parseDateKey } from '../lib/date-format';
import './date-picker.css';

const WEEKDAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

export type DatePickerProps = {
  value: string;
  onChange: (dateKey: string) => void;
  min?: string;
  max?: string;
  disabled?: boolean;
  required?: boolean;
  id?: string;
  className?: string;
  placeholder?: string;
  clearable?: boolean;
  'aria-label'?: string;
};

export function DatePicker({
  value,
  onChange,
  min,
  max,
  disabled = false,
  required = false,
  id: idProp,
  className = '',
  placeholder = 'Select date',
  clearable = false,
  'aria-label': ariaLabel,
}: DatePickerProps) {
  const autoId = useId();
  const id = idProp ?? autoId;
  const todayKey = getTodayDateKey();

  const [open, setOpen] = useState(false);
  const [viewMonthKey, setViewMonthKey] = useState(() =>
    value ? monthKeyFromDateKey(value) : monthKeyFromDateKey(todayKey),
  );
  const [popoverPos, setPopoverPos] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  const monthCells = useMemo(() => buildCalendarMonth(viewMonthKey), [viewMonthKey]);
  const monthLabel = formatMonthYearLabel(viewMonthKey);
  const displayValue = value ? formatDateDisplay(value) : placeholder;

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
      setViewMonthKey(value ? monthKeyFromDateKey(value) : monthKeyFromDateKey(todayKey));
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
            className="date-picker-popover"
            style={{ top: popoverPos.top, left: popoverPos.left }}
          >
            <div className="date-picker-popover__header">
              <button
                type="button"
                className="date-picker-popover__nav"
                aria-label="Previous month"
                onClick={() => setViewMonthKey((m) => shiftMonthKey(m, -1))}
              >
                ‹
              </button>
              <p className="date-picker-popover__month">{monthLabel}</p>
              <button
                type="button"
                className="date-picker-popover__nav"
                aria-label="Next month"
                onClick={() => setViewMonthKey((m) => shiftMonthKey(m, 1))}
              >
                ›
              </button>
            </div>

            <div className="date-picker-weekdays">
              {WEEKDAYS.map((label) => (
                <span key={label} className="date-picker-weekday">
                  {label}
                </span>
              ))}
            </div>

            <div className="date-picker-grid">
              {monthCells.map((cell) => {
                const dayNum = parseDateKey(cell.dateKey)?.getUTCDate() ?? '';
                const selected = value === cell.dateKey;
                const isToday = cell.dateKey === todayKey;
                const allowed = isDateKeyInRange(cell.dateKey, min, max);
                const classes = [
                  'date-picker-day',
                  !cell.inMonth ? 'date-picker-day--outside' : '',
                  !allowed ? 'date-picker-day--disabled' : '',
                  selected ? 'date-picker-day--selected' : '',
                  isToday ? 'date-picker-day--today' : '',
                ]
                  .filter(Boolean)
                  .join(' ');

                return (
                  <button
                    key={cell.dateKey}
                    type="button"
                    disabled={!allowed}
                    className={classes}
                    onClick={() => selectDay(cell.dateKey)}
                    aria-pressed={selected}
                  >
                    {dayNum}
                  </button>
                );
              })}
            </div>

            <div className="date-picker-footer">
              <button
                type="button"
                onClick={() => {
                  if (isDateKeyInRange(todayKey, min, max)) {
                    onChange(todayKey);
                    setOpen(false);
                  }
                }}
                disabled={!isDateKeyInRange(todayKey, min, max)}
              >
                Today
              </button>
              {clearable && (
                <button
                  type="button"
                  onClick={() => {
                    onChange('');
                    setOpen(false);
                  }}
                >
                  Clear
                </button>
              )}
            </div>
          </div>,
          document.body,
        )
      : null;

  return (
    <>
      <button
        ref={triggerRef}
        id={id}
        type="button"
        disabled={disabled}
        aria-required={required}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={ariaLabel ?? displayValue}
        className={`date-picker-trigger ${className}`.trim()}
        onClick={() => {
          if (disabled) return;
          setOpen((v) => !v);
        }}
      >
        <span>{displayValue}</span>
        <span aria-hidden style={{ marginLeft: 'auto', opacity: 0.5 }}>
          ▾
        </span>
      </button>
      {popover}
    </>
  );
}
