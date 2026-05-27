'use client';

import { Moon, Sun } from 'lucide-react';
import { useI18n } from '@/i18n';
import { useTheme } from '@/components/theme-provider';
import type { Theme } from '@/lib/theme';

export function ThemeSwitcher() {
  const { t } = useI18n();
  const { theme, setTheme } = useTheme();

  const options: { id: Theme; label: string; icon: typeof Sun }[] = [
    { id: 'light', label: t('settings.themeLight'), icon: Sun },
    { id: 'dark', label: t('settings.themeDark'), icon: Moon },
  ];

  return (
    <div
      role="radiogroup"
      aria-label={t('settings.themeSection')}
      className="inline-flex rounded-lg border border-gray-200 dark:border-gray-700 p-1 bg-gray-100 dark:bg-gray-900"
    >
      {options.map(({ id, label, icon: Icon }) => {
        const active = theme === id;
        return (
          <button
            key={id}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => setTheme(id)}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              active
                ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        );
      })}
    </div>
  );
}
