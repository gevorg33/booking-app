import { SubscriptionRefundService } from './subscription-refund.service.js';
import type { Business } from '../business/entities/business.entity.js';
import type { CustomerSubscription } from './entities/subscription.entity.js';

describe('SubscriptionRefundService', () => {
  const subscriptionRepo = { save: jest.fn() };
  const stripeService = {
    isConfigured: true,
    client: {
      refunds: { create: jest.fn() },
    },
    connectRequestOptions: jest.fn(),
  };
  const stripeIntegrationService = { resolveConnectAccountId: jest.fn() };

  const service = new SubscriptionRefundService(
    subscriptionRepo as any,
    stripeService as any,
    stripeIntegrationService as any,
  );

  const business = { id: 'biz-1', settings: {} } as Business;

  const makeSubscription = (
    overrides: Partial<CustomerSubscription> = {},
  ) =>
    ({
      id: 'sub-1',
      metadata: { stripePaymentIntentId: 'pi_1' },
      ...overrides,
    }) as CustomerSubscription;

  beforeEach(() => {
    jest.clearAllMocks();
    subscriptionRepo.save.mockImplementation(
      async (sub: CustomerSubscription) => sub,
    );
    stripeService.isConfigured = true;
    stripeIntegrationService.resolveConnectAccountId.mockReturnValue(
      'acct_1',
    );
    stripeService.connectRequestOptions.mockReturnValue({
      stripeAccount: 'acct_1',
    });
    stripeService.client.refunds.create.mockResolvedValue({ id: 're_1' });
  });

  it('returns already_refunded when stripeRefundId is set', async () => {
    const result = await service.refundSubscriptionPayment(
      business,
      makeSubscription({
        metadata: { stripePaymentIntentId: 'pi_1', stripeRefundId: 're_old' },
      }),
    );
    expect(result).toBe('already_refunded');
    expect(stripeService.client.refunds.create).not.toHaveBeenCalled();
  });

  it('returns skipped when no payment intent is stored', async () => {
    const result = await service.refundSubscriptionPayment(
      business,
      makeSubscription({ metadata: {} }),
    );
    expect(result).toBe('skipped');
    expect(stripeService.client.refunds.create).not.toHaveBeenCalled();
  });

  it('returns skipped when Stripe is not configured', async () => {
    stripeService.isConfigured = false;
    const result = await service.refundSubscriptionPayment(
      business,
      makeSubscription(),
    );
    expect(result).toBe('skipped');
    expect(stripeService.client.refunds.create).not.toHaveBeenCalled();
  });

  it('refunds via the stored payment intent and persists stripeRefundId', async () => {
    const sub = makeSubscription();
    const result = await service.refundSubscriptionPayment(business, sub);
    expect(result).toBe('refunded');
    expect(stripeService.client.refunds.create).toHaveBeenCalledWith(
      { payment_intent: 'pi_1' },
      { stripeAccount: 'acct_1' },
    );
    expect(subscriptionRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        metadata: expect.objectContaining({ stripeRefundId: 're_1' }),
      }),
    );
  });

  it('prefers the connect account id already stored on the subscription metadata', async () => {
    await service.refundSubscriptionPayment(
      business,
      makeSubscription({
        metadata: {
          stripePaymentIntentId: 'pi_1',
          stripeConnectAccountId: 'acct_stored',
        },
      }),
    );
    expect(stripeService.connectRequestOptions).toHaveBeenCalledWith(
      'acct_stored',
      business.settings,
    );
    expect(
      stripeIntegrationService.resolveConnectAccountId,
    ).not.toHaveBeenCalled();
  });

  it('falls back to resolving the connect account from business settings', async () => {
    await service.refundSubscriptionPayment(
      business,
      makeSubscription({ metadata: { stripePaymentIntentId: 'pi_1' } }),
    );
    expect(
      stripeIntegrationService.resolveConnectAccountId,
    ).toHaveBeenCalledWith(business.settings);
  });

  it('uses platform account options when no connect account is configured', async () => {
    stripeIntegrationService.resolveConnectAccountId.mockReturnValue(null);
    stripeService.connectRequestOptions.mockReturnValue(undefined);
    await service.refundSubscriptionPayment(
      business,
      makeSubscription({ metadata: { stripePaymentIntentId: 'pi_1' } }),
    );
    expect(stripeService.client.refunds.create).toHaveBeenCalledWith(
      { payment_intent: 'pi_1' },
      undefined,
    );
  });

  it('returns failed when the refund API call throws', async () => {
    stripeService.client.refunds.create.mockRejectedValue(
      new Error('stripe down'),
    );
    const result = await service.refundSubscriptionPayment(
      business,
      makeSubscription(),
    );
    expect(result).toBe('failed');
    expect(subscriptionRepo.save).not.toHaveBeenCalled();
  });

  it('returns failed for non-Error rejections', async () => {
    stripeService.client.refunds.create.mockRejectedValue({
      code: 'card_error',
    });
    const result = await service.refundSubscriptionPayment(
      business,
      makeSubscription(),
    );
    expect(result).toBe('failed');
  });
});
