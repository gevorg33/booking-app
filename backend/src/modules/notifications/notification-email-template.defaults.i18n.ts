import type { AppLocale } from '../../common/i18n/messages.js';
import type { NotificationEmailTemplateKey } from './notification-email-template.types.js';

export interface LocalizedEmailTemplateContent {
  subject: string;
  bodyText: string;
  bodyHtml: string;
}

const hy: Partial<
  Record<NotificationEmailTemplateKey, LocalizedEmailTemplateContent>
> = {
  booking_confirmation: {
    subject: 'Հաստատված՝ {{serviceName}} {{businessName}}-ում',
    bodyText:
      'Բարև {{customerName}},\n\nՁեր հանդիպումը {{businessName}}-ում հաստատված է։\n\n{{serviceName}} {{providerName}}-ի հետ\n{{dateLabel}} · {{timeLabel}}{{manageLinkText}}\n\n{{footerNote}}',
    bodyHtml:
      '<p>Բարև {{customerName}},</p><p>Ձեր հանդիպումը {{businessName}}-ում հաստատված է։</p><p>{{serviceName}} {{providerName}}-ի հետ<br/>{{dateLabel}} · {{timeLabel}}{{manageLinkHtml}}</p><p>{{footerNote}}</p>',
  },
  booking_confirmation_grouped: {
    subject:
      'Հաստատված՝ {{appointmentCount}} {{appointmentWord}} {{businessName}}-ում',
    bodyText:
      'Բարև {{customerName}},\n\nՁեր {{appointmentWord}}-ը {{businessName}}-ում հաստատված են{{groupLabelSuffix}}.\n\n{{appointmentsListText}}\n\n{{footerNote}}',
    bodyHtml:
      '<p>Բարև {{customerName}},</p><p>Ձեր {{appointmentWord}}-ը {{businessName}}-ում հաստատված են{{groupLabelSuffix}}.</p>{{appointmentsListHtml}}<p>{{footerNote}}</p>',
  },
  booking_reminder: {
    subject: 'Հիշեցում՝ հանդիպումը {{reminderLabel}}-ում է — {{businessName}}',
    bodyText:
      'Հիշեցում՝ ձեր հանդիպումը {{businessName}}-ում {{reminderLabel}}-ում է։\n\n{{serviceName}} {{providerName}}-ի հետ\n{{dateLabel}} · {{timeLabel}}',
    bodyHtml:
      '<p>Հիշեցում՝ ձեր հանդիպումը {{businessName}}-ում {{reminderLabel}}-ում է։</p><p>{{serviceName}} {{providerName}}-ի հետ<br/>{{dateLabel}} · {{timeLabel}}</p>',
  },
  booking_cancellation: {
    subject: 'Չեղարկված՝ {{serviceName}} {{businessName}}-ում',
    bodyText:
      'Բարև {{customerName}},\n\nՁեր հանդիպումը {{businessName}}-ում չեղարկվել է։\n\n{{serviceName}} {{dateLabel}} · {{timeLabel}}\nՊատճառ՝ {{cancelReason}}\n\nԿապվեք մեզ հետ՝ նորից ամրագրելու համար։',
    bodyHtml:
      '<p>Բարև {{customerName}},</p><p>Ձեր հանդիպումը {{businessName}}-ում չեղարկվել է։</p><p>{{serviceName}} {{dateLabel}} · {{timeLabel}}<br/>Պատճառ՝ {{cancelReason}}</p><p>Կապվեք մեզ հետ՝ նորից ամրագրելու համար։</p>',
  },
  review_request: {
    subject: 'Ինչպե՞ս էր ձեր այցը {{businessName}}-ում',
    bodyText:
      'Բարև {{customerName}},\n\nՇնորհակալություն {{businessName}} այցելելու համար։ Ինչպե՞ս էր հանդիպումը {{providerName}}-ի հետ։\n\nԹողեք կարծիք՝ {{reviewUrl}}',
    bodyHtml:
      '<p>Բարև {{customerName}},</p><p>Շնորհակալություն <strong>{{businessName}}</strong> այցելելու համար։ Ինչպե՞ս էր հանդիպումը {{providerName}}-ի հետ։</p><p><a href="{{reviewUrl}}">Թողնել կարծիք</a></p>{{starRatingHtml}}',
  },
  gift_card_recipient: {
    subject: 'Ձեր նվեր քարտը {{senderName}}-ից՝ {{businessName}}',
    bodyText:
      'Բարև {{recipientName}},\n\nԴուք նվեր քարտ եք ստացել {{senderName}}-ից {{businessName}} ծառայությունների համար։\n\n{{personalMessageSection}}Ձեր նվեր քարտի կոդը՝ {{giftCardCode}}\n\n{{giftCardDetails}}\n\n{{redemptionInstructions}}',
    bodyHtml:
      '<p>Բարև {{recipientName}},</p><p>Դուք նվեր քարտ եք ստացել {{senderName}}-ից {{businessName}} ծառայությունների համար։</p>{{personalMessageHtml}}<p><strong>Ձեր նվեր քարտի կոդը՝</strong> <code>{{giftCardCode}}</code></p>{{giftCardDetailsHtml}}{{redemptionInstructionsHtml}}',
  },
  gift_card_purchaser_receipt: {
    subject: 'Նվեր քարտը ուղարկված է — {{businessName}}',
    bodyText:
      'Ձեր նվեր քարտի պատվերը {{businessName}}-ից ուղարկվել է {{recipientEmail}} հասցեին։\n\n{{accountLinksText}}',
    bodyHtml:
      '<p>Ձեր նվեր քարտի պատվերը <strong>{{businessName}}</strong>-ից ուղարկվել է {{recipientEmail}} հասցեին։</p>{{accountLinksHtml}}',
  },
};

