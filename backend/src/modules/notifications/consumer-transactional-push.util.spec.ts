import { t } from '../../common/i18n/messages.js';
import {
  buildConsumerBookingCancelledPushPayload,
  buildConsumerBookingConfirmedPushPayload,
  buildConsumerBookingReminderPushPayload,
  buildConsumerBookingRescheduledPushPayload,
  buildConsumerProviderVisitStatusPushPayload,
  buildConsumerGiftCardReceivedPushPayload,
  buildConsumerActivationConciergePushPayload,
  buildConsumerRebookingNudgePushPayload,
  buildConsumerWinBackPushPayload,
  buildConsumerLabBookingRequestPushPayload,
  buildConsumerNativeFcmMessage,
  buildConsumerResultReadyPushPayload,
  resolveConsumerPushAndroidChannelId,
  isSalonBookingPushType,
  toConsumerPushDataFields,
} from './consumer-transactional-push.util.js';

describe('consumer-transactional-push.util', () => {
  it('builds result-ready push payload with deep link', () => {
    const payload = buildConsumerResultReadyPushPayload({
      url: 'optischedule://book/city-clinic/results',
      businessId: 'biz-1',
      customerId: 'cust-1',
      bookingId: 'booking-1',
      resultId: 'result-1',
      businessName: 'City Clinic',
      testName: 'CBC',
      locale: 'en',
    });

    expect(payload.pushType).toBe('result_ready');
    expect(payload.url).toContain('/results');
    expect(payload.title).toBe(
      t('en', 'email.clinicResultReadyPushTitle', {
        businessName: 'City Clinic',
      }),
    );
    expect(payload.body).toBe(
      t('en', 'email.clinicResultReadyPushBody', { testName: 'CBC' }),
    );
    expect(toConsumerPushDataFields(payload)).toMatchObject({
      pushType: 'result_ready',
      resultId: 'result-1',
      bookingId: 'booking-1',
    });
  });

  it.each([
    ['hy', 'Yerevan Clinic', 'CBC'],
    ['ru', 'Moscow Clinic', 'CBC'],
  ] as const)(
    'localizes result-ready push copy for %s',
    (locale, businessName, testName) => {
      const payload = buildConsumerResultReadyPushPayload({
        url: 'optischedule://book/city-clinic/results',
        businessId: 'biz-1',
        customerId: 'cust-1',
        resultId: 'result-1',
        businessName,
        testName,
        locale,
      });

      expect(payload.title).toBe(
        t(locale, 'email.clinicResultReadyPushTitle', { businessName }),
      );
      expect(payload.body).toBe(
        t(locale, 'email.clinicResultReadyPushBody', { testName }),
      );
      expect(payload.foregroundHint).toBe(
        t(locale, 'email.clinicResultReadyPushForegroundHint', { testName }),
      );
    },
  );

  it('falls back to default service name when test name is blank', () => {
    const payload = buildConsumerResultReadyPushPayload({
      url: 'optischedule://book/city-clinic/results',
      businessId: 'biz-1',
      customerId: 'cust-1',
      resultId: 'result-1',
      businessName: 'City Clinic',
      testName: '   ',
      locale: 'en',
    });

    expect(payload.body).toBe(
      t('en', 'email.clinicResultReadyPushBody', {
        testName: t('en', 'email.defaultServiceName'),
      }),
    );
  });

  it('omits optional result-ready data fields when absent', () => {
    const payload = buildConsumerResultReadyPushPayload({
      url: 'optischedule://book/city-clinic/results',
      businessId: 'biz-1',
      customerId: 'cust-1',
      resultId: 'result-1',
      businessName: 'City Clinic',
      testName: 'CBC',
      locale: 'en',
    });
    const { foregroundHint: _hint, bookingId: _bookingId, ...rest } = payload;
    const data = toConsumerPushDataFields(rest);

    expect(data).not.toHaveProperty('bookingId');
    expect(data).not.toHaveProperty('foregroundHint');
  });

  it('builds lab-booking-request push payload with deep link and token', () => {
    const payload = buildConsumerLabBookingRequestPushPayload({
      url: 'optischedule://book/city-clinic/lab-requests?serviceId=svc-1&clinicOrderToken=token-abc',
      businessId: 'biz-1',
      customerId: 'cust-1',
      orderId: 'order-1',
      businessName: 'City Clinic',
      collectionServiceName: 'Lab blood draw',
      testNames: 'CBC',
      collectionServiceId: 'svc-1',
      clinicOrderToken: 'token-abc',
      locale: 'en',
    });

    expect(payload.pushType).toBe('lab_booking_request');
    expect(payload.url).toContain('/lab-requests');
    expect(payload.title).toBe(
      t('en', 'email.clinicLabBookingRequestPushTitle', {
        businessName: 'City Clinic',
      }),
    );
    expect(toConsumerPushDataFields(payload)).toMatchObject({
      pushType: 'lab_booking_request',
      orderId: 'order-1',
      collectionServiceId: 'svc-1',
      clinicOrderToken: 'token-abc',
    });
  });

  it.each([
    ['hy', 'Yerevan Clinic', 'Lab blood draw', 'CBC'],
    ['ru', 'Moscow Clinic', 'Lab blood draw', 'CBC'],
  ] as const)(
    'localizes lab-booking-request push copy for %s',
    (locale, businessName, collectionServiceName, testNames) => {
      const payload = buildConsumerLabBookingRequestPushPayload({
        url: 'optischedule://book/city-clinic/lab-requests',
        businessId: 'biz-1',
        customerId: 'cust-1',
        orderId: 'order-1',
        businessName,
        collectionServiceName,
        testNames,
        locale,
      });

      expect(payload.title).toBe(
        t(locale, 'email.clinicLabBookingRequestPushTitle', { businessName }),
      );
      expect(payload.body).toBe(
        t(locale, 'email.clinicLabBookingRequestPushBody', {
          collectionServiceName,
          testNames,
        }),
      );
      expect(payload.foregroundHint).toBe(
        t(locale, 'email.clinicLabBookingRequestPushForegroundHint', {
          collectionServiceName,
        }),
      );
    },
  );

  it('falls back to default service name when lab booking labels are blank', () => {
    const payload = buildConsumerLabBookingRequestPushPayload({
      url: 'optischedule://book/city-clinic/lab-requests',
      businessId: 'biz-1',
      customerId: 'cust-1',
      orderId: 'order-1',
      businessName: 'City Clinic',
      collectionServiceName: '  ',
      testNames: '',
      locale: 'en',
    });
    const defaultName = t('en', 'email.defaultServiceName');

    expect(payload.body).toBe(
      t('en', 'email.clinicLabBookingRequestPushBody', {
        collectionServiceName: defaultName,
        testNames: defaultName,
      }),
    );
  });

  it('omits optional lab-booking data fields when absent', () => {
    const payload = buildConsumerLabBookingRequestPushPayload({
      url: 'optischedule://book/city-clinic/lab-requests',
      businessId: 'biz-1',
      customerId: 'cust-1',
      orderId: 'order-1',
      businessName: 'City Clinic',
      collectionServiceName: 'Lab blood draw',
      testNames: 'CBC',
      locale: 'en',
    });

    expect(toConsumerPushDataFields(payload)).toEqual({
      pushType: 'lab_booking_request',
      url: payload.url,
      businessId: 'biz-1',
      customerId: 'cust-1',
      title: payload.title,
      body: payload.body,
      foregroundHint: payload.foregroundHint,
      orderId: 'order-1',
    });
  });

  it('builds FCM message with notification and data fields', () => {
    const payload = buildConsumerResultReadyPushPayload({
      url: 'optischedule://book/city-clinic/results',
      businessId: 'biz-1',
      customerId: 'cust-1',
      resultId: 'result-1',
      businessName: 'City Clinic',
      testName: 'CBC',
      locale: 'en',
    });

    expect(buildConsumerNativeFcmMessage(payload)).toEqual({
      notification: { title: payload.title, body: payload.body },
      data: toConsumerPushDataFields(payload),
    });
  });

  it('classifies salon booking push types', () => {
    expect(isSalonBookingPushType('booking_confirmed')).toBe(true);
    expect(isSalonBookingPushType('result_ready')).toBe(false);
    expect(resolveConsumerPushAndroidChannelId('lab_booking_request')).toBe(
      'clinic_alerts',
    );
    expect(resolveConsumerPushAndroidChannelId('rebooking_nudge')).toBe(
      'marketing_offers',
    );
  });

  it('builds salon booking confirmed push payload', () => {
    const payload = buildConsumerBookingConfirmedPushPayload({
      url: 'optischedule://book/glow-nails/manage?bookingId=b-1&token=tok',
      businessId: 'biz-1',
      customerId: 'cust-1',
      bookingId: 'b-1',
      businessName: 'Glow Nails',
      serviceName: 'Manicure',
      scheduleLabel: 'Mon Jun 8 at 2:00 PM',
      locale: 'en',
    });

    expect(payload.pushType).toBe('booking_confirmed');
    expect(toConsumerPushDataFields(payload)).toMatchObject({
      pushType: 'booking_confirmed',
      bookingId: 'b-1',
    });
    expect(resolveConsumerPushAndroidChannelId(payload.pushType)).toBe(
      'booking_alerts',
    );
  });

  it('builds salon reminder push payload with minutesBefore', () => {
    const payload = buildConsumerBookingReminderPushPayload({
      url: 'optischedule://book/glow-nails/manage?bookingId=b-1&token=tok',
      businessId: 'biz-1',
      customerId: 'cust-1',
      bookingId: 'b-1',
      businessName: 'Glow Nails',
      serviceName: 'Manicure',
      scheduleLabel: 'Mon Jun 8 at 2:00 PM',
      minutesBefore: 1440,
      locale: 'en',
    });

    expect(toConsumerPushDataFields(payload).reminderMinutesBefore).toBe(
      '1440',
    );
  });

  it('builds rescheduled and cancelled salon push payloads', () => {
    const rescheduled = buildConsumerBookingRescheduledPushPayload({
      url: 'optischedule://book/glow-nails/manage?bookingId=b-1&token=tok',
      businessId: 'biz-1',
      customerId: 'cust-1',
      bookingId: 'b-1',
      businessName: 'Glow Nails',
      serviceName: 'Manicure',
      scheduleLabel: 'Tue Jun 9 at 3:00 PM',
      locale: 'en',
    });
    const cancelled = buildConsumerBookingCancelledPushPayload({
      url: 'optischedule://book/glow-nails',
      businessId: 'biz-1',
      customerId: 'cust-1',
      bookingId: 'b-1',
      businessName: 'Glow Nails',
      serviceName: 'Manicure',
      scheduleLabel: 'Mon Jun 8 at 2:00 PM',
      locale: 'en',
    });

    expect(rescheduled.pushType).toBe('booking_rescheduled');
    expect(cancelled.pushType).toBe('booking_cancelled');
    expect(cancelled.title).toBe(
      t('en', 'email.bookingCancelledPushTitle', {
        businessName: 'Glow Nails',
      }),
    );
  });

  it('localizes salon booking push copy', () => {
    const payload = buildConsumerBookingConfirmedPushPayload({
      url: 'optischedule://book/glow-nails/manage?bookingId=b-1&token=tok',
      businessId: 'biz-1',
      customerId: 'cust-1',
      bookingId: 'b-1',
      businessName: 'Glow Nails',
      serviceName: '   ',
      scheduleLabel: 'Mon Jun 8 at 2:00 PM',
      locale: 'hy',
    });
    expect(payload.body).toContain(t('hy', 'email.defaultServiceName'));
  });

  it('builds rebooking nudge push payload', () => {
    const payload = buildConsumerRebookingNudgePushPayload({
      url: 'optischedule://book/glow-nails/book/svc-1',
      businessId: 'biz-1',
      customerId: 'cust-1',
      serviceId: 'svc-1',
      businessName: 'Glow Nails',
      serviceName: 'Haircut',
      cadenceLabel: '4 weeks',
      locale: 'en',
    });

    expect(payload.pushType).toBe('rebooking_nudge');
    expect(toConsumerPushDataFields(payload)).toMatchObject({
      pushType: 'rebooking_nudge',
      serviceId: 'svc-1',
    });
  });

  it('builds activation concierge push payload', () => {
    const payload = buildConsumerActivationConciergePushPayload({
      url: 'optischedule://book/glow-nails/book/svc-1?resume=1',
      businessId: 'biz-1',
      customerId: 'cust-1',
      businessName: 'Glow Nails',
      serviceName: 'Haircut',
      milestone: '24h',
      serviceId: 'svc-1',
      locale: 'en',
    });

    expect(payload.pushType).toBe('activation_concierge');
    expect(toConsumerPushDataFields(payload)).toMatchObject({
      pushType: 'activation_concierge',
      serviceId: 'svc-1',
      url: 'optischedule://book/glow-nails/book/svc-1?resume=1',
    });
  });

  it('builds win-back push payload', () => {
    const payload = buildConsumerWinBackPushPayload({
      url: 'optischedule://book/glow-nails',
      businessId: 'biz-1',
      customerId: 'cust-1',
      businessName: 'Glow Nails',
      promoCode: 'WINBACK10',
      locale: 'en',
    });

    expect(payload.pushType).toBe('win_back');
    expect(toConsumerPushDataFields(payload)).toMatchObject({
      pushType: 'win_back',
      promoCode: 'WINBACK10',
    });
  });

  it('builds gift card received push payload', () => {
    const payload = buildConsumerGiftCardReceivedPushPayload({
      url: 'optischedule://book/glow-nails',
      businessId: 'biz-1',
      customerId: 'cust-1',
      giftCardId: 'gc-1',
      businessName: 'Glow Nails',
      senderName: 'Alex',
      locale: 'en',
    });

    expect(payload.pushType).toBe('gift_card_received');
    expect(toConsumerPushDataFields(payload)).toMatchObject({
      giftCardId: 'gc-1',
    });
  });

  it('builds provider visit status push payloads (prov-exp-3.2)', () => {
    const runningLate = buildConsumerProviderVisitStatusPushPayload({
      url: 'optischedule://book/glow-nails/manage?bookingId=b-1&token=tok',
      businessId: 'biz-1',
      customerId: 'cust-1',
      bookingId: 'b-1',
      businessName: 'Glow Nails',
      providerName: 'Alex',
      serviceName: 'Manicure',
      kind: 'running_late',
      minutesLate: 10,
      locale: 'en',
    });
    expect(runningLate.pushType).toBe('provider_visit_status');
    expect(runningLate.providerVisitStatusKind).toBe('running_late');

    const readyNow = buildConsumerProviderVisitStatusPushPayload({
      url: 'optischedule://book/glow-nails/manage?bookingId=b-1&token=tok',
      businessId: 'biz-1',
      customerId: 'cust-1',
      bookingId: 'b-1',
      businessName: 'Glow Nails',
      providerName: 'Alex',
      serviceName: 'Manicure',
      kind: 'ready_now',
      locale: 'en',
    });
    expect(readyNow.providerVisitStatusKind).toBe('ready_now');
  });
});
