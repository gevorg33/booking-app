'use client';

import { useMutation } from '@tanstack/react-query';
import { Settings } from 'lucide-react';
import { LanguageSwitcher } from '@/components/language-switcher';
import { ThemeSwitcher } from '@/components/theme-switcher';
import { useTheme } from '@/components/theme-provider';
import { useI18n } from '@/i18n';
import api from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import type { AppLocale } from '@/i18n';

export default function SettingsPage() {
  const { t, locale } = useI18n();
  const { theme } = useTheme();
  const { user, setAuth, business, token } = useAuthStore();

  const saveLocale = useMutation({
    mutationFn: async (nextLocale: AppLocale) => {
      const { data } = await api.patch('/auth/preferences', { locale: nextLocale });
      return data.data || data;
    },
    onSuccess: (result) => {
      if (user && business && token) {
        setAuth({ ...user, locale: result.user.locale }, business, token);
      }
    },
  });

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold flex items-center gap-2 mb-2">
        <Settings className="w-6 h-6 text-blue-400" />
        {t('settings.title')}
      </h1>
      <p className="text-gray-500 dark:text-gray-400 text-sm mb-8">{t('settings.subtitle')}</p>

      <div className="card space-y-6">
        <div>
          <h2 className="font-semibold mb-1 text-gray-900 dark:text-gray-100">{t('settings.themeSection')}</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{t('settings.themeDescription')}</p>
          <ThemeSwitcher />
        </div>

        <div className="border-t border-gray-200 dark:border-gray-800 pt-6">
          <h2 className="font-semibold mb-1 text-gray-900 dark:text-gray-100">{t('settings.languageSection')}</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{t('languages.description')}</p>
          <LanguageSwitcher
            onChange={(next) => {
              saveLocale.mutate(next);
            }}
          />
          {saveLocale.isSuccess && (
            <p className="text-sm text-green-600 dark:text-green-400 mt-3">{t('languages.saved')}</p>
          )}
        </div>

        <div className="border-t border-gray-200 dark:border-gray-800 pt-4 text-sm text-gray-500">
          <p>
            {t('settings.account')}: {user?.email}
          </p>
          <p className="mt-1">
            {t('settings.dashboardLanguage')}: {locale.toUpperCase()}
          </p>
          <p className="mt-1">
            {t('settings.appearance')}: {theme === 'light' ? t('settings.themeLight') : t('settings.themeDark')}
          </p>
        </div>
      </div>
    </div>
  );
}
