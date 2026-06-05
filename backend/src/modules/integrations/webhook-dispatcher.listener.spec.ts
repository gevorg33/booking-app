import { createHmac } from 'crypto';
import { EventType } from '../../events/event-types.js';
import { WebhookDispatcherListener } from './webhook-dispatcher.listener.js';
import { WebhooksService } from './webhooks.service.js';

describe('WebhookDispatcherListener', () => {
  const webhooksService = {
    getActiveSubscriptionsForEvent: jest.fn(),
    decryptSubscriptionSecret: jest.fn(),
  };
  const deliveryRepo = { save: jest.fn(), create: jest.fn() };

  const listener = new WebhookDispatcherListener(
    webhooksService as unknown as WebhooksService,
    deliveryRepo as any,
  );

  const subscription = {
    id: 'sub-1',
    businessId: 'biz-1',
    url: 'https://hooks.example.com/os',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    deliveryRepo.create.mockImplementation((v) => v);
    deliveryRepo.save.mockImplementation(async (v) => v);
    webhooksService.decryptSubscriptionSecret.mockReturnValue('whsec_test');
    global.fetch = jest.fn();
  });

  it('skips when business id missing', async () => {
    await listener.handleDomainEvent({
      eventType: EventType.BOOKING_CREATED,
    } as any);
    expect(
      webhooksService.getActiveSubscriptionsForEvent,
    ).not.toHaveBeenCalled();
  });

  it('delivers signed webhook payload on success', async () => {
    webhooksService.getActiveSubscriptionsForEvent.mockResolvedValue([
      subscription,
    ]);
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => 'ok',
    });

    await listener.handleDomainEvent({
      id: 'evt-1',
      businessId: 'biz-1',
      eventType: EventType.PAYMENT_RECEIVED,
      aggregateType: 'booking',
      aggregateId: 'book-1',
      payload: { amount: 50 },
      createdAt: new Date('2026-05-01T12:00:00Z'),
    } as any);

    expect(global.fetch).toHaveBeenCalledTimes(1);
    const [url, init] = (global.fetch as jest.Mock).mock.calls[0];
    expect(url).toBe(subscription.url);
    const body = init.body as string;
    const signature = createHmac('sha256', 'whsec_test')
      .update(body)
      .digest('hex');
    expect(init.headers['X-OptiSchedule-Signature']).toBe(signature);
    expect(init.headers['X-OptiSchedule-Event']).toBe(
      EventType.PAYMENT_RECEIVED,
    );
    expect(deliveryRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'success' }),
    );
  });

  it('skips when no subscriptions', async () => {
    webhooksService.getActiveSubscriptionsForEvent.mockResolvedValue([]);
    await listener.handleDomainEvent({
      id: 'evt-1',
      businessId: 'biz-1',
      eventType: EventType.REVIEW_RECEIVED,
      aggregateType: 'review',
      aggregateId: 'rev-1',
      payload: { rating: 5 },
      createdAt: new Date('2026-05-01T12:00:00Z'),
    } as any);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('uses current timestamp when event has no createdAt', async () => {
    webhooksService.getActiveSubscriptionsForEvent.mockResolvedValue([
      subscription,
    ]);
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => 'ok',
    });

    await listener.handleDomainEvent({
      id: 'evt-5',
      businessId: 'biz-1',
      eventType: EventType.REVIEW_RECEIVED,
      aggregateType: 'review',
      aggregateId: 'rev-2',
      payload: { rating: 5 },
    } as any);

    const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
    expect(body.timestamp).toBeDefined();
  });

  it('marks delivery failed after HTTP errors', async () => {
    webhooksService.getActiveSubscriptionsForEvent.mockResolvedValue([
      subscription,
    ]);
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 500,
      text: async () => 'error',
    });

    await listener.handleDomainEvent({
      id: 'evt-2',
      businessId: 'biz-1',
      eventType: EventType.BOOKING_CANCELLED,
      aggregateType: 'booking',
      aggregateId: 'book-2',
      payload: {},
      createdAt: new Date(),
    } as any);

    expect(global.fetch).toHaveBeenCalledTimes(3);
    expect(deliveryRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'failed' }),
    );
  });

  it('skips delivery when secret cannot be decrypted', async () => {
    webhooksService.getActiveSubscriptionsForEvent.mockResolvedValue([
      subscription,
    ]);
    webhooksService.decryptSubscriptionSecret.mockImplementation(() => {
      throw new Error('bad key');
    });

    await listener.handleDomainEvent({
      id: 'evt-3',
      businessId: 'biz-1',
      eventType: EventType.REVIEW_RECEIVED,
      aggregateType: 'review',
      aggregateId: 'rev-1',
      payload: { rating: 4 },
      createdAt: new Date(),
    } as any);

    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('marks delivery failed after network errors', async () => {
    webhooksService.getActiveSubscriptionsForEvent.mockResolvedValue([
      subscription,
    ]);
    (global.fetch as jest.Mock).mockRejectedValue(new Error('timeout'));

    await listener.handleDomainEvent({
      id: 'evt-4',
      businessId: 'biz-1',
      eventType: EventType.BOOKING_CREATED,
      aggregateType: 'booking',
      aggregateId: 'book-3',
      payload: {},
      createdAt: new Date(),
    } as any);

    expect(global.fetch).toHaveBeenCalledTimes(3);
    expect(deliveryRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'failed' }),
    );
  });
});
