'use client';

import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import api from '@/lib/api';
import { useI18n, LOCALE_LABELS, SUPPORTED_LOCALES, type AppLocale } from '@/i18n';
import {
  readBusinessDefaultLocale,
  readBusinessEnabledLocales,
} from '@/lib/business-locale';
import { fetchBusinessSettings, unwrapBusinessApiPayload } from '@/lib/business-query';
import { ToggleChoice } from '@/components/ui/radio-choice';

export function BusinessLanguageSettings({ businessId }: { businessId: string }) {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const [enabledLocales, setEnabledLocales] = useState<AppLocale[]>([...SUPPORTED_LOCALES]);
  const [defaultLocale, setDefaultLocale] = useState<AppLocale>('en');
  const [saved, setSaved] = useState(false);

  const { data: businessData, isLoading } = useQuery({
    queryKey: ['business', businessId],
    queryFn: async () => {
      const { data } = await api.get(`/businesses/${businessId}`);
      return unwrapBusinessApiPayload<{ settings?: Record<string, unknown> }>(data);
    },
  });

  useEffect(() => {
    if (!businessData?.settings) return;
    queueMicrotask(() => {
      setEnabledLocales(readBusinessEnabledLocales(businessData.settings));
      setDefaultLocale(readBusinessDefaultLocale(businessData.settings));
    });
  }, [businessData]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const current = await fetchBusinessSettings(businessId);
      const { data } = await api.put(`/businesses/${businessId}`, {
        settings: {
          ...current,
          enabledLocales,
          defaultLocale,
          locale: defaultLocale,
        },
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['business', businessId] });
      queryClient.invalidateQueries({ queryKey: ['business-settings', businessId] });
      queryClient.invalidateQueries({ queryKey: ['business-profile', businessId] });
      setSaved(true);
      window.setTimeout(() => setSaved(false), 2500);
    },
  });

  const toggleLocale = (locale: AppLocale) => {
    setEnabledLocales((prev) => {
      if (prev.includes(locale)) {
        if (prev.length === 1) return prev;
        const next = prev.filter((code) => code !== locale);
        if (!next.includes(defaultLocale)) {
          setDefaultLocale(next[0]);
        }
        return next;
      }
      return [...prev, locale].sort(
        (a, b) => SUPPORTED_LOCALES.indexOf(a) - SUPPORTED_LOCALES.indexOf(b),
      );
    });
  };

  const defaultOptions = useMemo(
    () => enabledLocales.map((code) => ({ code, label: LOCALE_LABELS[code] })),
    [enabledLocales],
  );

  const validationError =
    enabledLocales.length === 0
      ? t('settings.enabledLocalesRequired')
      : !enabledLocales.includes(defaultLocale)
        ? t('settings.defaultLocaleMustBeEnabled')
        : null;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-semibold mb-1 text-gray-900 dark:text-gray-100">
          {t('settings.tenantLanguagesSection')}
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {t('settings.tenantLanguagesDescription')}
        </p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-6">
          <Loader2 className="w-5 h-5 animate-spin text-violet-400" />
        </div>
      ) : (
        <>
          <div>
            <p className="label mb-2">{t('settings.enabledLocalesLabel')}</p>
            <div className="space-y-1 divide-y divide-gray-100 dark:divide-gray-800">
              {SUPPORTED_LOCALES.map((locale) => (
                <ToggleChoice
                  key={locale}
                  variant="dashboard"
                  layout="toggle-first"
                  checked={enabledLocales.includes(locale)}
                  disabled={
                    saveMutation.isPending ||
                    (enabledLocales.includes(locale) && enabledLocales.length === 1)
                  }
                  onChange={(checked) => {
                    const isEnabled = enabledLocales.includes(locale);
                    if (checked !== isEnabled) toggleLocale(locale);
                  }}
                  label={LOCALE_LABELS[locale]}
                />
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-1">{t('settings.enabledLocalesHint')}</p>
          </div>

          <div>
            <label className="label" htmlFor="business-default-locale">
              {t('settings.defaultTenantLocale')}
            </label>
            <select
              id="business-default-locale"
              className="input w-full max-w-xs"
              value={defaultLocale}
              disabled={saveMutation.isPending || defaultOptions.length === 0}
              onChange={(e) => setDefaultLocale(e.target.value as AppLocale)}
            >
              {defaultOptions.map(({ code, label }) => (
                <option key={code} value={code}>
                  {label}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">{t('settings.defaultTenantLocaleHint')}</p>
          </div>

          {validationError && (
            <p className="text-sm text-red-600 dark:text-red-400">{validationError}</p>
          )}

          <button
            type="button"
            className="btn-primary text-sm"
            disabled={saveMutation.isPending || Boolean(validationError)}
            onClick={() => saveMutation.mutate()}
          >
            {saveMutation.isPending ? t('common.saving') : t('settings.saveTenantLanguages')}
          </button>

          {saved && (
            <p className="text-sm text-green-600 dark:text-green-400">
              {t('settings.tenantLanguagesSaved')}
            </p>
          )}
        </>
      )}
    </div>
  );
}
