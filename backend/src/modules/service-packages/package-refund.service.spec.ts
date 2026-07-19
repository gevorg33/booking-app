import { PackageRefundService } from './package-refund.service.js';
import type { Business } from '../business/entities/business.entity.js';
import type { PackagePurchase } from './entities/service-package.entity.js';

describe('PackageRefundService', () => {
  const purchaseRepo = { save: jest.fn() };
  const stripeService = {
    isConfigured: true,
    client: {
      refunds: { create: jest.fn() },
    },
    connectRequestOptions: jest.fn(),
  };
  const stripeIntegrationService = { resolveConnectAccountId: jest.fn() };

  const service = new PackageRefundService(
    purchaseRepo as any,
    stripeService as any,
    stripeIntegrationService as any,
  );

  const business = { id: 'biz-1', settings: {} } as Business;

  const makePurchase = (overrides: Partial<PackagePurchase> = {}) =>
    ({
      id: 'purchase-1',
      metadata: { stripePaymentIntentId: 'pi_1' },
      ...overrides,
    }) as PackagePurchase;

  beforeEach(() => {
    jest.clearAllMocks();
    purchaseRepo.save.mockImplementation(
      async (purchase: PackagePurchase) => purchase,
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
    const result = await service.refundPackagePayment(
      business,
      makePurchase({
        metadata: { stripePaymentIntentId: 'pi_1', stripeRefundId: 're_old' },
      }),
    );
    expect(result).toBe('already_refunded');
    expect(stripeService.client.refunds.create).not.toHaveBeenCalled();
  });

  it('returns skipped when no payment intent is stored', async () => {
    const result = await service.refundPackagePayment(
      business,
      makePurchase({ metadata: {} }),
    );
    expect(result).toBe('skipped');
    expect(stripeService.client.refunds.create).not.toHaveBeenCalled();
  });

  it('returns skipped when Stripe is not configured', async () => {
    stripeService.isConfigured = false;
    const result = await service.refundPackagePayment(
      business,
      makePurchase(),
    );
    expect(result).toBe('skipped');
    expect(stripeService.client.refunds.create).not.toHaveBeenCalled();
  });

  it('refunds via the stored payment intent and persists stripeRefundId', async () => {
    const purchase = makePurchase();
    const result = await service.refundPackagePayment(business, purchase);
    expect(result).toBe('refunded');
    expect(stripeService.client.refunds.create).toHaveBeenCalledWith(
      { payment_intent: 'pi_1' },
      { stripeAccount: 'acct_1' },
    );
    expect(purchaseRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        metadata: expect.objectContaining({ stripeRefundId: 're_1' }),
      }),
    );
  });

  it('prefers the connect account id already stored on the purchase metadata', async () => {
    await service.refundPackagePayment(
      business,
      makePurchase({
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
    await service.refundPackagePayment(
      business,
      makePurchase({ metadata: { stripePaymentIntentId: 'pi_1' } }),
    );
    expect(
      stripeIntegrationService.resolveConnectAccountId,
    ).toHaveBeenCalledWith(business.settings);
  });

  it('uses platform account options when no connect account is configured', async () => {
    stripeIntegrationService.resolveConnectAccountId.mockReturnValue(null);
    stripeService.connectRequestOptions.mockReturnValue(undefined);
    await service.refundPackagePayment(
      business,
      makePurchase({ metadata: { stripePaymentIntentId: 'pi_1' } }),
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
    const result = await service.refundPackagePayment(
      business,
      makePurchase(),
    );
    expect(result).toBe('failed');
    expect(purchaseRepo.save).not.toHaveBeenCalled();
  });

  it('returns failed for non-Error rejections', async () => {
    stripeService.client.refunds.create.mockRejectedValue({
      code: 'card_error',
    });
    const result = await service.refundPackagePayment(
      business,
      makePurchase(),
    );
    expect(result).toBe('failed');
  });
});
