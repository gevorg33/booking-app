'use client';

import { SUPPORTED_LOCALES, type AppLocale } from '@/i18n';
import {
  LOCALIZED_NAME_SLOTS,
  type LocalizedNamesFormState,
} from '@/lib/localized-names';

const LOCALE_LABEL_KEYS: Record<AppLocale, string> = {
  en: 'servicesPage.localizedNamesLocaleEn',
  hy: 'servicesPage.localizedNamesLocaleHy',
  ru: 'servicesPage.localizedNamesLocaleRu',
};

export function LocalizedNamesFields({
  value,
  onChange,
  t,
  enabledLocales = SUPPORTED_LOCALES,
}: {
  value: LocalizedNamesFormState;
  onChange: (next: LocalizedNamesFormState) => void;
  t: (key: string) => string;
  enabledLocales?: readonly AppLocale[];
}) {
  return (
    <div className="md:col-span-2 space-y-4 rounded-lg border border-gray-200 dark:border-gray-800 p-4">
      <div>
        <p className="text-sm font-medium text-gray-200">{t('servicesPage.localizedNamesTitle')}</p>
        <p className="text-xs text-gray-500 mt-1">{t('servicesPage.localizedNamesHint')}</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {enabledLocales.map((locale) => (
          <div key={locale} className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
              {t(LOCALE_LABEL_KEYS[locale])}
            </p>
            {Array.from({ length: LOCALIZED_NAME_SLOTS }, (_, index) => (
              <div key={`${locale}-${index}`}>
                <label className="label text-xs">
                  {t('servicesPage.localizedNamesSlot').replace('{n}', String(index + 1))}
                </label>
                <input
                  className="input"
                  value={value[locale][index]}
                  onChange={(e) => {
                    const next = { ...value, [locale]: [...value[locale]] as [string, string, string] };
                    next[locale][index] = e.target.value;
                    onChange(next);
                  }}
                  placeholder={t('servicesPage.localizedNamesOptional')}
                />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
