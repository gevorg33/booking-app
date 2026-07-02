import { attachPublicBookingNearestAcrossWindowsMock } from './ai-nearest-slot-resolver.util.js';
import { AiPaymentsService } from './ai-payments.service.js';

describe('AiPaymentsService', () => {
  const giftCardsService = {
    validate: jest.fn(async () => ({ id: 'gc-1', code: 'GCM-ABCD1234' })),
    getBalanceView: jest.fn(async () => ({
      code: 'GCM-ABCD1234',
      balance: 50,
    })),
    updateExpiration: jest.fn(async () => ({
      id: 'gc-1',
      expiresAt: new Date('2028-01-01'),
    })),
  };
  const giftCardPurchaseService = {
    getPublicCatalog: jest.fn(async () => ({
      purchaseEnabled: true,
      settings: { presetAmounts: [50] },
    })),
    quotePurchase: jest.fn(async () => ({ total: 50, label: 'Gift card $50' })),
  };
  const giftCardOrderService = {};
  const giftCardRefundService = {
    refundPurchase: jest.fn(async () => 'refunded'),
  };
  const publicBookingService = {
    recommendProviders: jest.fn(async () => ({
      providers: [{ id: 'e1', name: 'Anna' }],
    })),
    findNearestBookableSlot: jest.fn(async () => ({
      startTime: '2026-06-06T18:00:00Z',
      employeeId: 'e1',
      employeeName: 'Anna',
    })),
  };
  attachPublicBookingNearestAcrossWindowsMock(publicBookingService);
  const accountingIntegrationService = {
    generateExport: jest.fn(async () => ({
      format: 'csv',
      rowCount: 1,
      content:
        'Date,Type,IncomeSubType,Description,Amount,Currency,Reference\n2026-06-01,income,subscription,Plan,199,USD,sub-1',
      filename: 'export.csv',
      provider: 'csv',
    })),
  };
  const commissionsService = {
    exportPayoutCsv: jest.fn(async () => ({
      filename: 'payout.csv',
      content: 'rows',
      rowCount: 1,
    })),
  };
  const subscriptionsService = {
    getPlanCheckoutDetails: jest.fn(async () => ({
      amount: 199,
      planName: 'Plan',
      includedAppointments: 6,
      durationMonths: 6,
    })),
  };
  const businessRepo = {
    findOne: jest.fn(async () => ({
      id: 'biz-1',
      slug: 'salon',
      settings: {
        publicBooking: { acceptCashPayments: true },
        integrations: { stripe: { connectAccountId: 'acct_1' } },
      },
    })),
    save: jest.fn(async (b) => b),
  };
  const serviceRepo = {
    find: jest.fn(async () => [
      {
        id: 's1',
        name: 'Massage',
        businessId: 'biz-1',
        price: 80,
        isActive: true,
      },
    ]),
    findOne: jest.fn(async () => ({
      id: 's1',
      name: 'Massage',
      businessId: 'biz-1',
      price: 80,
      isActive: true,
    })),
  };
  const bookingRepo = {
    find: jest.fn(async () => []),
    findOne: jest.fn(async () => null),
    save: jest.fn(async (b) => b),
  };
  const giftCardRepo = {
    findOne: jest.fn(async () => ({
      id: 'gc-1',
      businessId: 'biz-1',
      code: 'GCM-ABCD1234',
      cardType: 'monetary',
      balance: 50,
    })),
    save: jest.fn(async (c) => c),
  };

  let service: AiPaymentsService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AiPaymentsService(
      giftCardsService as any,
      giftCardPurchaseService as any,
      giftCardOrderService as any,
      giftCardRefundService as any,
      publicBookingService as any,
      accountingIntegrationService as any,
      commissionsService as any,
      subscriptionsService as any,
      { update: jest.fn(async (id, dto) => ({ id, ...dto })) } as any,
      businessRepo as any,
      serviceRepo as any,
      bookingRepo as any,
      giftCardRepo as any,
    );
  });

  it('delegates rescue and compound helpers', () => {
    expect(
      service.rescuePaymentsIntent('Summarize unpaid bookings', 'unknown')
        ?.action,
    ).toBe('summarize_unpaid');
    expect(
      service.isPaymentsCompound('Summarize unpaid and export accounting'),
    ).toBe(true);
    expect(
      service.decomposePaymentsCompound(
        'Summarize unpaid and export accounting',
      ).length,
    ).toBe(2);
  });

  it('delegates all payment handlers', async () => {
    expect((await service.handleSummarizeUnpaid('biz-1', {})).success).toBe(
      true,
    );
    expect(
      (
        await service.handleValidateGiftCard('biz-1', {
          giftCardCode: 'GCM-ABCD1234',
        })
      ).success,
    ).toBe(true);
    expect((await service.handleExportAccounting('biz-1', {})).success).toBe(
      true,
    );
    expect((await service.handleExportCommissions('biz-1', {})).success).toBe(
      true,
    );
    expect(
      (
        await service.handleExplainCheckoutTotal('biz-1', {
          serviceName: 'Massage',
        })
      ).success,
    ).toBe(true);
    expect(
      (await service.handleListSubscriptionRevenue('biz-1', {})).success,
    ).toBe(true);
    expect(
      (
        await service.handleConfigureCashPayments('biz-1', {
          acceptCashPayments: true,
        })
      ).success,
    ).toBe(true);
    expect(
      (
        await service.handleAdjustGiftCardBalance('biz-1', {
          giftCardId: 'gc-1',
          delta: 5,
        })
      ).success,
    ).toBe(true);
    expect(
      (
        await service.handleExtendGiftCardExpiry('biz-1', {
          giftCardId: 'gc-1',
          extendMonths: 1,
        })
      ).success,
    ).toBe(true);
    expect(
      (await service.handleRefundGiftCardOrder('biz-1', { giftCardId: 'gc-1' }))
        .success,
    ).toBe(true);
    expect(
      (
        await service.handleCheckProvidersForService(
          'biz-1',
          { serviceName: 'Massage' },
          'tomorrow evening',
        )
      ).success,
    ).toBe(true);
    expect(
      (await service.handleBookNearestSlot('biz-1', { serviceName: 'Massage' }))
        .success,
    ).toBe(true);
    expect(
      (
        await service.handleApplyGiftCardCode('biz-1', {
          giftCardCode: 'GCM-ABCD1234',
        })
      ).success,
    ).toBe(true);
    expect(
      (
        await service.handleCheckGiftCardBalance('biz-1', {
          giftCardCode: 'GCM-ABCD1234',
        })
      ).success,
    ).toBe(true);
    expect(
      (await service.handleBuyGiftCard('biz-1', { amount: 50 })).success,
    ).toBe(true);
    expect(
      (await service.handleBuyGiftCard('biz-1', { amount: 50 }, true)).success,
    ).toBe(true);
    expect((await service.handleChoosePaymentMethod('biz-1')).success).toBe(
      true,
    );
    expect(
      (
        await service.handlePayOnline('biz-1', {
          serviceId: 's1',
          employeeId: 'e1',
          startTime: '2026-06-06T18:00:00Z',
        })
      ).success,
    ).toBe(true);
    expect((await service.handlePayCashAtVisit('biz-1')).success).toBe(true);
    expect(
      (
        await service.handlePurchaseSubscriptionCheckout('biz-1', {
          planId: 'plan-1',
        })
      ).success,
    ).toBe(true);
    expect(
      (await service.handleExplainWhyStripeRequired('biz-1')).success,
    ).toBe(true);
    expect(
      (await service.handleReceiptStatus('biz-1', { bookingId: 'b1' })).success,
    ).toBe(false);
    const compound = await service.handlePaymentsCompound(
      'biz-1',
      'Book nearest massage slot and apply gift card GCM-ABCD1234',
      { giftCardCode: 'GCM-ABCD1234', serviceName: 'Massage' },
    );
    expect(compound.success).toBe(true);
  });
});
