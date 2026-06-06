import type { AppLocale } from '../../common/i18n/messages.js';
import type {
  NotificationEmailTemplateKey,
  NotificationEmailTemplateVariable,
  ResolvedEmailTemplate,
  TenantEmailTemplateOverride,
} from './notification-email-template.types.js';
import { getLocalizedEmailTemplateContent } from './notification-email-template.defaults.i18n.js';

export interface EmailTemplateDefinition {
  key: NotificationEmailTemplateKey;
  label: string;
  description: string;
  subject: string;
  bodyText: string;
  bodyHtml: string;
  variables: NotificationEmailTemplateVariable[];
}

const COMMON_BOOKING_VARS: NotificationEmailTemplateVariable[] = [
  {
    key: 'customerName',
    label: 'Customer name',
    description: 'Recipient first name or "there"',
    sampleValue: 'Alex',
  },
  {
    key: 'businessName',
    label: 'Business name',
    description: 'Your salon or clinic name',
    sampleValue: 'Glow Salon',
  },
  {
    key: 'serviceName',
    label: 'Service name',
    description: 'Booked service',
    sampleValue: 'Haircut',
  },
  {
    key: 'providerName',
    label: 'Provider name',
    description: 'Staff member name',
    sampleValue: 'Jane Doe',
  },
  {
    key: 'dateLabel',
    label: 'Date',
    description: 'Appointment date',
    sampleValue: '03/06/2026',
  },
  {
    key: 'timeLabel',
    label: 'Time',
    description: 'Appointment time range',
    sampleValue: '14:00–14:30',
  },
  {
    key: 'priceLineText',
    label: 'Price line (plain text)',
    description:
      'Formatted service or paid amount with business currency symbol',
    sampleValue: '\nPrice: $45',
  },
  {
    key: 'priceLineHtml',
    label: 'Price line (HTML)',
    description: 'HTML price line with business currency symbol',
    sampleValue: '<br/>Price: $45',
  },
  {
    key: 'manageLinkText',
    label: 'Manage link (plain text)',
    description: 'Reschedule/cancel line for text email',
    sampleValue: 'Manage your booking: https://…',
  },
  {
    key: 'manageLinkHtml',
    label: 'Manage link (HTML)',
    description: 'Underlined "here" link for HTML email',
    sampleValue: '<a href="…">here</a>',
  },
  {
    key: 'footerNote',
    label: 'Footer note',
    description: 'Custom closing line (tenant variable)',
    sampleValue: 'See you soon!',
  },
];

