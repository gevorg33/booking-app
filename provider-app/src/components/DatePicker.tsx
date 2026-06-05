import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  buildCalendarMonth,
  formatMonthYearLabel,
  isDateKeyInRange,
  monthKeyFromDateKey,
  shiftMonthKey,
} from '../lib/date-picker-calendar.util';
import {
  businessDateFormatPattern,
  businessDateInputPlaceholder,
  formatDateDisplay,
  getTodayDateKey,
  parseDateKey,
  parseTypedBusinessDateToKey,
  readAuthBusinessDateFormats,
} from '../lib/date-format';
import './date-picker.css';
import { useI18n } from '../i18n';
import { useAuthStore } from '../services/auth-store';

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
  allowTyping?: boolean;
  showFormatHint?: boolean;
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
  placeholder,
  clearable = false,
  allowTyping = true,
  showFormatHint = true,
  'aria-label': ariaLabel,
}: DatePickerProps) {
  const { t } = useI18n();
  const business = useAuthStore((s) => s.business);
  const { dateFormat } = readAuthBusinessDateFormats(business);
  const formatPattern = businessDateFormatPattern(dateFormat);
  const formatExample = businessDateInputPlaceholder(dateFormat);
  const formatHint = t('datePicker.formatHint', {
    format: formatPattern,
    example: formatExample,
  });
  const invalidHint = t('datePicker.invalidDate', { format: formatPattern });
  const resolvedPlaceholder = placeholder ?? formatExample;
  const weekdays = [
    t('datePicker.weekdays.mon'),
    t('datePicker.weekdays.tue'),
    t('datePicker.weekdays.wed'),
    t('datePicker.weekdays.thu'),
    t('datePicker.weekdays.fri'),
    t('datePicker.weekdays.sat'),
    t('datePicker.weekdays.sun'),
  ];
  const autoId = useId();
  const id = idProp ?? autoId;
  const todayKey = getTodayDateKey();

  const [open, setOpen] = useState(false);
  const [typedValue, setTypedValue] = useState('');
  const [typedInvalid, setTypedInvalid] = useState(false);
  const [viewMonthKey, setViewMonthKey] = useState(() =>
    value ? monthKeyFromDateKey(value) : monthKeyFromDateKey(todayKey),
  );
  const [popoverPos, setPopoverPos] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  const monthCells = useMemo(() => buildCalendarMonth(viewMonthKey), [viewMonthKey]);
  const monthLabel = formatMonthYearLabel(viewMonthKey);
  const displayValue = value ? formatDateDisplay(value) : resolvedPlaceholder;

  useEffect(() => {
    if (!allowTyping) return;
    setTypedValue(value ? formatDateDisplay(value) : '');
    setTypedInvalid(false);
  }, [allowTyping, value, dateFormat]);

  const commitTypedValue = useCallback(() => {
    const trimmed = typedValue.trim();
    if (!trimmed) {
      setTypedInvalid(false);
      if (clearable) onChange('');
      return;
    }
    const key = parseTypedBusinessDateToKey(trimmed);
    if (key) {
      setTypedInvalid(false);
      onChange(key);
      setTypedValue(formatDateDisplay(key));
      return;
    }
    setTypedInvalid(true);
  }, [clearable, onChange, typedValue]);

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
                aria-label={t('datePicker.prevMonth')}
                onClick={() => setViewMonthKey((m) => shiftMonthKey(m, -1))}
              >
                ‹
              </button>
              <p className="date-picker-popover__month">{monthLabel}</p>
              <button
                type="button"
                className="date-picker-popover__nav"
                aria-label={t('datePicker.nextMonth')}
                onClick={() => setViewMonthKey((m) => shiftMonthKey(m, 1))}
              >
                ›
              </button>
            </div>

            <div className="date-picker-weekdays">
              {weekdays.map((label) => (
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
                {t('datePicker.today')}
              </button>
              {clearable && (
                <button
                  type="button"
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

  const calendarTrigger = (
    <button
      ref={triggerRef}
      id={allowTyping ? undefined : id}
      type="button"
      disabled={disabled}
      aria-required={required}
      aria-haspopup="dialog"
      aria-expanded={open}
      aria-label={ariaLabel ?? (allowTyping ? t('datePicker.openCalendar') : displayValue)}
      className={
        allowTyping
          ? 'date-picker-trigger date-picker-trigger--icon'
          : `date-picker-trigger ${className}`.trim()
      }
      onClick={() => {
        if (disabled) return;
        setOpen((v) => !v);
      }}
    >
      {allowTyping ? (
        <span aria-hidden>📅</span>
      ) : (
        <>
          <span>{displayValue}</span>
          <span aria-hidden style={{ marginLeft: 'auto', opacity: 0.5 }}>
            ▾
          </span>
        </>
      )}
    </button>
  );

  const field = allowTyping ? (
    <div className={`date-picker-field ${className}`.trim()}>
      <div className="date-picker-field__row">
        <input
          id={id}
          type="text"
          inputMode="numeric"
          autoComplete="off"
          disabled={disabled}
          required={required}
          aria-required={required}
          aria-invalid={typedInvalid}
          aria-describedby={showFormatHint ? `${id}-hint` : undefined}
          placeholder={resolvedPlaceholder}
          value={typedValue}
          onChange={(e) => {
            setTypedValue(e.target.value);
            if (typedInvalid) setTypedInvalid(false);
          }}
          onBlur={commitTypedValue}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              commitTypedValue();
            }
          }}
          className="date-picker-input"
        />
        {calendarTrigger}
      </div>
      {showFormatHint ? (
        <p id={`${id}-hint`} className="date-picker-hint">
          {formatHint}
        </p>
      ) : null}
      {typedInvalid ? (
        <p className="date-picker-error" role="alert">
          {invalidHint}
        </p>
      ) : null}
    </div>
  ) : (
    calendarTrigger
  );

  return (
    <>
      {field}
      {popover}
    </>
  );
}
