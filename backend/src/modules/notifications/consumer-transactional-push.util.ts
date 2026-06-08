/** adopt-4.2 — consumer transactional push payloads (salon + clinic). */

import { t, type AppLocale } from '../../common/i18n/messages.js';

export type ConsumerTransactionalPushType =
  | 'result_ready'
  | 'lab_booking_request'
  | 'booking_confirmed'
  | 'booking_reminder'
  | 'booking_rescheduled'
  | 'booking_cancelled'
  | 'gift_card_received'
  | 'rebooking_nudge'
  | 'win_back'
  | 'activation_concierge'
  | 'catalog_announcement';

export interface ConsumerResultReadyPushPayload {
  pushType: 'result_ready';
  url: string;
  businessId: string;
  customerId: string;
  bookingId?: string;
  resultId: string;
  title: string;
  body: string;
  foregroundHint?: string;
}

export interface ConsumerLabBookingRequestPushPayload {
  pushType: 'lab_booking_request';
  url: string;
  businessId: string;
  customerId: string;
  orderId: string;
  collectionServiceId?: string;
  clinicOrderToken?: string;
  title: string;
  body: string;
  foregroundHint?: string;
}

export interface ConsumerSalonBookingPushPayload {
  pushType:
    | 'booking_confirmed'
    | 'booking_reminder'
    | 'booking_rescheduled'
    | 'booking_cancelled';
  url: string;
  businessId: string;
  customerId: string;
  bookingId: string;
  title: string;
  body: string;
  foregroundHint?: string;
  reminderMinutesBefore?: number;
}

export interface ConsumerGiftCardReceivedPushPayload {
  pushType: 'gift_card_received';
  url: string;
  businessId: string;
  customerId: string;
  giftCardId: string;
  title: string;
  body: string;
  foregroundHint?: string;
}

export interface ConsumerRebookingNudgePushPayload {
  pushType: 'rebooking_nudge';
  url: string;
  businessId: string;
  customerId: string;
  serviceId: string;
  title: string;
  body: string;
  foregroundHint?: string;
}

export interface ConsumerWinBackPushPayload {
  pushType: 'win_back';
  url: string;
  businessId: string;
  customerId: string;
  title: string;
  body: string;
  foregroundHint?: string;
  promoCode?: string;
}

export interface ConsumerActivationConciergePushPayload {
  pushType: 'activation_concierge';
  url: string;
  businessId: string;
  customerId: string;
  serviceId?: string;
  title: string;
  body: string;
  foregroundHint?: string;
}

export interface ConsumerCatalogAnnouncementPushPayload {
  pushType: 'catalog_announcement';
  url: string;
  businessId: string;
  customerId: string;
  title: string;
  body: string;
  foregroundHint?: string;
}

export type ConsumerTransactionalPushPayload =
  | ConsumerResultReadyPushPayload
  | ConsumerLabBookingRequestPushPayload
  | ConsumerSalonBookingPushPayload
  | ConsumerGiftCardReceivedPushPayload
  | ConsumerRebookingNudgePushPayload
  | ConsumerWinBackPushPayload
  | ConsumerActivationConciergePushPayload
  | ConsumerCatalogAnnouncementPushPayload;

function resolveServiceName(serviceName: string, locale: AppLocale): string {
  return serviceName.trim() || t(locale, 'email.defaultServiceName');
}

export function buildConsumerResultReadyPushPayload(input: {
  url: string;
  businessId: string;
  customerId: string;
  bookingId?: string | null;
  resultId: string;
  businessName: string;
  testName: string;
  locale: AppLocale;
}): ConsumerResultReadyPushPayload {
  const testName = resolveServiceName(input.testName, input.locale);
  return {
    pushType: 'result_ready',
    url: input.url,
    businessId: input.businessId,
    customerId: input.customerId,
    bookingId: input.bookingId ?? undefined,
    resultId: input.resultId,
    title: t(input.locale, 'email.clinicResultReadyPushTitle', {
      businessName: input.businessName,
    }),
    body: t(input.locale, 'email.clinicResultReadyPushBody', { testName }),
    foregroundHint: t(
      input.locale,
      'email.clinicResultReadyPushForegroundHint',
      { testName },
    ),
  };
}

