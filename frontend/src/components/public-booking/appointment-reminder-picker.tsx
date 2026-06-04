'use client';

import { toIntlLocale } from '@/lib/date-format';
import { useI18n } from '@/i18n';

/** Hour count phrase for reminder options (Intl unit style is unreliable in hy-AM in many browsers). */
export function formatReminderHoursLabel(hours: number, locale: string): string {
  if (locale === 'hy') {
    return hours === 1 ? '1 ժամ' : `${hours} ժամ`;
  }
  if (locale === 'ru') {
    const mod10 = hours % 10;
    const mod100 = hours % 100;
    if (mod10 === 1 && mod100 !== 11) return `${hours} час`;
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return `${hours} часа`;
    return `${hours} часов`;
  }
  if (locale === 'en') {
    return hours === 1 ? '1 hour' : `${hours} hours`;
  }
  const intlLocale = toIntlLocale(locale) ?? 'en-GB';
  return new Intl.NumberFormat(intlLocale, {
    style: 'unit',
    unit: 'hour',
    unitDisplay: 'long',
  }).format(hours);
}

export function formatReminderBeforeLabel(
  hours: number,
  t: (key: string, vars?: Record<string, string | number>) => string,
  locale: string,
): string {
  const unit = formatReminderHoursLabel(hours, locale);
  return t('public.reminderBeforeOption', { unit });
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
            {formatReminderBeforeLabel(hours, t, locale)}
          </option>
        ))}
        <option value="none">{t('public.reminderTimingNone')}</option>
      </select>
      <p className="mt-1 text-xs text-gray-500">{t('public.reminderTimingHint')}</p>
    </label>
  );
}
