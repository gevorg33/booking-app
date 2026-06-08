'use client';

import { useMemo, useState } from 'react';
import { LOCALE_LABELS, type AppLocale } from '@/i18n';
import { RadioCard } from '@/components/ui/radio-choice';
import {
  CatalogNotifyPreviewButton,
  CatalogNotifyPreviewModal,
} from '@/components/dashboard/catalog-notify-preview-modal';
import {
  catalogNotifyLocaleTemplate,
  patchCatalogNotifyLocaleTemplate,
  type CatalogNotifyFormState,
  type CatalogNotifyPreviewContext,
} from '@/lib/catalog-notify-customers.util';

const inputClass =
  'w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm';

export function CatalogNotifyCustomersFields({
  value,
  onChange,
  enabledLocales,
  variableHints,
  previewContext,
  t,
}: {
  value: CatalogNotifyFormState;
  onChange: (next: CatalogNotifyFormState) => void;
  enabledLocales: readonly AppLocale[];
  variableHints: string;
  previewContext?: CatalogNotifyPreviewContext;
  t: (key: string) => string;
}) {
  const defaultTab = enabledLocales[0] ?? 'en';
  const [activeLocale, setActiveLocale] = useState<AppLocale>(defaultTab);
  const [previewOpen, setPreviewOpen] = useState(false);
  const localeTemplate = useMemo(
    () => catalogNotifyLocaleTemplate(value.template, activeLocale),
    [activeLocale, value.template],
  );

  return (
    <div className="md:col-span-2 space-y-4 rounded-lg border border-gray-200 dark:border-gray-800 p-4">
      <div>
        <p className="text-sm font-medium text-gray-200">{t('catalogNotify.title')}</p>
        <p className="text-xs text-gray-500 mt-1">{t('catalogNotify.subtitle')}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <RadioCard
          name="catalog-notify-mode"
          value="skip"
          checked={value.mode === 'skip'}
          onSelect={() => onChange({ ...value, mode: 'skip' })}
        >
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {t('catalogNotify.modeSkipTitle')}
          </p>
          <p className="text-xs text-gray-500 mt-1">{t('catalogNotify.modeSkipHint')}</p>
        </RadioCard>
        <RadioCard
          name="catalog-notify-mode"
          value="notify"
          checked={value.mode === 'notify'}
          onSelect={() => onChange({ ...value, mode: 'notify' })}
        >
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {t('catalogNotify.modeNotifyTitle')}
          </p>
          <p className="text-xs text-gray-500 mt-1">{t('catalogNotify.modeNotifyHint')}</p>
        </RadioCard>
      </div>

      {value.mode === 'notify' ? (
        <div className="space-y-4 border-t border-gray-800 pt-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs text-gray-500">{t('catalogNotify.templateHint')}</p>
            {previewContext ? (
              <CatalogNotifyPreviewButton
                onClick={() => setPreviewOpen(true)}
                t={t}
              />
            ) : null}
          </div>
          <p className="text-xs text-gray-400 font-mono">{variableHints}</p>
          {enabledLocales.length > 1 ? (
            <div className="flex flex-wrap gap-2">
              {enabledLocales.map((locale) => (
                <button
                  key={locale}
                  type="button"
                  onClick={() => setActiveLocale(locale)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    activeLocale === locale
                      ? 'bg-blue-600/10 text-blue-400'
                      : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
                  }`}
                >
                  {LOCALE_LABELS[locale]}
                </button>
              ))}
            </div>
          ) : null}
          <div>
            <label className="label">{t('catalogNotify.subjectLabel')}</label>
            <input
              className={inputClass}
              value={localeTemplate.subject}
              onChange={(e) =>
                onChange({
                  ...value,
                  template: patchCatalogNotifyLocaleTemplate(value.template, activeLocale, {
                    subject: e.target.value,
                  }),
                })
              }
              placeholder={t('catalogNotify.subjectPlaceholder')}
            />
          </div>
          <div>
            <label className="label">{t('catalogNotify.bodyLabel')}</label>
            <textarea
              className={`${inputClass} min-h-[120px]`}
              value={localeTemplate.bodyText}
              onChange={(e) =>
                onChange({
                  ...value,
                  template: patchCatalogNotifyLocaleTemplate(value.template, activeLocale, {
                    bodyText: e.target.value,
                  }),
                })
              }
              placeholder={t('catalogNotify.bodyPlaceholder')}
            />
          </div>
        </div>
      ) : null}
      {previewContext ? (
        <CatalogNotifyPreviewModal
          open={previewOpen}
          onClose={() => setPreviewOpen(false)}
          value={value}
          previewContext={previewContext}
          enabledLocales={enabledLocales}
          initialLocale={activeLocale}
          t={t}
        />
      ) : null}
    </div>
  );
}