export function buildConsumerLabBookingRequestPushPayload(input: {
  url: string;
  businessId: string;
  customerId: string;
  orderId: string;
  businessName: string;
  collectionServiceName: string;
  testNames: string;
  collectionServiceId?: string | null;
  clinicOrderToken?: string | null;
  locale: AppLocale;
}): ConsumerLabBookingRequestPushPayload {
  const collectionServiceName = resolveServiceName(
    input.collectionServiceName,
    input.locale,
  );
  const testNames = resolveServiceName(input.testNames, input.locale);
  return {
    pushType: 'lab_booking_request',
    url: input.url,
    businessId: input.businessId,
    customerId: input.customerId,
    orderId: input.orderId,
    collectionServiceId: input.collectionServiceId?.trim() || undefined,
    clinicOrderToken: input.clinicOrderToken?.trim() || undefined,
    title: t(input.locale, 'email.clinicLabBookingRequestPushTitle', {
      businessName: input.businessName,
    }),
    body: t(input.locale, 'email.clinicLabBookingRequestPushBody', {
      collectionServiceName,
      testNames,
    }),
    foregroundHint: t(
      input.locale,
      'email.clinicLabBookingRequestPushForegroundHint',
      { collectionServiceName },
    ),
  };
}

export function buildConsumerBookingConfirmedPushPayload(input: {
  url: string;
  businessId: string;
  customerId: string;
  bookingId: string;
  businessName: string;
  serviceName: string;
  scheduleLabel: string;
  locale: AppLocale;
}): ConsumerSalonBookingPushPayload {
  const serviceName = resolveServiceName(input.serviceName, input.locale);
  return {
    pushType: 'booking_confirmed',
    url: input.url,
    businessId: input.businessId,
    customerId: input.customerId,
    bookingId: input.bookingId,
    title: t(input.locale, 'email.bookingConfirmedPushTitle', {
      businessName: input.businessName,
    }),
    body: t(input.locale, 'email.bookingConfirmedPushBody', {
      serviceName,
      scheduleLabel: input.scheduleLabel,
    }),
    foregroundHint: t(input.locale, 'email.bookingConfirmedPushForegroundHint', {
      serviceName,
      scheduleLabel: input.scheduleLabel,
    }),
  };
}

export function buildConsumerBookingReminderPushPayload(input: {
  url: string;
  businessId: string;
  customerId: string;
  bookingId: string;
  businessName: string;
  serviceName: string;
  scheduleLabel: string;
  minutesBefore: number;
  locale: AppLocale;
}): ConsumerSalonBookingPushPayload {
  const serviceName = resolveServiceName(input.serviceName, input.locale);
  return {
    pushType: 'booking_reminder',
    url: input.url,
    businessId: input.businessId,
    customerId: input.customerId,
    bookingId: input.bookingId,
    reminderMinutesBefore: input.minutesBefore,
    title: t(input.locale, 'email.bookingReminderPushTitle', {
      businessName: input.businessName,
    }),
    body: t(input.locale, 'email.bookingReminderPushBody', {
      serviceName,
      scheduleLabel: input.scheduleLabel,
    }),
    foregroundHint: t(input.locale, 'email.bookingReminderPushForegroundHint', {
      serviceName,
      scheduleLabel: input.scheduleLabel,
    }),
  };
}

export function buildConsumerBookingRescheduledPushPayload(input: {
  url: string;
  businessId: string;
  customerId: string;
  bookingId: string;
  businessName: string;
  serviceName: string;
  scheduleLabel: string;
  locale: AppLocale;
}): ConsumerSalonBookingPushPayload {
  const serviceName = resolveServiceName(input.serviceName, input.locale);
  return {
    pushType: 'booking_rescheduled',
    url: input.url,
    businessId: input.businessId,
    customerId: input.customerId,
    bookingId: input.bookingId,
    title: t(input.locale, 'email.bookingRescheduledPushTitle', {
      businessName: input.businessName,
    }),
    body: t(input.locale, 'email.bookingRescheduledPushBody', {
      serviceName,
      scheduleLabel: input.scheduleLabel,
    }),
    foregroundHint: t(
      input.locale,
      'email.bookingRescheduledPushForegroundHint',
      { serviceName, scheduleLabel: input.scheduleLabel },
    ),
  };
}