export const EMAIL_TEMPLATE_DEFINITIONS: EmailTemplateDefinition[] = [
  {
    key: 'booking_confirmation',
    label: 'Booking confirmation',
    description: 'Sent when a single appointment is confirmed.',
    subject: 'Confirmed: {{serviceName}} at {{businessName}}',
    bodyText:
      'Hi {{customerName}},\n\nYour appointment at {{businessName}} is confirmed.\n\n{{serviceName}} with {{providerName}}\n{{dateLabel}} · {{timeLabel}}{{priceLineText}}{{manageLinkText}}\n\n{{footerNote}}',
    bodyHtml:
      '<p>Hi {{customerName}},</p><p>Your appointment at {{businessName}} is confirmed.</p><p>{{serviceName}} with {{providerName}}<br/>{{dateLabel}} · {{timeLabel}}{{priceLineHtml}}{{manageLinkHtml}}</p><p>{{footerNote}}</p>',
    variables: COMMON_BOOKING_VARS,
  },
  {
    key: 'booking_confirmation_grouped',
    label: 'Multi-appointment confirmation',
    description: 'Sent when a package or multi-service booking is confirmed.',
    subject:
      'Confirmed: {{appointmentCount}} {{appointmentWord}} at {{businessName}}',
    bodyText:
      'Hi {{customerName}},\n\nYour {{appointmentWord}} at {{businessName}} are confirmed{{groupLabelSuffix}}.\n\n{{appointmentsListText}}\n\n{{footerNote}}',
    bodyHtml:
      '<p>Hi {{customerName}},</p><p>Your {{appointmentWord}} at {{businessName}} are confirmed{{groupLabelSuffix}}.</p>{{appointmentsListHtml}}<p>{{footerNote}}</p>',
    variables: [
      ...COMMON_BOOKING_VARS.filter(
        (v) =>
          ![
            'serviceName',
            'providerName',
            'dateLabel',
            'timeLabel',
            'manageLinkText',
            'manageLinkHtml',
          ].includes(v.key),
      ),
      {
        key: 'appointmentCount',
        label: 'Appointment count',
        description: 'Number of visits',
        sampleValue: '3',
      },
      {
        key: 'appointmentWord',
        label: 'Appointment word',
        description: '"appointment" or "appointments"',
        sampleValue: 'appointments',
      },
      {
        key: 'groupLabelSuffix',
        label: 'Group label suffix',
        description: ' e.g. " (Package name)" or empty',
        sampleValue: ' (Summer package)',
      },
      {
        key: 'appointmentsListText',
        label: 'Appointments list (text)',
        description: 'Bullet list of all visits',
        sampleValue: '• Haircut with Jane…',
      },
      {
        key: 'appointmentsListHtml',
        label: 'Appointments list (HTML)',
        description: 'HTML list of all visits',
        sampleValue: '<ul><li>…</li></ul>',
      },
    ],
  },
  {
    key: 'booking_reminder',
    label: 'Appointment reminder',
    description: 'Sent before an upcoming appointment.',
    subject: 'Reminder: appointment in {{reminderLabel}} — {{businessName}}',
    bodyText:
      'Reminder: your appointment at {{businessName}} is in {{reminderLabel}}.\n\n{{serviceName}} with {{providerName}}\n{{dateLabel}} · {{timeLabel}}{{priceLineText}}',
    bodyHtml:
      '<p>Reminder: your appointment at {{businessName}} is in {{reminderLabel}}.</p><p>{{serviceName}} with {{providerName}}<br/>{{dateLabel}} · {{timeLabel}}{{priceLineHtml}}</p>',
    variables: [
      ...COMMON_BOOKING_VARS.filter(
        (v) =>
          v.key !== 'manageLinkText' &&
          v.key !== 'manageLinkHtml' &&
          v.key !== 'footerNote',
      ),
      {
        key: 'reminderLabel',
        label: 'Reminder window',
        description: 'e.g. "24 hours" or "1 hour"',
        sampleValue: '24 hours',
      },
    ],
  },
  {
    key: 'booking_cancellation',
    label: 'Booking cancellation',
    description: 'Sent when an appointment is cancelled.',
    subject: 'Cancelled: {{serviceName}} at {{businessName}}',
    bodyText:
      'Hi {{customerName}},\n\nYour appointment at {{businessName}} has been cancelled.\n\n{{serviceName}} on {{dateLabel}} · {{timeLabel}}\nReason: {{cancelReason}}\n\nContact us to rebook.',
    bodyHtml:
      '<p>Hi {{customerName}},</p><p>Your appointment at {{businessName}} has been cancelled.</p><p>{{serviceName}} on {{dateLabel}} · {{timeLabel}}<br/>Reason: {{cancelReason}}</p><p>Contact us to rebook.</p>',
    variables: [
      ...COMMON_BOOKING_VARS.filter(
        (v) =>
          v.key !== 'manageLinkText' &&
          v.key !== 'manageLinkHtml' &&
          v.key !== 'footerNote',
      ),
      {
        key: 'cancelReason',
        label: 'Cancellation reason',
        description: 'Why the visit was cancelled',
        sampleValue: 'Customer request',
      },
    ],
  },
  {
    key: 'review_request',
    label: 'Review request',
    description: 'Sent after a completed visit asking for feedback.',
    subject: 'How was your visit at {{businessName}}?',
    bodyText:
      'Hi {{customerName}},\n\nThank you for visiting {{businessName}}! How was your appointment with {{providerName}}?\n\nLeave a review: {{reviewUrl}}',
    bodyHtml:
      '<p>Hi {{customerName}},</p><p>Thank you for visiting <strong>{{businessName}}</strong>! How was your appointment with {{providerName}}?</p><p><a href="{{reviewUrl}}">Leave a review</a></p>{{starRatingHtml}}',
    variables: [
      {
        key: 'customerName',
        label: 'Customer name',
        description: 'Recipient name',
        sampleValue: 'Alex',
      },
      {
        key: 'businessName',
        label: 'Business name',
        description: 'Your business name',
        sampleValue: 'Glow Salon',
      },
      {
        key: 'providerName',
        label: 'Provider name',
        description: 'Staff member name',
        sampleValue: 'Jane Doe',
      },
      {
        key: 'reviewUrl',
        label: 'Review URL',
        description: 'Link to leave a review',
        sampleValue: 'https://app.example.com/book/salon/review?…',
      },
      {
        key: 'starRatingHtml',
        label: 'Star rating buttons (HTML)',
        description: 'Optional star links block',
        sampleValue: '<div>★★★★★</div>',
      },
    ],
  },
  {
    key: 'gift_card_recipient',
    label: 'Gift card — recipient',
    description: 'Sent to the gift card recipient.',
    subject: 'Your gift card from {{senderName}} for {{businessName}}',
    bodyText:
      "Hi {{recipientName}},\n\nYou've received a gift card from {{senderName}} for {{businessName}} services!\n\n{{personalMessageSection}}Your gift card code: {{giftCardCode}}\n\n{{giftCardDetails}}\n\n{{redemptionInstructions}}",
    bodyHtml:
      "<p>Hi {{recipientName}},</p><p>You've received a gift card from {{senderName}} for {{businessName}} services!</p>{{personalMessageHtml}}<p><strong>Your gift card code:</strong> <code>{{giftCardCode}}</code></p>{{giftCardDetailsHtml}}{{redemptionInstructionsHtml}}",
    variables: [
      {
        key: 'recipientName',
        label: 'Recipient name',
        description: 'Gift recipient',
        sampleValue: 'Sam',
      },
      {
        key: 'senderName',
        label: 'Sender name',
        description: 'Person who bought the gift',
        sampleValue: 'Jane Doe',
      },
      {
        key: 'businessName',
        label: 'Business name',
        description: 'Your business name',
        sampleValue: 'Glow Salon',
      },
      {
        key: 'giftCardCode',
        label: 'Gift card code',
        description: 'Redemption code',
        sampleValue: 'GCM-ABC123',
      },
      {
        key: 'personalMessageSection',
        label: 'Personal message (text)',
        description: 'Sender message block or empty',
        sampleValue: 'Message from the sender:\nEnjoy!\n',
      },
      {
        key: 'personalMessageHtml',
        label: 'Personal message (HTML)',
        description: 'Sender message HTML or empty',
        sampleValue: '<p><strong>Message:</strong> Enjoy!</p>',
      },
      {
        key: 'giftCardDetails',
        label: 'Gift details (text)',
        description: 'Balance or service credits',
        sampleValue: 'Balance: $50',
      },
      {
        key: 'giftCardDetailsHtml',
        label: 'Gift details (HTML)',
        description: 'HTML list of gift value',
        sampleValue: '<ul><li>Balance: $50</li></ul>',
      },
      {
        key: 'redemptionInstructions',
        label: 'Redemption (text)',
        description: 'How to redeem',
        sampleValue: 'Book here: https://…',
      },
      {
        key: 'redemptionInstructionsHtml',
        label: 'Redemption (HTML)',
        description: 'HTML redemption steps',
        sampleValue: '<p><a href="…">Book an appointment</a></p>',
      },
    ],
  },
  {
    key: 'gift_card_purchaser_receipt',
    label: 'Gift card — purchaser receipt',
    description:
      'Sent to the buyer when the gift is delivered to someone else.',
    subject: 'Gift card sent — {{businessName}}',
    bodyText:
      'Your gift card order from {{businessName}} was sent to {{recipientEmail}}.\n\n{{purchaseLineText}}{{accountLinksText}}',
    bodyHtml:
      '<p>Your gift card order from <strong>{{businessName}}</strong> was sent to {{recipientEmail}}.</p>{{purchaseLineHtml}}{{accountLinksHtml}}',
    variables: [
      {
        key: 'businessName',
        label: 'Business name',
        description: 'Your business name',
        sampleValue: 'Glow Salon',
      },
      {
        key: 'recipientEmail',
        label: 'Recipient email',
        description: 'Where the gift was sent',
        sampleValue: 'friend@example.com',
      },
      {
        key: 'purchaseLineText',
        label: 'Purchase amount (text)',
        description: 'Formatted purchase total with business currency symbol',
        sampleValue: 'Amount paid: $50\n\n',
      },
      {
        key: 'purchaseLineHtml',
        label: 'Purchase amount (HTML)',
        description: 'HTML purchase total with business currency symbol',
        sampleValue: '<p>Amount paid: $50</p>',
      },
      {
        key: 'accountLinksText',
        label: 'Account links (text)',
        description: 'Links to account/booking',
        sampleValue: 'View orders: https://…',
      },
      {
        key: 'accountLinksHtml',
        label: 'Account links (HTML)',
        description: 'HTML account links',
        sampleValue: '<p><a href="…">View orders</a></p>',
      },
    ],
  },
];

