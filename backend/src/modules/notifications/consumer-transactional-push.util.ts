/** adopt-4.2 — consumer transactional push payloads (result-ready + lab booking request). */

import { t, type AppLocale } from '../../common/i18n/messages.js';

export type ConsumerTransactionalPushType =
  | 'result_ready'
  | 'lab_booking_request';

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

export type ConsumerTransactionalPushPayload =
  | ConsumerResultReadyPushPayload
  | ConsumerLabBookingRequestPushPayload;

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
  const testName =
    input.testName.trim() || t(input.locale, 'email.defaultServiceName');
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
      {
        testName,
      },
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
  const collectionServiceName =
    input.collectionServiceName.trim() ||
    t(input.locale, 'email.defaultServiceName');
  const testNames =
    input.testNames.trim() || t(input.locale, 'email.defaultServiceName');
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

export interface ConsumerNativeFcmMessage {
  notification: { title: string; body: string };
  data: Record<string, string>;
}

/** FCM/APNs message shape for adopt-4.1.clinic delivery. */
export function buildConsumerNativeFcmMessage(
  payload: ConsumerTransactionalPushPayload,
): ConsumerNativeFcmMessage {
  return {
    notification: { title: payload.title, body: payload.body },
    data: toConsumerPushDataFields(payload),
  };
}

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

  data.orderId = payload.orderId;
  if (payload.collectionServiceId) {
    data.collectionServiceId = payload.collectionServiceId;
  }
  if (payload.clinicOrderToken) {
    data.clinicOrderToken = payload.clinicOrderToken;
  }
  return data;
}
