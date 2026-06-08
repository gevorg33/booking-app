'use client';

import { Mail, MessageCircle, Smartphone } from 'lucide-react';
import type {
  NotificationPreviewChannel,
  WhatsAppTemplatePreview,
} from '@/lib/notification-message-preview.util';

const channelLabels: Record<
  NotificationPreviewChannel,
  { icon: typeof Mail; labelKey: string }
> = {
  email: { icon: Mail, labelKey: 'notificationPreview.channelEmail' },
  push: { icon: Smartphone, labelKey: 'notificationPreview.channelPush' },
  whatsapp: { icon: MessageCircle, labelKey: 'notificationPreview.channelWhatsApp' },
};

export function NotificationChannelTabs({
  channels,
  active,
  onChange,
  t,
}: {
  channels: readonly NotificationPreviewChannel[];
  active: NotificationPreviewChannel;
  onChange: (channel: NotificationPreviewChannel) => void;
  t: (key: string) => string;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {channels.map((channel) => {
        const meta = channelLabels[channel];
        const Icon = meta.icon;
        return (
          <button
            key={channel}
            type="button"
            onClick={() => onChange(channel)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              active === channel
                ? 'bg-blue-600/10 text-blue-400'
                : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            {t(meta.labelKey)}
          </button>
        );
      })}
    </div>
  );
}

export function EmailMessagePreview({
  businessName,
  subject,
  bodyText,
  bodyHtml,
  t,
}: {
  businessName: string;
  subject: string;
  bodyText: string;
  bodyHtml: string;
  t: (key: string) => string;
}) {
  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-gray-800 bg-gray-950/80 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-800 bg-gray-900/80 space-y-1">
          <p className="text-[10px] uppercase tracking-wide text-gray-500">
            {t('notificationPreview.emailFrom')}
          </p>
          <p className="text-sm text-gray-200">{businessName}</p>
          <p className="text-[10px] uppercase tracking-wide text-gray-500 pt-1">
            {t('notificationPreview.emailSubject')}
          </p>
          <p className="text-sm font-medium text-gray-100 whitespace-pre-wrap">
            {subject.trim() || t('notificationPreview.emptyField')}
          </p>
        </div>
        <div className="p-4 space-y-3">
          <div>
            <p className="text-[10px] uppercase tracking-wide text-gray-500 mb-1">
              {t('notificationPreview.emailPlainBody')}
            </p>
            <p className="text-sm text-gray-200 whitespace-pre-wrap leading-relaxed">
              {bodyText.trim() || t('notificationPreview.emptyField')}
            </p>
          </div>
          <div className="border-t border-gray-800 pt-3">
            <p className="text-[10px] uppercase tracking-wide text-gray-500 mb-2">
              {t('notificationPreview.emailHtmlBody')}
            </p>
            <div
              className="rounded-md border border-gray-800 bg-white text-gray-900 p-4 text-sm prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{
                __html:
                  bodyHtml.trim() ||
                  `<p>${t('notificationPreview.emptyField')}</p>`,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export function PushMessagePreview({
  title,
  body,
  t,
}: {
  title: string;
  body: string;
  t: (key: string) => string;
}) {
  return (
    <div className="rounded-xl border border-gray-800 bg-gray-950 p-4 max-w-sm mx-auto">
      <p className="text-[10px] uppercase tracking-wide text-gray-500 mb-3 text-center">
        {t('notificationPreview.pushDeviceHint')}
      </p>
      <div className="rounded-2xl bg-gray-900 border border-gray-700 p-3 shadow-lg">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-600/20 border border-blue-500/30 shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-gray-100 truncate">
              {title.trim() || t('notificationPreview.emptyField')}
            </p>
            <p className="text-xs text-gray-400 mt-0.5 whitespace-pre-wrap line-clamp-4">
              {body.trim() || t('notificationPreview.emptyField')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function WhatsAppMessagePreview({
  businessName,
  preview,
  freeformBody,
  note,
  t,
}: {
  businessName: string;
  preview?: WhatsAppTemplatePreview | null;
  freeformBody?: string;
  note?: string;
  t: (key: string) => string;
}) {
  return (
    <div className="space-y-3">
      {note ? <p className="text-xs text-gray-500">{note}</p> : null}
      {preview ? (
        <div className="rounded-lg border border-gray-800 bg-gray-950/80 p-4 space-y-3">
          <div className="grid gap-2 text-xs">
            <div>
              <span className="text-gray-500">{t('notificationPreview.whatsAppTemplate')}:</span>{' '}
              <span className="font-mono text-gray-200">{preview.templateName}</span>
            </div>
            <div>
              <span className="text-gray-500">{t('notificationPreview.whatsAppLanguage')}:</span>{' '}
              <span className="font-mono text-gray-200">{preview.templateLanguage}</span>
            </div>
          </div>
          {preview.bodyParams.length > 0 ? (
            <div>
              <p className="text-[10px] uppercase tracking-wide text-gray-500 mb-2">
                {t('notificationPreview.whatsAppParams')}
              </p>
              <ol className="space-y-1 text-xs font-mono text-gray-300">
                {preview.bodyParams.map((param, index) => (
                  <li key={`${index}-${param}`} className="flex gap-2">
                    <span className="text-gray-500 shrink-0">{`{{${index + 1}}}`}</span>
                    <span>{param}</span>
                  </li>
                ))}
              </ol>
            </div>
          ) : null}
          <p className="text-xs text-gray-400">{preview.summary}</p>
        </div>
      ) : null}
      <div className="rounded-xl bg-[#0b141a] border border-[#1f2c34] p-4 max-w-sm mx-auto">
        <p className="text-[10px] uppercase tracking-wide text-[#8696a0] mb-3">
          {t('notificationPreview.whatsAppChatHint')}
        </p>
        <div className="flex justify-end">
          <div className="max-w-[85%] rounded-lg rounded-tr-none bg-[#005c4b] px-3 py-2 shadow">
            <p className="text-[10px] text-[#d1f4cc] mb-0.5">{businessName}</p>
            <p className="text-sm text-[#e9edef] whitespace-pre-wrap leading-relaxed">
              {freeformBody?.trim() || preview?.summary || t('notificationPreview.emptyField')}
            </p>
            <p className="text-[10px] text-[#8696a0] text-right mt-1">12:00</p>
          </div>
        </div>
      </div>
    </div>
  );
}