export function getEmailTemplateDefinition(
  key: NotificationEmailTemplateKey,
): EmailTemplateDefinition {
  const def = EMAIL_TEMPLATE_DEFINITIONS.find((t) => t.key === key);
  if (!def) throw new Error(`Unknown email template: ${key}`);
  return def;
}

export function resolveEmailTemplate(
  key: NotificationEmailTemplateKey,
  override?: TenantEmailTemplateOverride | null,
  locale: AppLocale = 'en',
): ResolvedEmailTemplate {
  const def = getEmailTemplateDefinition(key);
  const localized = getLocalizedEmailTemplateContent(key, locale);
  const localeOverride = override?.locales?.[locale];
  const enabled = override?.enabled !== false;
  const subject =
    localeOverride?.subject?.trim() ||
    override?.subject?.trim() ||
    localized?.subject ||
    def.subject;
  const bodyText =
    localeOverride?.bodyText?.trim() ||
    override?.bodyText?.trim() ||
    localized?.bodyText ||
    def.bodyText;
  const bodyHtml =
    localeOverride?.bodyHtml?.trim() ||
    override?.bodyHtml?.trim() ||
    localized?.bodyHtml ||
    def.bodyHtml;
  const isCustomized = Boolean(
    override &&
    (override.subject?.trim() ||
      override.bodyText?.trim() ||
      override.bodyHtml?.trim() ||
      Object.values(override.locales ?? {}).some(
        (entry) =>
          entry?.subject?.trim() ||
          entry?.bodyText?.trim() ||
          entry?.bodyHtml?.trim(),
      ) ||
      override.enabled === false),
  );

  return {
    key: def.key,
    label: def.label,
    description: def.description,
    enabled,
    isCustomized,
    subject,
    bodyText,
    bodyHtml,
    variables: def.variables,
  };
}
