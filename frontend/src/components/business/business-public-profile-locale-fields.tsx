'use client';

import { SUPPORTED_LOCALES, type AppLocale } from '@/i18n';
import type { PublicProfileLocalesFormState } from '@/lib/business-public-profile-locales';

const LOCALE_LABEL_KEYS: Record<AppLocale, string> = {
  en: 'business.publicContentLocaleEn',
  hy: 'business.publicContentLocaleHy',
  ru: 'business.publicContentLocaleRu',
};

type FieldKey = keyof PublicProfileLocalesFormState[AppLocale];

const FIELD_LABEL_KEYS: Record<FieldKey, string> = {
  name: 'business.publicContentName',
  description: 'common.description',
  tagline: 'business.tagline',
  address: 'common.address',
};

export function BusinessPublicProfileLocaleFields({
  value,
  onChange,
  t,
  enabledLocales = SUPPORTED_LOCALES,
}: {
  value: PublicProfileLocalesFormState;
  onChange: (next: PublicProfileLocalesFormState) => void;
  t: (key: string) => string;
  enabledLocales?: readonly AppLocale[];
}) {
  const updateField = (locale: AppLocale, field: FieldKey, nextValue: string) => {
    onChange({
      ...value,
      [locale]: { ...value[locale], [field]: nextValue },
    });
  };

  return (
    <div className="w-full space-y-4">
      <p className="text-xs text-gray-500">{t('business.publicContentHint')}</p>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {enabledLocales.map((locale) => (
          <div key={locale} className="space-y-3 rounded-lg border border-gray-800 bg-gray-900/40 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-violet-300">
              {t(LOCALE_LABEL_KEYS[locale])}
            </p>
            {(Object.keys(FIELD_LABEL_KEYS) as FieldKey[]).map((field) => (
              <div key={`${locale}-${field}`}>
                <label className="label text-xs">{t(FIELD_LABEL_KEYS[field])}</label>
                {field === 'description' ? (
                  <textarea
                    className="input min-h-[80px] resize-y text-sm"
                    value={value[locale][field]}
                    onChange={(e) => updateField(locale, field, e.target.value)}
                    placeholder={t('business.publicContentOptional')}
                  />
                ) : (
                  <input
                    className="input text-sm"
                    value={value[locale][field]}
                    onChange={(e) => updateField(locale, field, e.target.value)}
                    placeholder={t('business.publicContentOptional')}
                  />
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