export function buildConsumerBookingCancelledPushPayload(input: {
  url: string;
  businessId: string;
  customerId: string;
  bookingId: string;
  businessName: string;
  serviceName: string;
  scheduleLabel: string;
  locale: AppLocale;
}): ConsumerSalonBookingPushPayload {
  const serviceName = resolveServiceName(input.serviceName, input.locale);
  return {
    pushType: 'booking_cancelled',
    url: input.url,
    businessId: input.businessId,
    customerId: input.customerId,
    bookingId: input.bookingId,
    title: t(input.locale, 'email.bookingCancelledPushTitle', {
      businessName: input.businessName,
    }),
    body: t(input.locale, 'email.bookingCancelledPushBody', {
      serviceName,
      scheduleLabel: input.scheduleLabel,
    }),
    foregroundHint: t(
      input.locale,
      'email.bookingCancelledPushForegroundHint',
      { serviceName },
    ),
  };
}

export function buildConsumerGiftCardReceivedPushPayload(input: {
  url: string;
  businessId: string;
  customerId: string;
  giftCardId: string;
  businessName: string;
  senderName: string;
  locale: AppLocale;
}): ConsumerGiftCardReceivedPushPayload {
  return {
    pushType: 'gift_card_received',
    url: input.url,
    businessId: input.businessId,
    customerId: input.customerId,
    giftCardId: input.giftCardId,
    title: t(input.locale, 'email.giftCardReceivedPushTitle', {
      businessName: input.businessName,
    }),
    body: t(input.locale, 'email.giftCardReceivedPushBody', {
      senderName: input.senderName,
    }),
    foregroundHint: t(input.locale, 'email.giftCardReceivedPushForegroundHint', {
      senderName: input.senderName,
    }),
  };
}

export function buildConsumerRebookingNudgePushPayload(input: {
  url: string;
  businessId: string;
  customerId: string;
  serviceId: string;
  businessName: string;
  serviceName: string;
  cadenceLabel: string;
  locale: AppLocale;
}): ConsumerRebookingNudgePushPayload {
  const serviceName = resolveServiceName(input.serviceName, input.locale);
  return {
    pushType: 'rebooking_nudge',
    url: input.url,
    businessId: input.businessId,
    customerId: input.customerId,
    serviceId: input.serviceId,
    title: t(input.locale, 'email.rebookingNudgePushTitle', {
      businessName: input.businessName,
    }),
    body: t(input.locale, 'email.rebookingNudgePushBody', {
      serviceName,
      cadenceLabel: input.cadenceLabel,
    }),
    foregroundHint: t(input.locale, 'email.rebookingNudgePushForegroundHint', {
      serviceName,
    }),
  };
}

export function buildConsumerWinBackPushPayload(input: {
  url: string;
  businessId: string;
  customerId: string;
  businessName: string;
  promoCode?: string;
  locale: AppLocale;
}): ConsumerWinBackPushPayload {
  const promoLine = input.promoCode
    ? t(input.locale, 'email.winBackPromoLine', { promoCode: input.promoCode })
    : '';
  return {
    pushType: 'win_back',
    url: input.url,
    businessId: input.businessId,
    customerId: input.customerId,
    title: t(input.locale, 'email.winBackPushTitle', {
      businessName: input.businessName,
    }),
    body: t(input.locale, 'email.winBackPushBody', {
      businessName: input.businessName,
      promoLine,
    }),
    foregroundHint: t(input.locale, 'email.winBackPushForegroundHint', {
      businessName: input.businessName,
    }),
    promoCode: input.promoCode,
  };
}

