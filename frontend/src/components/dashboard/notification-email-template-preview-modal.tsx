'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Eye, X } from 'lucide-react';
import api from '@/lib/api';
import { LOCALE_LABELS, type AppLocale } from '@/i18n';
import {
  EmailMessagePreview,
  NotificationChannelTabs,
  WhatsAppMessagePreview,
} from '@/components/dashboard/notification-channel-preview';
import type { EmailTemplateKey } from '@/components/dashboard/notification-email-templates-panel';
import {
  buildNotificationPreviewVariables,
  buildWhatsAppBookingTemplatePreview,
  emailSupportsWhatsAppPreview,
  renderNotificationMessagePreview,
  resolveEmailHtmlPreview,
  type NotificationPreviewChannel,
} from '@/lib/notification-message-preview.util';

interface WhatsAppIntegrationSettings {
  templateConfirmation: string;
  templateReminder: string;
  templateLanguage: string;
}

interface TemplateVariable {
  key: string;
  sampleValue: string;
}

interface PreviewDraft {
  subject: string;
  bodyText: string;
  bodyHtml: string;
}

export function NotificationEmailTemplatePreviewModal({
  open,
  onClose,
  businessId,
  templateKey,
  activeLocale,
  draft,
  variables,
  customDefaults,
  businessName,
  t,
}: {
  open: boolean;
  onClose: () => void;
  businessId: string;
  templateKey: EmailTemplateKey;
  activeLocale: AppLocale;
  draft: PreviewDraft;
  variables: TemplateVariable[];
  customDefaults: Record<string, string>;
  businessName: string;
  t: (key: string) => string;
}) {
  const supportsWhatsApp = emailSupportsWhatsAppPreview(templateKey);
  const channels = useMemo(
    (): NotificationPreviewChannel[] =>
      supportsWhatsApp ? ['email', 'whatsapp'] : ['email'],
    [supportsWhatsApp],
  );
  const [activeChannel, setActiveChannel] = useState<NotificationPreviewChannel>('email');

  const { data: whatsappSettings } = useQuery({
    queryKey: ['whatsapp-integration', businessId],
    queryFn: async () => {
      const { data: res } = await api.get(
        `/businesses/${businessId}/notifications/whatsapp`,
      );
      return (res.data || res) as WhatsAppIntegrationSettings;
    },
    enabled: open && supportsWhatsApp,
  });

  if (!open) return null;

  const previewVariables = buildNotificationPreviewVariables(variables, customDefaults);
  const rendered = renderNotificationMessagePreview(
    draft.subject,
    draft.bodyText,
    draft.bodyHtml,
    previewVariables,
  );
  const emailHtml = resolveEmailHtmlPreview(rendered);
  const whatsappPreview =
    supportsWhatsApp && whatsappSettings
      ? buildWhatsAppBookingTemplatePreview(templateKey, previewVariables, whatsappSettings)
      : null;

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
        aria-labelledby="email-template-preview-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between gap-3 px-5 py-4 border-b border-gray-800 bg-gray-900">
          <div>
            <h3 id="email-template-preview-title" className="font-semibold text-white">
              {t('notificationPreview.emailTemplateTitle')}
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              {t('notificationPreview.emailTemplateSubtitle')}
            </p>
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
          <p className="text-xs text-gray-400">
            {t('notificationPreview.localeLabel')}: {LOCALE_LABELS[activeLocale]}
          </p>
          <NotificationChannelTabs
            channels={channels}
            active={activeChannel}
            onChange={setActiveChannel}
            t={t}
          />

          {activeChannel === 'email' ? (
            <EmailMessagePreview
              businessName={businessName}
              subject={rendered.subject}
              bodyText={rendered.bodyText}
              bodyHtml={emailHtml}
              t={t}
            />
          ) : null}

          {activeChannel === 'whatsapp' ? (
            <WhatsAppMessagePreview
              businessName={businessName}
              preview={whatsappPreview}
              freeformBody={rendered.bodyText}
              note={
                whatsappPreview
                  ? t('notificationPreview.whatsAppMetaNote')
                  : t('notificationPreview.whatsAppLoading')
              }
              t={t}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}

export function NotificationEmailTemplatePreviewButton({
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
      className="btn-secondary text-sm inline-flex items-center gap-1.5"
    >
      <Eye className="w-3.5 h-3.5" />
      {t('notificationPreview.previewButton')}
    </button>
  );
}
