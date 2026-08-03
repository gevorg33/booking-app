import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { IonIcon } from '@ionic/react';
import { timeOutline } from 'ionicons/icons';
import {
  formatTimeWithFormat,
  readAuthBusinessDateFormats,
  type BusinessTimeFormat,
} from '../lib/business-date-format';
import './time-picker.css';
import { useI18n } from '../i18n';
import { useAuthStore } from '../services/auth-store';

export type TimePickerProps = {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  required?: boolean;
  id?: string;
  className?: string;
  'aria-label'?: string;
};

const HOURS_24 = Array.from({ length: 24 }, (_, i) => i);
const HOURS_12 = Array.from({ length: 12 }, (_, i) => i + 1);
const MINUTES = Array.from({ length: 60 }, (_, i) => i);

function parseHHmm(value: string): { h: number; m: number } | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value.trim());
  if (!match) return null;
  const h = Number.parseInt(match[1]!, 10);
  const m = Number.parseInt(match[2]!, 10);
  if (h < 0 || h > 23 || m < 0 || m > 59) return null;
  return { h, m };
}

function formatHHmm(h: number, m: number): string {
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function displayTimeFor(h: number, m: number, timeFormat: BusinessTimeFormat): string {
  const d = new Date(Date.UTC(2000, 0, 1, h, m));
  return formatTimeWithFormat(d, timeFormat, 'UTC');
}

export function TimePicker({
  value,
  onChange,
  disabled = false,
  required = false,
  id: idProp,
  className = '',
  'aria-label': ariaLabel,
}: TimePickerProps) {
  const { t } = useI18n();
  const business = useAuthStore((s) => s.business);
  const { timeFormat } = readAuthBusinessDateFormats(business);
  const is12h = timeFormat === '12h';
  const autoId = useId();
  const id = idProp ?? autoId;

  const [open, setOpen] = useState(false);
  const [popoverPos, setPopoverPos] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const hourListRef = useRef<HTMLDivElement>(null);
  const minuteListRef = useRef<HTMLDivElement>(null);

  const parsed = parseHHmm(value);
  const draftHour24 = parsed?.h ?? 9;
  const draftMinute = parsed?.m ?? 0;
  const draftPeriod: 'AM' | 'PM' = draftHour24 >= 12 ? 'PM' : 'AM';
  const draftHour12 = ((draftHour24 + 11) % 12) + 1;
  const displayValue = parsed
    ? displayTimeFor(parsed.h, parsed.m, timeFormat)
    : t('timePicker.placeholder');

  const commit = (h24: number, m: number) => {
    onChange(formatHHmm(h24, m));
  };

  const selectHour24 = (h: number) => commit(h, draftMinute);
  const selectHour12 = (h12: number) => {
    let h24 = h12 % 12;
    if (draftPeriod === 'PM') h24 += 12;
    commit(h24, draftMinute);
  };
  const selectMinute = (m: number) => commit(draftHour24, m);
  const selectPeriod = (period: 'AM' | 'PM') => {
    let h24 = draftHour24 % 12;
    if (period === 'PM') h24 += 12;
    commit(h24, draftMinute);
  };

  const updatePopoverPosition = useCallback(() => {
    const el = triggerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const width = is12h ? 240 : 172;
    const height = 300;
    let top = rect.bottom + 8;
    let left = rect.left;
    if (top + height > window.innerHeight - 12) {
      top = Math.max(12, rect.top - height - 8);
    }
    if (left + width > window.innerWidth - 12) {
      left = Math.max(12, window.innerWidth - width - 12);
    }
    setPopoverPos({ top, left });
  }, [is12h]);

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

  useEffect(() => {
    if (!open) return;
    const raf = requestAnimationFrame(() => {
      hourListRef.current
        ?.querySelector('.time-picker-option--selected')
        ?.scrollIntoView({ block: 'center' });
      minuteListRef.current
        ?.querySelector('.time-picker-option--selected')
        ?.scrollIntoView({ block: 'center' });
    });
    return () => cancelAnimationFrame(raf);
  }, [open]);

  const popover =
    open && typeof document !== 'undefined'
      ? createPortal(
          <div
            ref={popoverRef}
            role="dialog"
            aria-modal="true"
            className="time-picker-popover"
            style={{ top: popoverPos.top, left: popoverPos.left }}
          >
            <div className="time-picker-columns">
              <div
                className="time-picker-column"
                ref={hourListRef}
                role="listbox"
                aria-label={t('timePicker.hourLabel')}
              >
                {(is12h ? HOURS_12 : HOURS_24).map((h) => {
                  const selected = is12h ? h === draftHour12 : h === draftHour24;
                  return (
                    <button
                      key={h}
                      type="button"
                      role="option"
                      aria-selected={selected}
                      className={`time-picker-option${selected ? ' time-picker-option--selected' : ''}`}
                      onClick={() => (is12h ? selectHour12(h) : selectHour24(h))}
                    >
                      {String(h).padStart(2, '0')}
                    </button>
                  );
                })}
              </div>
              <div
                className="time-picker-column"
                ref={minuteListRef}
                role="listbox"
                aria-label={t('timePicker.minuteLabel')}
              >
                {MINUTES.map((m) => {
                  const selected = m === draftMinute;
                  return (
                    <button
                      key={m}
                      type="button"
                      role="option"
                      aria-selected={selected}
                      className={`time-picker-option${selected ? ' time-picker-option--selected' : ''}`}
                      onClick={() => selectMinute(m)}
                    >
                      {String(m).padStart(2, '0')}
                    </button>
                  );
                })}
              </div>
              {is12h ? (
                <div className="time-picker-column time-picker-column--period">
                  {(['AM', 'PM'] as const).map((period) => {
                    const selected = period === draftPeriod;
                    return (
                      <button
                        key={period}
                        type="button"
                        role="option"
                        aria-selected={selected}
                        className={`time-picker-option${selected ? ' time-picker-option--selected' : ''}`}
                        onClick={() => selectPeriod(period)}
                      >
                        {period}
                      </button>
                    );
                  })}
                </div>
              ) : null}
            </div>
            <div className="time-picker-footer">
              <button type="button" onClick={() => setOpen(false)}>
                {t('timePicker.done')}
              </button>
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
        aria-label={ariaLabel ?? t('timePicker.openPicker')}
        className={`time-picker-trigger ${className}`.trim()}
        onClick={() => {
          if (disabled) return;
          setOpen((v) => !v);
        }}
      >
        <IonIcon icon={timeOutline} aria-hidden="true" className="time-picker-trigger__icon" />
        <span>{displayValue}</span>
        <span aria-hidden className="time-picker-trigger__chevron">
          ▾
        </span>
      </button>
      {popover}
    </>
  );
}