export function buildConsumerActivationConciergePushPayload(input: {
  url: string;
  businessId: string;
  customerId: string;
  businessName: string;
  serviceName: string;
  milestone: '24h' | '72h';
  serviceId?: string;
  locale: AppLocale;
}): ConsumerActivationConciergePushPayload {
  const serviceName = resolveServiceName(input.serviceName, input.locale);
  const is24h = input.milestone === '24h';
  return {
    pushType: 'activation_concierge',
    url: input.url,
    businessId: input.businessId,
    customerId: input.customerId,
    serviceId: input.serviceId,
    title: t(
      input.locale,
      is24h
        ? 'email.activationConcierge24hPushTitle'
        : 'email.activationConcierge72hPushTitle',
      { businessName: input.businessName },
    ),
    body: t(
      input.locale,
      is24h
        ? 'email.activationConcierge24hPushBody'
        : 'email.activationConcierge72hPushBody',
      { businessName: input.businessName, serviceName },
    ),
    foregroundHint: t(
      input.locale,
      is24h
        ? 'email.activationConcierge24hPushForegroundHint'
        : 'email.activationConcierge72hPushForegroundHint',
      { serviceName },
    ),
  };
}

export function buildConsumerCatalogAnnouncementPushPayload(input: {
  url: string;
  businessId: string;
  customerId: string;
  title: string;
  body: string;
}): ConsumerCatalogAnnouncementPushPayload {
  const body = input.body.trim();
  return {
    pushType: 'catalog_announcement',
    url: input.url,
    businessId: input.businessId,
    customerId: input.customerId,
    title: input.title.trim() || 'Update',
    body: body.length > 180 ? `${body.slice(0, 177)}…` : body,
    foregroundHint: body,
  };
}

export interface ConsumerNativeFcmMessage {
  notification: { title: string; body: string };
  data: Record<string, string>;
}

export function buildConsumerNativeFcmMessage(
  payload: ConsumerTransactionalPushPayload,
): ConsumerNativeFcmMessage {
  return {
    notification: { title: payload.title, body: payload.body },
    data: toConsumerPushDataFields(payload),
  };
}

export {
  resolveConsumerPushAndroidChannelId,
  resolveConsumerPushPreferenceCategory,
} from '../../common/utils/n99-push-channel.util.js';

export function toConsumerPushDataFields(
  payload: ConsumerTransactionalPushPayload,
): Record<string, string> {
  const data: Record<string, string> = {
    pushType: payload.pushType,
    url: payload.url,
    businessId: payload.businessId,
    customerId: payload.customerId,
    title: payload.title,
    body: payload.body,
  };
  if (payload.foregroundHint) data.foregroundHint = payload.foregroundHint;

  if (payload.pushType === 'result_ready') {
    data.resultId = payload.resultId;
    if (payload.bookingId) data.bookingId = payload.bookingId;
    return data;
  }

  if (payload.pushType === 'lab_booking_request') {
    data.orderId = payload.orderId;
    if (payload.collectionServiceId) {
      data.collectionServiceId = payload.collectionServiceId;
    }
    if (payload.clinicOrderToken) {
      data.clinicOrderToken = payload.clinicOrderToken;
    }
    return data;
  }

  if (payload.pushType === 'gift_card_received') {
    data.giftCardId = payload.giftCardId;
    return data;
  }

  if (payload.pushType === 'rebooking_nudge') {
    data.serviceId = payload.serviceId;
    return data;
  }

  if (payload.pushType === 'activation_concierge') {
    if (payload.serviceId) data.serviceId = payload.serviceId;
    return data;
  }

  if (payload.pushType === 'win_back') {
    if (payload.promoCode) data.promoCode = payload.promoCode;
    return data;
  }

  if (payload.pushType === 'catalog_announcement') {
    return data;
  }

  if ('bookingId' in payload) {
    data.bookingId = payload.bookingId;
    if (
      'reminderMinutesBefore' in payload &&
      payload.reminderMinutesBefore != null
    ) {
      data.reminderMinutesBefore = String(payload.reminderMinutesBefore);
    }
  }
  return data;
}

export function isSalonBookingPushType(
  pushType: ConsumerTransactionalPushType,
): pushType is ConsumerSalonBookingPushPayload['pushType'] {
  return (
    pushType === 'booking_confirmed' ||
    pushType === 'booking_reminder' ||
    pushType === 'booking_rescheduled' ||
    pushType === 'booking_cancelled'
  );
}
