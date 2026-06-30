'use client';

import { useEffect, useMemo, useState } from 'react';
import { Eye, X } from 'lucide-react';
import { LOCALE_LABELS, type AppLocale } from '@/i18n';
import {
  EmailMessagePreview,
  NotificationChannelTabs,
  PushMessagePreview,
  WhatsAppMessagePreview,
} from '@/components/dashboard/notification-channel-preview';
import {
  plainTextToEmailHtml,
  type NotificationPreviewChannel,
} from '@/lib/notification-message-preview.util';
import {
  catalogNotifyLocaleTemplate,
  catalogNotifyPreviewHasContent,
  renderCatalogNotifyPreview,
  type CatalogNotifyFormState,
  type CatalogNotifyPreviewContext,
} from '@/lib/catalog-notify-customers.util';

const CATALOG_CHANNELS: NotificationPreviewChannel[] = ['email', 'push', 'whatsapp'];

export function CatalogNotifyPreviewModal({
  open,
  onClose,
  value,
  previewContext,
  enabledLocales,
  initialLocale,
  t,
}: {
  open: boolean;
  onClose: () => void;
  value: CatalogNotifyFormState;
  previewContext: CatalogNotifyPreviewContext;
  enabledLocales: readonly AppLocale[];
  initialLocale: AppLocale;
  t: (key: string, params?: Record<string, string>) => string;
}) {
  const fallbackLocale = enabledLocales[0] ?? 'en';
  const [activeLocale, setActiveLocale] = useState<AppLocale>(
    enabledLocales.includes(initialLocale) ? initialLocale : fallbackLocale,
  );
  const [activeChannel, setActiveChannel] =
    useState<NotificationPreviewChannel>('email');

  useEffect(() => {
    if (!open) return;
    queueMicrotask(() => {
      setActiveLocale(enabledLocales.includes(initialLocale) ? initialLocale : fallbackLocale);
      setActiveChannel('email');
    });
  }, [open, initialLocale, enabledLocales, fallbackLocale]);

  const localeTemplate = catalogNotifyLocaleTemplate(value.template, activeLocale);
  const hasContent = catalogNotifyPreviewHasContent(localeTemplate);
  const rendered = hasContent
    ? renderCatalogNotifyPreview(localeTemplate, previewContext, activeLocale)
    : null;
  const emailHtml = useMemo(
    () => (rendered ? plainTextToEmailHtml(rendered.bodyText) : ''),
    [rendered],
  );

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="catalog-notify-preview-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between gap-3 px-5 py-4 border-b border-gray-800 bg-gray-900">
          <div>
            <h3 id="catalog-notify-preview-title" className="font-semibold text-white">
              {t('catalogNotify.previewTitle')}
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">{t('catalogNotify.previewSubtitle')}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-white"
            aria-label={t('common.close')}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {enabledLocales.length > 1 ? (
            <div className="flex flex-wrap gap-2">
              {enabledLocales.map((locale) => (
                <button
                  key={locale}
                  type="button"
                  onClick={() => setActiveLocale(locale)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    activeLocale === locale
                      ? 'bg-violet-600/10 text-violet-300'
                      : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
                  }`}
                >
                  {LOCALE_LABELS[locale]}
                </button>
              ))}
            </div>
          ) : null}

          <p className="text-xs text-gray-500">{t('catalogNotify.previewSampleHint')}</p>

          {!hasContent ? (
            <p className="text-sm text-gray-400">{t('catalogNotify.previewEmpty')}</p>
          ) : (
            <div className="space-y-4">
              <NotificationChannelTabs
                channels={CATALOG_CHANNELS}
                active={activeChannel}
                onChange={setActiveChannel}
                t={t}
              />

              {activeChannel === 'email' ? (
                <EmailMessagePreview
                  businessName={previewContext.businessName}
                  subject={rendered?.subject ?? ''}
                  bodyText={rendered?.bodyText ?? ''}
                  bodyHtml={emailHtml}
                  t={t}
                />
              ) : null}

              {activeChannel === 'push' ? (
                <PushMessagePreview
                  title={rendered?.subject ?? ''}
                  body={rendered?.bodyText ?? ''}
                  t={t}
                />
              ) : null}

              {activeChannel === 'whatsapp' ? (
                <WhatsAppMessagePreview
                  businessName={previewContext.businessName}
                  freeformBody={rendered?.bodyText ?? ''}
                  note={t('catalogNotify.previewWhatsAppNote')}
                  t={t}
                />
              ) : null}

              <p className="text-xs text-gray-500 font-mono break-all">
                {t('catalogNotify.previewBookUrlLabel')}: {previewContext.bookUrl}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function CatalogNotifyPreviewButton({
  onClick,
  t,
}: {
  onClick: () => void;
  t: (key: string) => string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-blue-400 hover:text-blue-300 hover:bg-blue-600/10 transition-colors"
    >
      <Eye className="w-3.5 h-3.5" />
      {t('catalogNotify.previewButton')}
    </button>
  );
}
