import {
  ConsumerPushDispatchService,
  CONSUMER_PUSH_FIREBASE_SKIP_REASON,
  CONSUMER_PUSH_SKIP_REASON,
} from './consumer-push-dispatch.service.js';
import {
  buildConsumerLabBookingRequestPushPayload,
  buildConsumerNativeFcmMessage,
  buildConsumerResultReadyPushPayload,
} from './consumer-transactional-push.util.js';

describe('ConsumerPushDispatchService', () => {
  const consumerPushTokens = {
    listTokensForCustomer: jest.fn(),
    deleteTokenById: jest.fn(),
    recordFcmAccepted: jest.fn(),
    recordDeliveryFailure: jest.fn(),
  };
  const firebase = {
    isReady: false,
    messaging: jest.fn(),
  };
  const send = jest.fn();

  const service = new ConsumerPushDispatchService(
    consumerPushTokens as never,
    firebase as never,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    firebase.isReady = false;
    firebase.messaging.mockReturnValue({ send });
    consumerPushTokens.listTokensForCustomer.mockResolvedValue([]);
  });

  it('skips when no consumer push tokens are registered', async () => {
    const payload = buildConsumerResultReadyPushPayload({
      url: 'optischedule://book/city-clinic/results',
      businessId: 'biz-1',
      customerId: 'cust-1',
      resultId: 'result-1',
      businessName: 'City Clinic',
      testName: 'CBC',
      locale: 'en',
    });
    const result = await service.sendResultReady(payload);

    expect(result.ok).toBe(false);
    expect(result.skipped).toBe(true);
    expect(result.reason).toBe(CONSUMER_PUSH_SKIP_REASON);
    expect(buildConsumerNativeFcmMessage(payload).data.pushType).toBe(
      'result_ready',
    );
  });

  it('skips when Firebase is not configured but tokens exist', async () => {
    consumerPushTokens.listTokensForCustomer.mockResolvedValueOnce([
      { id: 'tok-1', token: 'fcm-token', platform: 'android' },
    ]);
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

    const result = await service.sendLabBookingRequest(payload);

    expect(result).toEqual({
      ok: false,
      skipped: true,
      reason: CONSUMER_PUSH_FIREBASE_SKIP_REASON,
    });
    expect(send).not.toHaveBeenCalled();
  });

  it('sends FCM when tokens and Firebase are available', async () => {
    firebase.isReady = true;
    consumerPushTokens.listTokensForCustomer.mockResolvedValueOnce([
      { id: 'tok-1', token: 'fcm-token', platform: 'ios' },
    ]);
    send.mockResolvedValueOnce('message-id');

    const payload = buildConsumerResultReadyPushPayload({
      url: 'optischedule://book/city-clinic/results',
      businessId: 'biz-1',
      customerId: 'cust-1',
      resultId: 'result-1',
      businessName: 'City Clinic',
      testName: 'CBC',
      locale: 'en',
    });

    const result = await service.sendResultReady(payload);

    expect(result).toEqual({ ok: true, sentCount: 1 });
    expect(send).toHaveBeenCalledWith(
      expect.objectContaining({
        token: 'fcm-token',
        notification: {
          title: payload.title,
          body: payload.body,
        },
        data: expect.objectContaining({
          ...buildConsumerNativeFcmMessage(payload).data,
          deliveryId: expect.any(String),
        }),
      }),
    );
    expect(consumerPushTokens.recordFcmAccepted).toHaveBeenCalledWith(
      'tok-1',
      expect.any(String),
    );
  });

  it('removes invalid FCM tokens', async () => {
    firebase.isReady = true;
    consumerPushTokens.listTokensForCustomer.mockResolvedValueOnce([
      { id: 'tok-bad', token: 'bad-token', platform: 'android' },
    ]);
    send.mockRejectedValueOnce({
      code: 'messaging/registration-token-not-registered',
    });

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

    const result = await service.sendLabBookingRequest(payload);

    expect(result).toEqual({
      ok: false,
      skipped: true,
      reason: CONSUMER_PUSH_SKIP_REASON,
      sentCount: 0,
    });
    expect(consumerPushTokens.deleteTokenById).toHaveBeenCalledWith('tok-bad');
  });

  it('logs generic FCM failures without deleting the token', async () => {
    firebase.isReady = true;
    consumerPushTokens.listTokensForCustomer.mockResolvedValueOnce([
      { id: 'tok-1', token: 'fcm-token', platform: 'android' },
    ]);
    send.mockRejectedValueOnce(new Error('network down'));

    const payload = buildConsumerResultReadyPushPayload({
      url: 'optischedule://book/city-clinic/results',
      businessId: 'biz-1',
      customerId: 'cust-1',
      resultId: 'result-1',
      businessName: 'City Clinic',
      testName: 'CBC',
      locale: 'en',
    });

    const result = await service.sendResultReady(payload);

    expect(result.reason).toBe(CONSUMER_PUSH_SKIP_REASON);
    expect(consumerPushTokens.deleteTokenById).not.toHaveBeenCalled();
    expect(consumerPushTokens.recordDeliveryFailure).toHaveBeenCalledWith(
      'tok-1',
      'unknown',
    );
  });

  it('stringifies non-Error FCM failures', async () => {
    firebase.isReady = true;
    consumerPushTokens.listTokensForCustomer.mockResolvedValueOnce([
      { id: 'tok-1', token: 'fcm-token', platform: 'android' },
    ]);
    send.mockRejectedValueOnce('offline');

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

    await expect(service.sendLabBookingRequest(payload)).resolves.toEqual({
      ok: false,
      skipped: true,
      reason: CONSUMER_PUSH_SKIP_REASON,
      sentCount: 0,
    });
  });

  it('delivers when at least one token succeeds in a multi-device fan-out', async () => {
    firebase.isReady = true;
    consumerPushTokens.listTokensForCustomer.mockResolvedValueOnce([
      { id: 'tok-good', token: 'good-token', platform: 'ios' },
      { id: 'tok-bad', token: 'bad-token', platform: 'android' },
    ]);
    send.mockResolvedValueOnce('message-id').mockRejectedValueOnce({
      code: 'messaging/invalid-registration-token',
    });

    const payload = buildConsumerResultReadyPushPayload({
      url: 'optischedule://book/city-clinic/results',
      businessId: 'biz-1',
      customerId: 'cust-1',
      resultId: 'result-1',
      businessName: 'City Clinic',
      testName: 'CBC',
      locale: 'en',
    });

    await expect(service.sendResultReady(payload)).resolves.toEqual({
      ok: true,
      sentCount: 1,
    });
    expect(consumerPushTokens.deleteTokenById).toHaveBeenCalledWith('tok-bad');
  });
});