const ru: Partial<
  Record<NotificationEmailTemplateKey, LocalizedEmailTemplateContent>
> = {
  booking_confirmation: {
    subject: 'Подтверждено: {{serviceName}} в {{businessName}}',
    bodyText:
      'Здравствуйте, {{customerName}}!\n\nВаша запись в {{businessName}} подтверждена.\n\n{{serviceName}} у {{providerName}}\n{{dateLabel}} · {{timeLabel}}{{manageLinkText}}\n\n{{footerNote}}',
    bodyHtml:
      '<p>Здравствуйте, {{customerName}}!</p><p>Ваша запись в {{businessName}} подтверждена.</p><p>{{serviceName}} у {{providerName}}<br/>{{dateLabel}} · {{timeLabel}}{{manageLinkHtml}}</p><p>{{footerNote}}</p>',
  },
  booking_confirmation_grouped: {
    subject:
      'Подтверждено: {{appointmentCount}} {{appointmentWord}} в {{businessName}}',
    bodyText:
      'Здравствуйте, {{customerName}}!\n\nВаши {{appointmentWord}} в {{businessName}} подтверждены{{groupLabelSuffix}}.\n\n{{appointmentsListText}}\n\n{{footerNote}}',
    bodyHtml:
      '<p>Здравствуйте, {{customerName}}!</p><p>Ваши {{appointmentWord}} в {{businessName}} подтверждены{{groupLabelSuffix}}.</p>{{appointmentsListHtml}}<p>{{footerNote}}</p>',
  },
  booking_reminder: {
    subject: 'Напоминание: запись через {{reminderLabel}} — {{businessName}}',
    bodyText:
      'Напоминание: ваша запись в {{businessName}} через {{reminderLabel}}.\n\n{{serviceName}} у {{providerName}}\n{{dateLabel}} · {{timeLabel}}',
    bodyHtml:
      '<p>Напоминание: ваша запись в {{businessName}} через {{reminderLabel}}.</p><p>{{serviceName}} у {{providerName}}<br/>{{dateLabel}} · {{timeLabel}}</p>',
  },
  booking_cancellation: {
    subject: 'Отменено: {{serviceName}} в {{businessName}}',
    bodyText:
      'Здравствуйте, {{customerName}}!\n\nВаша запись в {{businessName}} отменена.\n\n{{serviceName}} {{dateLabel}} · {{timeLabel}}\nПричина: {{cancelReason}}\n\nСвяжитесь с нами, чтобы записаться снова.',
    bodyHtml:
      '<p>Здравствуйте, {{customerName}}!</p><p>Ваша запись в {{businessName}} отменена.</p><p>{{serviceName}} {{dateLabel}} · {{timeLabel}}<br/>Причина: {{cancelReason}}</p><p>Свяжитесь с нами, чтобы записаться снова.</p>',
  },
  review_request: {
    subject: 'Как прошёл визит в {{businessName}}?',
    bodyText:
      'Здравствуйте, {{customerName}}!\n\nСпасибо, что посетили {{businessName}}! Как прошла запись у {{providerName}}?\n\nОставить отзыв: {{reviewUrl}}',
    bodyHtml:
      '<p>Здравствуйте, {{customerName}}!</p><p>Спасибо, что посетили <strong>{{businessName}}</strong>! Как прошла запись у {{providerName}}?</p><p><a href="{{reviewUrl}}">Оставить отзыв</a></p>{{starRatingHtml}}',
  },
  gift_card_recipient: {
    subject: 'Подарочная карта от {{senderName}} для {{businessName}}',
    bodyText:
      'Здравствуйте, {{recipientName}}!\n\nВы получили подарочную карту от {{senderName}} на услуги {{businessName}}.\n\n{{personalMessageSection}}Код карты: {{giftCardCode}}\n\n{{giftCardDetails}}\n\n{{redemptionInstructions}}',
    bodyHtml:
      '<p>Здравствуйте, {{recipientName}}!</p><p>Вы получили подарочную карту от {{senderName}} на услуги {{businessName}}.</p>{{personalMessageHtml}}<p><strong>Код карты:</strong> <code>{{giftCardCode}}</code></p>{{giftCardDetailsHtml}}{{redemptionInstructionsHtml}}',
  },
  gift_card_purchaser_receipt: {
    subject: 'Подарочная карта отправлена — {{businessName}}',
    bodyText:
      'Ваш заказ подарочной карты в {{businessName}} отправлен на {{recipientEmail}}.\n\n{{accountLinksText}}',
    bodyHtml:
      '<p>Ваш заказ подарочной карты в <strong>{{businessName}}</strong> отправлен на {{recipientEmail}}.</p>{{accountLinksHtml}}',
  },
};

const BY_LOCALE: Partial<
  Record<
    AppLocale,
    Partial<Record<NotificationEmailTemplateKey, LocalizedEmailTemplateContent>>
  >
> = {
  hy,
  ru,
};

export function getLocalizedEmailTemplateContent(
  key: NotificationEmailTemplateKey,
  locale: AppLocale,
): LocalizedEmailTemplateContent | null {
  if (locale === 'en') return null;
  return BY_LOCALE[locale]?.[key] ?? null;
}
