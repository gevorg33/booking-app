'use client';

import { Globe } from 'lucide-react';
import { useI18n } from '@/i18n/I18nProvider';
import type { AppLocale } from '@/i18n';

interface LanguageSwitcherProps {
  variant?: 'dark' | 'light';
  compact?: boolean;
  onChange?: (locale: AppLocale) => void;
}

export function LanguageSwitcher({ variant = 'dark', compact = false, onChange }: LanguageSwitcherProps) {
  const { locale, setLocale, locales, localeLabels } = useI18n();

  const selectClass =
    variant === 'light'
      ? 'bg-gray-50 border-gray-200 text-gray-900'
      : 'bg-white border-gray-300 text-gray-900 dark:bg-gray-900 dark:border-gray-700 dark:text-gray-200';

  return (
    <div className={`flex items-center gap-2 ${compact ? '' : 'w-full'}`}>
      {!compact && (
        <Globe
          className={`w-4 h-4 shrink-0 ${variant === 'light' ? 'text-gray-500' : 'text-gray-500 dark:text-gray-400'}`}
        />
      )}
      <select
        value={locale}
        onChange={(e) => {
          const next = e.target.value as AppLocale;
          setLocale(next);
          onChange?.(next);
        }}
        className={`text-sm rounded-lg border px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500/40 ${selectClass} ${compact ? '' : 'flex-1'}`}
        aria-label="Language"
      >
        {locales.map((code) => (
          <option key={code} value={code}>
            {localeLabels[code]}
          </option>
        ))}
      </select>
    </div>
  );
}
