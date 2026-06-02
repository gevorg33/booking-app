'use client';

import { useI18n } from '@/i18n';

export function formatReminderHoursLabel(hours: number, locale: string): string {
  if (hours === 1) {
    return new Intl.NumberFormat(locale, { style: 'unit', unit: 'hour', unitDisplay: 'long' }).format(1);
  }
  return new Intl.NumberFormat(locale, {
    style: 'unit',
    unit: 'hour',
    unitDisplay: 'long',
  }).format(hours);
}

export function formatReminderBeforeLabel(hours: number, locale: string): string {
  const unit = formatReminderHoursLabel(hours, locale);
  return `${unit} before`;
}

interface AppointmentReminderPickerProps {
  optionsHours: number[];
  value: number | null;
  onChange: (value: number | null) => void;
  disabled?: boolean;
}

export function AppointmentReminderPicker({
  optionsHours,
  value,
  onChange,
  disabled,
}: AppointmentReminderPickerProps) {
  const { t, locale } = useI18n();
  const sorted = [...optionsHours].sort((a, b) => b - a);

  const fieldClassName =
    'mt-1 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-violet-200 focus:border-violet-400 disabled:opacity-60';

  return (
    <label className="block text-sm">
      <span className="block text-sm font-medium text-gray-700 mb-1">
        {t('public.reminderTimingLabel')}
      </span>
      <select
        className={fieldClassName}
        value={value === null ? 'none' : String(value)}
        disabled={disabled}
        onChange={(e) => {
          const next = e.target.value;
          onChange(next === 'none' ? null : Number(next));
        }}
      >
        {sorted.map((hours) => (
          <option key={hours} value={hours}>
            {formatReminderBeforeLabel(hours, locale)}
          </option>
        ))}
        <option value="none">{t('public.reminderTimingNone')}</option>
      </select>
      <p className="mt-1 text-xs text-gray-500">{t('public.reminderTimingHint')}</p>
    </label>
  );
}
