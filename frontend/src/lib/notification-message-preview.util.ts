import type { EmailTemplateKey } from '@/components/dashboard/notification-email-templates-panel';

export type NotificationPreviewChannel = 'email' | 'push' | 'whatsapp';

export interface NotificationTemplateVariable {
  key: string;
  sampleValue: string;
}

export interface RenderedNotificationPreview {
  subject: string;
  bodyText: string;
  bodyHtml: string;
}

export interface WhatsAppTemplatePreview {
  templateName: string;
  templateLanguage: string;
  bodyParams: string[];
  summary: string;
}

const WHATSAPP_BOOKING_TEMPLATE_KEYS = new Set<EmailTemplateKey>([
  'booking_confirmation',
  'booking_confirmation_grouped',
  'booking_reminder',
  'booking_cancellation',
]);

export function renderNotificationTemplateString(
  template: string,
  variables: Record<string, string>,
): string {
  return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (_match, key: string) => {
    return variables[key] ?? '';
  });
}

export function buildNotificationPreviewVariables(
  variables: readonly NotificationTemplateVariable[],
  customDefaults: Record<string, string> = {},
): Record<string, string> {
  const result: Record<string, string> = { ...customDefaults };
  for (const variable of variables) {
    if (variable.key) {
      result[variable.key] = variable.sampleValue;
    }
  }
  return result;
}

export function renderNotificationMessagePreview(
  subject: string,
  bodyText: string,
  bodyHtml: string,
  variables: Record<string, string>,
): RenderedNotificationPreview {
  return {
    subject: renderNotificationTemplateString(subject, variables),
    bodyText: renderNotificationTemplateString(bodyText, variables),
    bodyHtml: renderNotificationTemplateString(bodyHtml, variables),
  };
}

export function plainTextToEmailHtml(bodyText: string): string {
  return `<p>${escapeHtml(bodyText).replace(/\n/g, '<br/>')}</p>`;
}

export function resolveEmailHtmlPreview(
  rendered: RenderedNotificationPreview,
): string {
  const html = rendered.bodyHtml.trim();
  if (html) return html;
  return plainTextToEmailHtml(rendered.bodyText);
}

export function emailSupportsWhatsAppPreview(templateKey: EmailTemplateKey): boolean {
  return WHATSAPP_BOOKING_TEMPLATE_KEYS.has(templateKey);
}

export function buildWhatsAppBookingTemplatePreview(
  templateKey: EmailTemplateKey,
  variables: Record<string, string>,
  whatsapp: {
    templateConfirmation: string;
    templateReminder: string;
    templateLanguage: string;
  },
): WhatsAppTemplatePreview | null {
  if (!emailSupportsWhatsAppPreview(templateKey)) return null;

  const customerName = variables.customerName || 'Alex';
  const businessName = variables.businessName || 'Glow Salon';
  const serviceName = variables.serviceName || 'Haircut';
  const dateLabel = variables.dateLabel || variables.appointmentDate || 'Friday, Jun 12';
  const timeLabel = variables.timeLabel || variables.appointmentTime || '2:00 PM';
  const reminderLabel = variables.reminderLabel || 'in 24 hours';

  if (
    templateKey === 'booking_confirmation' ||
    templateKey === 'booking_confirmation_grouped'
  ) {
    const bodyParams = [customerName, serviceName, businessName, `${dateLabel} ${timeLabel}`];
    return {
      templateName: whatsapp.templateConfirmation,
      templateLanguage: whatsapp.templateLanguage,
      bodyParams,
      summary: `${businessName}: ${serviceName} on ${dateLabel} ${timeLabel}`,
    };
  }

  if (templateKey === 'booking_cancellation') {
    const detail = `${serviceName} on ${dateLabel} ${timeLabel}. Reason: Cancelled`;
    return {
      templateName: whatsapp.templateReminder,
      templateLanguage: whatsapp.templateLanguage,
      bodyParams: [customerName, businessName, detail],
      summary: `${businessName}: ${detail}`,
    };
  }

  return {
    templateName: whatsapp.templateReminder,
    templateLanguage: whatsapp.templateLanguage,
    bodyParams: [customerName, businessName, reminderLabel],
    summary: `${businessName}: ${serviceName} ${reminderLabel}`,
  };
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
