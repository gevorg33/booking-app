import { GiftCardRefundService } from './gift-card-refund.service.js';
import type { Business } from '../business/entities/business.entity.js';
import type { GiftCard } from './entities/gift-card.entity.js';

describe('GiftCardRefundService', () => {
  const giftCardRepo = { save: jest.fn() };
  const stripeService = {
    isConfigured: true,
    client: {
      checkout: { sessions: { retrieve: jest.fn() } },
      refunds: { create: jest.fn() },
    },
    connectRequestOptions: jest.fn(),
  };
  const stripeIntegrationService = { resolveConnectAccountId: jest.fn() };

  const service = new GiftCardRefundService(
    giftCardRepo as any,
    stripeService as any,
    stripeIntegrationService as any,
  );

  const business = { id: 'biz-1', settings: {} } as Business;

  const makeCard = (overrides: Partial<GiftCard> = {}) =>
    ({
      id: 'gc-1',
      stripeSessionId: 'sess_1',
      stripeRefundId: null,
      ...overrides,
    }) as GiftCard;

  beforeEach(() => {
    jest.clearAllMocks();
    giftCardRepo.save.mockImplementation(async (card: GiftCard) => card);
    stripeService.isConfigured = true;
    stripeIntegrationService.resolveConnectAccountId.mockReturnValue('acct_1');
    stripeService.connectRequestOptions.mockReturnValue({ stripeAccount: 'acct_1' });
    stripeService.client.checkout.sessions.retrieve.mockResolvedValue({
      payment_intent: 'pi_1',
    });
    stripeService.client.refunds.create.mockResolvedValue({ id: 're_1' });
  });

  it('returns already_refunded when stripeRefundId is set', async () => {
    const result = await service.refundPurchase(
      business,
      makeCard({ stripeRefundId: 're_existing' }),
    );
    expect(result).toBe('already_refunded');
    expect(stripeService.client.checkout.sessions.retrieve).not.toHaveBeenCalled();
  });

  it('returns skipped when stripeSessionId is missing', async () => {
    const result = await service.refundPurchase(business, makeCard({ stripeSessionId: null }));
    expect(result).toBe('skipped');
    expect(stripeService.client.refunds.create).not.toHaveBeenCalled();
  });

  it('returns skipped when Stripe is not configured', async () => {
    stripeService.isConfigured = false;
    const result = await service.refundPurchase(business, makeCard());
    expect(result).toBe('skipped');
    expect(stripeService.client.checkout.sessions.retrieve).not.toHaveBeenCalled();
  });

  it('returns skipped when checkout session has no payment intent', async () => {
    stripeService.client.checkout.sessions.retrieve.mockResolvedValue({ payment_intent: null });
    const result = await service.refundPurchase(business, makeCard());
    expect(result).toBe('skipped');
    expect(stripeService.client.refunds.create).not.toHaveBeenCalled();
  });

  it('refunds using string payment_intent and persists stripeRefundId', async () => {
    const result = await service.refundPurchase(business, { ...makeCard() });
    expect(result).toBe('refunded');
    expect(stripeService.client.checkout.sessions.retrieve).toHaveBeenCalledWith(
      'sess_1',
      {},
      { stripeAccount: 'acct_1' },
    );
    expect(stripeService.client.refunds.create).toHaveBeenCalledWith(
      { payment_intent: 'pi_1' },
      { stripeAccount: 'acct_1' },
    );
    expect(giftCardRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({ stripeRefundId: 're_1' }),
    );
  });

  it('refunds using expanded payment_intent object', async () => {
    stripeService.client.checkout.sessions.retrieve.mockResolvedValue({
      payment_intent: { id: 'pi_obj' },
    });
    const result = await service.refundPurchase(business, makeCard());
    expect(result).toBe('refunded');
    expect(stripeService.client.refunds.create).toHaveBeenCalledWith(
      { payment_intent: 'pi_obj' },
      expect.any(Object),
    );
  });

  it('uses platform account options when no connect account is configured', async () => {
    stripeIntegrationService.resolveConnectAccountId.mockReturnValue(null);
    stripeService.connectRequestOptions.mockReturnValue(undefined);
    await service.refundPurchase(business, makeCard());
    expect(stripeService.client.checkout.sessions.retrieve).toHaveBeenCalledWith(
      'sess_1',
      {},
      undefined,
    );
    expect(stripeService.client.refunds.create).toHaveBeenCalledWith(
      { payment_intent: 'pi_1' },
      undefined,
    );
  });

  it('uses empty connect options for destination charge businesses', async () => {
    stripeService.connectRequestOptions.mockReturnValue({});
    await service.refundPurchase(business, makeCard());
    expect(stripeService.client.refunds.create).toHaveBeenCalledWith(
      { payment_intent: 'pi_1' },
      {},
    );
  });

  it('returns failed when session retrieval throws', async () => {
    stripeService.client.checkout.sessions.retrieve.mockRejectedValue(new Error('stripe down'));
    const result = await service.refundPurchase(business, makeCard());
    expect(result).toBe('failed');
    expect(giftCardRepo.save).not.toHaveBeenCalled();
  });

  it('returns failed when refund creation throws', async () => {
    stripeService.client.refunds.create.mockRejectedValue(new Error('refund rejected'));
    const result = await service.refundPurchase(business, makeCard());
    expect(result).toBe('failed');
    expect(giftCardRepo.save).not.toHaveBeenCalled();
  });

  it('returns failed for non-Error rejections', async () => {
    stripeService.client.refunds.create.mockRejectedValue({ code: 'card_error' });
    const result = await service.refundPurchase(business, makeCard());
    expect(result).toBe('failed');
  });
});
