import { t } from '../../common/i18n/messages.js';
import {
  buildConsumerLabBookingRequestPushPayload,
  buildConsumerNativeFcmMessage,
  buildConsumerResultReadyPushPayload,
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
    const data = toConsumerPushDataFields(rest as typeof payload);

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
});
