import {
  PaymentStatus,
  BookingStatus,
} from '../booking/entities/booking.entity.js';
import { PrepaymentMode } from '../service/entities/service.entity.js';
import {
  handleSummarizeUnpaidLogic,
  handleValidateGiftCardLogic,
  handleExportAccountingLogic,
  handleExportCommissionsLogic,
  handleExplainCheckoutTotalLogic,
  handleListSubscriptionRevenueLogic,
  handleConfigureCashPaymentsLogic,
  handleConfigureServiceOnlinePaymentLogic,
  handleAdjustGiftCardBalanceLogic,
  handleExtendGiftCardExpiryLogic,
  handleRefundGiftCardOrderLogic,
  handleExplainPaymentStatusLogic,
  handleCollectCashConfirmLogic,
  handleCheckProvidersForServiceLogic,
  handleBookNearestSlotLogic,
  handleApplyGiftCardCodeLogic,
  handleCheckGiftCardBalanceLogic,
  handleBuyGiftCardLogic,
  handleGetGiftCardQuoteLogic,
  handleChoosePaymentMethodLogic,
  handlePayOnlineLogic,
  handlePayCashAtVisitLogic,
  handlePurchaseSubscriptionCheckoutLogic,
  handleExplainWhyStripeRequiredLogic,
  handleReceiptStatusLogic,
  handleConfirmStripePaymentLogic,
  handlePaymentsCompoundLogic,
  type PaymentsLogicDeps,
} from './ai-payments.logic.js';
import { findNearestBookableSlotAcrossWindowsWithFinder } from './ai-nearest-slot-resolver.util.js';

function attachNearestAcrossWindowsMock(publicBookingService: {
  findNearestBookableSlot: jest.Mock;
  findNearestBookableSlotAcrossWindows?: jest.Mock;
}) {
  publicBookingService.findNearestBookableSlotAcrossWindows = jest.fn(
    async (slug, options) =>
      findNearestBookableSlotAcrossWindowsWithFinder(
        slug,
        options,
        publicBookingService.findNearestBookableSlot,
      ),
  );
}

const baseCard = {
  id: 'gc-1',
  businessId: 'biz-1',
  code: 'GCM-ABCD1234',
  cardType: 'monetary',
  balance: 50,
  isActive: true,
  codeRevealed: true,
};

const services = [
  {
    id: 's1',
    name: 'Massage',
    businessId: 'biz-1',
    price: 80,
    isActive: true,
    prepaymentMode: PrepaymentMode.DEPOSIT,
    depositAmount: null,
  },
  {
    id: 's2',
    name: 'Haircut',
    businessId: 'biz-1',
    price: 40,
    isActive: true,
    prepaymentMode: PrepaymentMode.NONE,
    depositAmount: null,
  },
] as any[];

function buildDeps(
  overrides: Partial<PaymentsLogicDeps> = {},
): PaymentsLogicDeps {
  const deps: PaymentsLogicDeps = {
    giftCardsService: {
      validate: jest.fn(async () => baseCard),
      getBalanceView: jest.fn(async () => ({
        id: 'gc-1',
        code: 'GCM-ABCD1234',
        cardType: 'monetary',
        balance: 50,
        currency: 'USD',
        expiresAt: null,
        isActive: true,
        serviceCredits: [],
      })),
      updateExpiration: jest.fn(async () => ({
        ...baseCard,
        expiresAt: new Date('2028-01-01'),
      })),
    } as any,
    giftCardPurchaseService: {
      getPublicCatalog: jest.fn(async () => ({
        purchaseEnabled: true,
        settings: { presetAmounts: [50, 100], physicalDeliveryEnabled: true },
      })),
      quotePurchase: jest.fn(async () => ({
        label: 'Gift card $50',
        subtotal: 50,
        shippingFee: 5,
        total: 55,
        currency: 'USD',
        cardType: 'monetary',
      })),
    } as any,
    giftCardOrderService: {} as any,
    giftCardRefundService: {
      refundPurchase: jest.fn(async () => 'refunded'),
    } as any,
    publicBookingService: {
      recommendProviders: jest.fn(async () => ({
        providers: [{ id: 'e1', name: 'Anna' }],
      })),
      findNearestBookableSlot: jest.fn(async () => ({
        startTime: '2026-06-06T18:00:00Z',
        employeeId: 'e1',
        employeeName: 'Anna',
        dateKey: '2026-06-06',
      })),
    } as any,
    accountingIntegrationService: {
      generateExport: jest.fn(async () => ({
        format: 'csv',
        rowCount: 2,
        content:
          'Date,Type,IncomeSubType,Description,Amount,Currency,Reference,Customer,Employee\n2026-06-01,income,subscription,Plan,199,USD,sub-1,Sam,\n2026-06-02,income,service,Cut,50,USD,b-1,Jane,',
        filename: 'export.csv',
        provider: 'csv',
      })),
    } as any,
    commissionsService: {
      exportPayoutCsv: jest.fn(async () => ({
        filename: 'payout.csv',
        content: 'rows',
        rowCount: 1,
      })),
    } as any,
    subscriptionsService: {
      getPlanCheckoutDetails: jest.fn(async () => ({
        amount: 199,
        currency: 'USD',
        planName: '6-month plan',
        includedAppointments: 6,
        durationMonths: 6,
        preview: {},
      })),
    } as any,
    bookingRepo: {
      find: jest.fn(async () => [
        {
          id: 'b1',
          businessId: 'biz-1',
          paymentStatus: PaymentStatus.PENDING,
          status: BookingStatus.CONFIRMED,
          startTime: new Date('2026-06-06T10:00:00Z'),
          service: services[0],
          customer: { name: 'Jane' },
          employee: { name: 'Anna' },
          metadata: { paymentMethod: 'cash', payAtVenue: true },
        },
      ]),
      findOne: jest.fn(async ({ where }: any) => {
        if (where.id === 'b1') {
          return {
            id: 'b1',
            businessId: 'biz-1',
            paymentStatus: PaymentStatus.PENDING,
            status: BookingStatus.CONFIRMED,
            service: services[0],
            customer: { name: 'Jane' },
            metadata: { paymentMethod: 'cash', payAtVenue: true },
          };
        }
        if (where.id === 'b-paid') {
          return {
            id: 'b-paid',
            businessId: 'biz-1',
            paymentStatus: PaymentStatus.PAID,
            metadata: { receiptSentAt: '2026-06-01', paidVia: 'online' },
          };
        }
        return null;
      }),
      save: jest.fn(async (b) => b),
    } as any,
    businessRepo: {
      findOne: jest.fn(async () => ({
        id: 'biz-1',
        slug: 'salon',
        settings: {
          publicBooking: { acceptCashPayments: true },
          integrations: { stripe: { connectAccountId: 'acct_1' } },
        },
      })),
      save: jest.fn(async (b) => b),
    } as any,
    serviceRepo: {
      find: jest.fn(async () => services),
      findOne: jest.fn(async ({ where }: any) =>
        services.find(
          (s) => s.id === where.id || s.businessId === where.businessId,
        ),
      ),
    } as any,
    giftCardRepo: {
      findOne: jest.fn(async ({ where }: any) => {
        if (where.id === 'gc-1' || where.code === 'GCM-ABCD1234')
          return { ...baseCard };
        return null;
      }),
      save: jest.fn(async (c) => c),
    } as any,
    serviceService: {
      update: jest.fn(async (id: string, dto: Record<string, unknown>) => {
        const svc = services.find((s) => s.id === id)!;
        return {
          ...svc,
          prepaymentMode: dto.prepaymentMode ?? svc.prepaymentMode,
          depositAmount: dto.depositAmount ?? null,
        };
      }),
    } as any,
    bookingPaymentService: {
      confirmCheckoutSession: jest.fn(async () => ({ booking: {} })),
    } as any,
    ...overrides,
  };
  attachNearestAcrossWindowsMock(deps.publicBookingService as any);
  return deps;
}

describe('ai-payments.logic', () => {
  describe('dashboard handlers', () => {
    it('summarizes unpaid bookings with empty and populated results', async () => {
      expect(
        (await handleSummarizeUnpaidLogic(buildDeps(), 'biz-1', {})).success,
      ).toBe(true);
      const empty = await handleSummarizeUnpaidLogic(
        buildDeps({ bookingRepo: { find: jest.fn(async () => []) } as any }),
        'biz-1',
        {},
      );
      expect(empty.summary).toContain('No unpaid');
    });

    it('validates gift cards', async () => {
      expect(
        (await handleValidateGiftCardLogic(buildDeps(), 'biz-1', {})).success,
      ).toBe(false);
      expect(
        (
          await handleValidateGiftCardLogic(buildDeps(), 'biz-1', {
            giftCardCode: 'GCM-ABCD1234',
          })
        ).success,
      ).toBe(true);
      const fail = await handleValidateGiftCardLogic(
        buildDeps({
          giftCardsService: {
            validate: jest.fn(async () => {
              throw new Error('expired');
            }),
            getBalanceView: jest.fn(),
          } as any,
        }),
        'biz-1',
        { giftCardCode: 'GCM-BAD' },
      );
      expect(fail.success).toBe(false);
    });

    it('exports accounting and commissions', async () => {
      expect(
        (await handleExportAccountingLogic(buildDeps(), 'biz-1', {})).success,
      ).toBe(true);
      expect(
        (await handleExportCommissionsLogic(buildDeps(), 'biz-1', {})).success,
      ).toBe(true);
      const acctFail = await handleExportAccountingLogic(
        buildDeps({
          accountingIntegrationService: {
            generateExport: jest.fn(async () => {
              throw new Error('disabled');
            }),
          } as any,
        }),
        'biz-1',
        {},
      );
      expect(acctFail.success).toBe(false);
      const commFail = await handleExportCommissionsLogic(
        buildDeps({
          commissionsService: {
            exportPayoutCsv: jest.fn(async () => {
              throw new Error('fail');
            }),
          } as any,
        }),
        'biz-1',
        {},
      );
      expect(commFail.success).toBe(false);
    });

    it('explains checkout totals with and without gift cards', async () => {
      expect(
        (await handleExplainCheckoutTotalLogic(buildDeps(), 'biz-1', {}))
          .success,
      ).toBe(false);
      expect(
        (
          await handleExplainCheckoutTotalLogic(buildDeps(), 'biz-1', {
            serviceName: 'Massage',
          })
        ).success,
      ).toBe(true);
      const withCard = await handleExplainCheckoutTotalLogic(
        buildDeps(),
        'biz-1',
        {
          serviceName: 'Massage',
          giftCardCode: 'GCM-ABCD1234',
        },
      );
      expect(withCard.success).toBe(true);
      const invalidCard = await handleExplainCheckoutTotalLogic(
        buildDeps({
          giftCardsService: {
            validate: jest.fn(async () => {
              throw new Error('bad');
            }),
            getBalanceView: jest.fn(),
          } as any,
        }),
        'biz-1',
        { serviceName: 'Massage', giftCardCode: 'GCM-BAD' },
      );
      expect(invalidCard.success).toBe(true);
      expect((invalidCard.details as any).giftCardApplied).toBe(0);
      const depositBreakdown = await handleExplainCheckoutTotalLogic(
        buildDeps(),
        'biz-1',
        { serviceName: 'Massage' },
      );
      expect(depositBreakdown.success).toBe(true);
      expect((depositBreakdown.details as any).prepaymentDue).toBe(40);
      expect((depositBreakdown.details as any).balanceAtVisit).toBe(40);
    });

    it('lists subscription revenue and handles export failures', async () => {
      expect(
        (await handleListSubscriptionRevenueLogic(buildDeps(), 'biz-1', {}))
          .success,
      ).toBe(true);
      const empty = await handleListSubscriptionRevenueLogic(
        buildDeps({
          accountingIntegrationService: {
            generateExport: jest.fn(async () => ({
              content: 'Date,Type,IncomeSubType\n',
              rowCount: 0,
              format: 'csv',
              filename: 'x.csv',
              provider: 'csv',
            })),
          } as any,
        }),
        'biz-1',
        {},
      );
      expect(empty.summary).toContain('No subscription');
      const fail = await handleListSubscriptionRevenueLogic(
        buildDeps({
          accountingIntegrationService: {
            generateExport: jest.fn(async () => {
              throw new Error('off');
            }),
          } as any,
        }),
        'biz-1',
        {},
      );
      expect(fail.success).toBe(false);
    });

    it('configures cash payments', async () => {
      expect(
        (
          await handleConfigureCashPaymentsLogic(
            buildDeps(),
            'biz-1',
            {},
            'Enable cash payments',
          )
        ).success,
      ).toBe(true);
      expect(
        (
          await handleConfigureCashPaymentsLogic(buildDeps(), 'biz-1', {
            acceptCashPayments: false,
          })
        ).success,
      ).toBe(true);
      expect(
        (
          await handleConfigureCashPaymentsLogic(
            buildDeps(),
            'biz-1',
            {},
            'cash payments',
          )
        ).success,
      ).toBe(false);
      expect(
        (await handleConfigureCashPaymentsLogic(buildDeps(), 'biz-1', {}))
          .success,
      ).toBe(false);
      expect(
        (
          await handleConfigureCashPaymentsLogic(
            buildDeps({
              businessRepo: {
                findOne: jest.fn(async () => null),
                save: jest.fn(),
              } as any,
            }),
            'biz-1',
            { acceptCashPayments: true },
          )
        ).success,
      ).toBe(false);
    });

    it('configures service online payment', async () => {
      const result = await handleConfigureServiceOnlinePaymentLogic(
        buildDeps(),
        'biz-1',
        {},
        'Accept online payment on public booking for all services with 50% prepayment',
        services,
      );
      expect(result.success).toBe(true);
      expect(result.details?.updatedCount).toBe(2);

      const single = await handleConfigureServiceOnlinePaymentLogic(
        buildDeps(),
        'biz-1',
        {},
        'Accept online payment on public booking for Massage with full prepayment',
        services,
      );
      expect(single.success).toBe(true);

      const missingScope = await handleConfigureServiceOnlinePaymentLogic(
        buildDeps(),
        'biz-1',
        { prepaymentMode: 'full' },
        'Enable online payment',
        services,
      );
      expect(missingScope.success).toBe(false);

      const stripeFail = await handleConfigureServiceOnlinePaymentLogic(
        buildDeps({
          serviceService: {
            update: jest.fn(async () => {
              throw new Error(
                'Connect your Stripe account in Dashboard → Billing before enabling online payment for a service',
              );
            }),
          } as any,
        }),
        'biz-1',
        {},
        'Accept online payment on public booking for all services with full prepayment',
        services,
      );
      expect(stripeFail.success).toBe(false);

      const declineAll = await handleConfigureServiceOnlinePaymentLogic(
        buildDeps(),
        'biz-1',
        {},
        'Decline online payment on public booking for all services',
        services,
      );
      expect(declineAll.success).toBe(true);
      expect(declineAll.summary).toContain('disabled');

      const declineOne = await handleConfigureServiceOnlinePaymentLogic(
        buildDeps(),
        'biz-1',
        {},
        'Decline online payment on public booking for Massage',
        services,
      );
      expect(declineOne.success).toBe(true);
      expect(declineOne.details?.prepaymentMode).toBe('none');
    });

    it('adjusts gift card balances', async () => {
      expect(
        (await handleAdjustGiftCardBalanceLogic(buildDeps(), 'biz-1', {}))
          .success,
      ).toBe(false);
      expect(
        (
          await handleAdjustGiftCardBalanceLogic(
            buildDeps(),
            'biz-1',
            { giftCardCode: 'GCM-ABCD1234', delta: 10 },
            'u1',
          )
        ).success,
      ).toBe(true);
      expect(
        (
          await handleAdjustGiftCardBalanceLogic(buildDeps(), 'biz-1', {
            giftCardId: 'gc-1',
            newBalance: 60,
          })
        ).success,
      ).toBe(true);
      expect(
        (
          await handleAdjustGiftCardBalanceLogic(buildDeps(), 'biz-1', {
            giftCardCode: 'GCM-ABCD1234',
          })
        ).success,
      ).toBe(false);
      const bundleCard = await handleAdjustGiftCardBalanceLogic(
        buildDeps({
          giftCardRepo: {
            findOne: jest.fn(async () => ({ ...baseCard, cardType: 'bundle' })),
            save: jest.fn(),
          } as any,
        }),
        'biz-1',
        { giftCardCode: 'GCM-ABCD1234', delta: 10 },
      );
      expect(bundleCard.success).toBe(false);
      const negative = await handleAdjustGiftCardBalanceLogic(
        buildDeps(),
        'biz-1',
        {
          giftCardCode: 'GCM-ABCD1234',
          newBalance: -1,
        },
      );
      expect(negative.success).toBe(false);
    });

    it('extends gift card expiry and refunds orders', async () => {
      expect(
        (
          await handleExtendGiftCardExpiryLogic(
            buildDeps(),
            'biz-1',
            {},
            'admin',
          )
        ).success,
      ).toBe(false);
      expect(
        (
          await handleExtendGiftCardExpiryLogic(
            buildDeps(),
            'biz-1',
            { giftCardId: 'gc-1', extendMonths: 3 },
            'admin',
          )
        ).success,
      ).toBe(true);
      const cleared = await handleExtendGiftCardExpiryLogic(
        buildDeps({
          giftCardsService: {
            updateExpiration: jest.fn(async () => ({
              id: 'gc-1',
              expiresAt: null,
            })),
          } as any,
        }),
        'biz-1',
        { giftCardId: 'gc-1', expiresAt: null },
        'admin',
      );
      expect(cleared.summary).toContain('cleared');
      const extendFail = await handleExtendGiftCardExpiryLogic(
        buildDeps({
          giftCardsService: {
            updateExpiration: jest.fn(async () => {
              throw new Error('bad');
            }),
          } as any,
        }),
        'biz-1',
        { giftCardCode: 'GCM-ABCD1234', extendDays: 7 },
        'admin',
      );
      expect(extendFail.success).toBe(false);
      expect(
        (
          await handleRefundGiftCardOrderLogic(buildDeps(), 'biz-1', {
            giftCardId: 'gc-1',
            reason: 'Customer changed their mind',
          })
        ).success,
      ).toBe(true);
      const refundNoReason = await handleRefundGiftCardOrderLogic(
        buildDeps(),
        'biz-1',
        { giftCardId: 'gc-1' },
      );
      expect(refundNoReason.success).toBe(false);
      expect(refundNoReason.details).toMatchObject({
        clarify: true,
        missing: ['reason'],
      });
      expect(
        (await handleRefundGiftCardOrderLogic(buildDeps(), 'biz-1', {}))
          .success,
      ).toBe(false);
    });
  });

  describe('provider handlers', () => {
    it('explains payment status and confirms cash', async () => {
      expect(
        (await handleExplainPaymentStatusLogic(buildDeps(), 'biz-1', {}))
          .success,
      ).toBe(false);
      expect(
        (
          await handleExplainPaymentStatusLogic(buildDeps(), 'biz-1', {
            bookingId: 'b1',
          })
        ).success,
      ).toBe(true);
      const pendingOnline = await handleExplainPaymentStatusLogic(
        buildDeps({
          bookingRepo: {
            findOne: jest.fn(async () => ({
              id: 'b4',
              businessId: 'biz-1',
              paymentStatus: PaymentStatus.PENDING,
              metadata: {},
              service: { price: 80 },
              customer: { name: 'Pat' },
            })),
          } as any,
        }),
        'biz-1',
        { bookingId: 'b4' },
      );
      expect(pendingOnline.summary).toContain('awaiting online');
      const paid = await handleExplainPaymentStatusLogic(
        buildDeps({
          bookingRepo: {
            findOne: jest.fn(async () => ({
              id: 'b2',
              businessId: 'biz-1',
              paymentStatus: PaymentStatus.PAID,
              metadata: { paidVia: 'cash' },
              service: { price: 80 },
              customer: { name: 'Sam' },
            })),
          } as any,
        }),
        'biz-1',
        { bookingId: 'b2' },
      );
      expect(paid.summary).toContain('Paid');
      expect(
        (
          await handleCollectCashConfirmLogic(
            buildDeps(),
            'biz-1',
            { bookingId: 'b1' },
            'p1',
          )
        ).success,
      ).toBe(true);
      expect(
        (await handleCollectCashConfirmLogic(buildDeps(), 'biz-1', {})).success,
      ).toBe(false);
      const notCash = await handleCollectCashConfirmLogic(
        buildDeps({
          bookingRepo: {
            findOne: jest.fn(async () => ({
              id: 'b3',
              businessId: 'biz-1',
              paymentStatus: PaymentStatus.PAID,
              metadata: {},
            })),
            save: jest.fn(),
          } as any,
        }),
        'biz-1',
        { bookingId: 'b3' },
      );
      expect(notCash.success).toBe(false);
    });
  });

  describe('customer handlers', () => {
    it('checks providers and books nearest slots', async () => {
      expect(
        (
          await handleCheckProvidersForServiceLogic(
            buildDeps(),
            'biz-1',
            {},
            'for massage tomorrow evening',
          )
        ).success,
      ).toBe(false);
      expect(
        (
          await handleCheckProvidersForServiceLogic(
            buildDeps(),
            'biz-1',
            { serviceName: 'Massage' },
            'tomorrow evening',
          )
        ).success,
      ).toBe(true);
      const noProviders = await handleCheckProvidersForServiceLogic(
        buildDeps({
          publicBookingService: {
            recommendProviders: jest.fn(async () => ({ providers: [] })),
          } as any,
        }),
        'biz-1',
        { serviceName: 'Massage' },
        'tomorrow',
      );
      expect(noProviders.summary).toContain('No providers');
      const providerFail = await handleCheckProvidersForServiceLogic(
        buildDeps({
          publicBookingService: {
            recommendProviders: jest.fn(async () => {
              throw new Error('down');
            }),
          } as any,
        }),
        'biz-1',
        { serviceName: 'Massage' },
      );
      expect(providerFail.success).toBe(false);

      expect(
        (
          await handleBookNearestSlotLogic(
            buildDeps(),
            'biz-1',
            {},
            'nearest available slot',
          )
        ).success,
      ).toBe(false);
      expect(
        (
          await handleBookNearestSlotLogic(
            buildDeps(),
            'biz-1',
            { serviceName: 'Haircut' },
            'tomorrow evening',
          )
        ).success,
      ).toBe(true);
      const noSlot = await handleBookNearestSlotLogic(
        buildDeps({
          publicBookingService: {
            findNearestBookableSlot: jest.fn(async () => null),
          } as any,
        }),
        'biz-1',
        { serviceName: 'Haircut' },
      );
      expect(noSlot.success).toBe(false);
    });

    it('handles gift card checkout flows', async () => {
      expect(
        (
          await handleApplyGiftCardCodeLogic(
            buildDeps(),
            'biz-1',
            {},
            'apply gift card',
          )
        ).success,
      ).toBe(false);
      expect(
        (await handleApplyGiftCardCodeLogic(buildDeps(), 'biz-1', {})).success,
      ).toBe(false);
      expect(
        (
          await handleApplyGiftCardCodeLogic(buildDeps(), 'biz-1', {
            giftCardCode: 'GCM-ABCD1234',
            serviceName: 'Massage',
          })
        ).success,
      ).toBe(true);
      const applyFail = await handleApplyGiftCardCodeLogic(
        buildDeps({
          giftCardsService: {
            validate: jest.fn(async () => {
              throw new Error('bad');
            }),
            getBalanceView: jest.fn(),
          } as any,
        }),
        'biz-1',
        { giftCardCode: 'GCM-BAD' },
      );
      expect(applyFail.success).toBe(false);
      expect(
        (
          await handleCheckGiftCardBalanceLogic(buildDeps(), 'biz-1', {
            giftCardCode: 'GCM-ABCD1234',
          })
        ).success,
      ).toBe(true);
      const balanceFail = await handleCheckGiftCardBalanceLogic(
        buildDeps(),
        'biz-1',
        {},
      );
      expect(balanceFail.success).toBe(false);
      const balanceThrow = await handleCheckGiftCardBalanceLogic(
        buildDeps({
          giftCardsService: {
            getBalanceView: jest.fn(async () => {
              throw new Error('not found');
            }),
          } as any,
        }),
        'biz-1',
        { giftCardCode: 'GCM-MISSING' },
      );
      expect(balanceThrow.success).toBe(false);
    });

    it('quotes gift card purchases', async () => {
      expect(
        (
          await handleBuyGiftCardLogic(
            buildDeps(),
            'biz-1',
            { amount: 50 },
            false,
          )
        ).success,
      ).toBe(true);
      expect(
        (
          await handleBuyGiftCardLogic(
            buildDeps(),
            'biz-1',
            { amount: 50 },
            true,
          )
        ).success,
      ).toBe(true);
      const disabled = await handleBuyGiftCardLogic(
        buildDeps({
          giftCardPurchaseService: {
            getPublicCatalog: jest.fn(async () => ({ purchaseEnabled: false })),
          } as any,
        }),
        'biz-1',
        { amount: 50 },
        false,
      );
      expect(disabled.success).toBe(false);
      const noPreset = await handleBuyGiftCardLogic(
        buildDeps({
          giftCardPurchaseService: {
            getPublicCatalog: jest.fn(async () => ({
              purchaseEnabled: true,
              settings: { presetAmounts: [] },
            })),
            quotePurchase: jest.fn(),
          } as any,
        }),
        'biz-1',
        {},
        false,
      );
      expect(noPreset.success).toBe(false);
      const noPresetPhysical = await handleBuyGiftCardLogic(
        buildDeps({
          giftCardPurchaseService: {
            getPublicCatalog: jest.fn(async () => ({
              purchaseEnabled: true,
              settings: { presetAmounts: [] },
            })),
            quotePurchase: jest.fn(),
          } as any,
        }),
        'biz-1',
        {},
        true,
      );
      expect(noPresetPhysical.action).toBe('buy_gift_card_physical');
      const quoteFail = await handleBuyGiftCardLogic(
        buildDeps({
          giftCardPurchaseService: {
            getPublicCatalog: jest.fn(async () => ({
              purchaseEnabled: true,
              settings: { presetAmounts: [50] },
            })),
            quotePurchase: jest.fn(async () => {
              throw new Error('quote fail');
            }),
          } as any,
        }),
        'biz-1',
        { amount: 50 },
        false,
      );
      expect(quoteFail.success).toBe(false);
    });

    it('quotes a gift card without buying it', async () => {
      const quote = await handleGetGiftCardQuoteLogic(buildDeps(), 'biz-1', {
        amount: 50,
      });
      expect(quote.success).toBe(true);
      expect(quote.action).toBe('get_gift_card_quote');
      expect((quote.details as any).quote.total).toBe(55);

      const nonMonetary = await handleGetGiftCardQuoteLogic(buildDeps(), 'biz-1', {
        cardType: 'package',
        packageId: 'pkg-1',
        deliveryMethod: 'digital',
      });
      expect(nonMonetary.success).toBe(true);

      const disabled = await handleGetGiftCardQuoteLogic(
        buildDeps({
          giftCardPurchaseService: {
            getPublicCatalog: jest.fn(async () => ({ purchaseEnabled: false })),
          } as any,
        }),
        'biz-1',
        { amount: 50 },
      );
      expect(disabled.success).toBe(false);

      const missingAmount = await handleGetGiftCardQuoteLogic(
        buildDeps({
          giftCardPurchaseService: {
            getPublicCatalog: jest.fn(async () => ({
              purchaseEnabled: true,
              settings: { presetAmounts: [] },
            })),
            quotePurchase: jest.fn(),
          } as any,
        }),
        'biz-1',
        {},
      );
      expect(missingAmount.success).toBe(false);
      expect(missingAmount.details?.clarify).toBe(true);

      const quoteFailure = await handleGetGiftCardQuoteLogic(
        buildDeps({
          giftCardPurchaseService: {
            getPublicCatalog: jest.fn(async () => ({
              purchaseEnabled: true,
              settings: { presetAmounts: [50] },
            })),
            quotePurchase: jest.fn(async () => {
              throw new Error('quote fail');
            }),
          } as any,
        }),
        'biz-1',
        { amount: 50 },
      );
      expect(quoteFailure.success).toBe(false);
    });

    it('resolves payment methods and subscription checkout', async () => {
      const methods = await handleChoosePaymentMethodLogic(
        buildDeps(),
        'biz-1',
      );
      expect(methods.success).toBe(true);
      expect(methods.summary).toContain('Payment options');
      const noMethods = await handleChoosePaymentMethodLogic(
        buildDeps({
          businessRepo: {
            findOne: jest.fn(async () => ({
              id: 'biz-1',
              settings: {
                publicBooking: { acceptCashPayments: false },
                integrations: { stripe: { connectAccountId: 'acct_1' } },
              },
            })),
          } as any,
        }),
        'biz-1',
      );
      expect(noMethods.success).toBe(true);
      expect(noMethods.summary).toContain('cash at venue is not enabled');
      const payOnlineNoSlot = await handlePayOnlineLogic(buildDeps(), 'biz-1');
      expect(payOnlineNoSlot.success).toBe(false);
      expect(payOnlineNoSlot.summary).toContain('Pick a time slot first');
      const payOnlineWithSlot = await handlePayOnlineLogic(
        buildDeps(),
        'biz-1',
        {
          serviceId: 's1',
          employeeId: 'e1',
          startTime: '2026-06-06T18:00:00Z',
        },
      );
      expect(payOnlineWithSlot.success).toBe(true);
      expect(payOnlineWithSlot.details?.navigate).toEqual({
        path: 'checkout',
        query: {
          serviceId: 's1',
          employeeId: 'e1',
          startTime: '2026-06-06T18:00:00Z',
          payment: 'online',
        },
      });
      expect(payOnlineWithSlot.details?.sessionContext).toEqual({
        paymentMethod: 'online',
      });
      // e2e-bug.229 — named service must not wipe checkout slot identity.
      const payOnlineNamedSwedish = await handlePayOnlineLogic(
        buildDeps(),
        'biz-1',
        {
          serviceId: 's1',
          employeeId: 'e1',
          startTime: '2026-06-06T18:00:00Z',
          serviceName: 'Swedish massage booking',
        },
        'pay online for my Swedish massage booking',
      );
      expect(payOnlineNamedSwedish.success).toBe(true);
      expect(payOnlineNamedSwedish.summary).not.toContain(
        'Pick a time slot first',
      );
      expect(payOnlineNamedSwedish.details?.navigate).toEqual({
        path: 'checkout',
        query: {
          serviceId: 's1',
          employeeId: 'e1',
          startTime: '2026-06-06T18:00:00Z',
          payment: 'online',
        },
      });
      const noStripe = await handlePayOnlineLogic(
        buildDeps({
          businessRepo: {
            findOne: jest.fn(async () => ({ id: 'biz-1', settings: {} })),
          } as any,
        }),
        'biz-1',
      );
      expect(noStripe.success).toBe(false);
      const cashVisit = await handlePayCashAtVisitLogic(buildDeps(), 'biz-1');
      expect(cashVisit.success).toBe(true);
      expect(cashVisit.summary).toContain('pay at your appointment');
      const noCash = await handlePayCashAtVisitLogic(
        buildDeps({
          businessRepo: {
            findOne: jest.fn(async () => ({
              id: 'biz-1',
              settings: { publicBooking: { acceptCashPayments: false } },
            })),
          } as any,
        }),
        'biz-1',
      );
      expect(noCash.success).toBe(false);
      expect(noCash.summary).toContain('not enabled');
      expect(
        (
          await handlePurchaseSubscriptionCheckoutLogic(buildDeps(), 'biz-1', {
            planId: 'plan-1',
          })
        ).success,
      ).toBe(true);
      expect(
        (
          await handlePurchaseSubscriptionCheckoutLogic(
            buildDeps(),
            'biz-1',
            {},
          )
        ).success,
      ).toBe(false);
      const subFail = await handlePurchaseSubscriptionCheckoutLogic(
        buildDeps({
          subscriptionsService: {
            getPlanCheckoutDetails: jest.fn(async () => {
              throw new Error('missing');
            }),
          } as any,
        }),
        'biz-1',
        { planId: 'x' },
      );
      expect(subFail.success).toBe(false);
    });

    it('explains service-specific cash availability at checkout', async () => {
      const deps = buildDeps({
        businessRepo: {
          findOne: jest.fn(async () => ({
            id: 'biz-1',
            settings: {
              publicBooking: { acceptCashPayments: true },
              integrations: { stripe: { connectAccountId: 'acct_1' } },
            },
          })),
        } as any,
        serviceRepo: {
          find: jest.fn(async () => [
            {
              id: 'svc-1',
              name: 'Color',
              price: 120,
              prepaymentMode: 'full',
              isActive: true,
              businessId: 'biz-1',
            },
          ]),
        } as any,
      });
      const options = await handleChoosePaymentMethodLogic(
        deps,
        'biz-1',
        { serviceName: 'Color' },
        'Can I pay cash for color?',
      );
      expect(options.success).toBe(true);
      expect(options.details?.serviceCash).toMatchObject({
        prepaymentBlocksCashOnly: true,
      });
      const payCash = await handlePayCashAtVisitLogic(
        deps,
        'biz-1',
        { serviceName: 'Color' },
        'Pay cash at visit for color',
      );
      expect(payCash.success).toBe(false);
      expect(payCash.summary).toContain('full payment online');
    });

    it('explains stripe requirement and receipt status', async () => {
      expect(
        (await handleExplainWhyStripeRequiredLogic(buildDeps(), 'biz-1'))
          .success,
      ).toBe(true);
      const cashOnly = await handleExplainWhyStripeRequiredLogic(
        buildDeps({
          businessRepo: {
            findOne: jest.fn(async () => ({
              id: 'biz-1',
              settings: {
                publicBooking: { acceptCashPayments: true },
                integrations: {},
              },
            })),
          } as any,
        }),
        'biz-1',
      );
      expect(cashOnly.success).toBe(true);
      const onlineOnly = await handleExplainWhyStripeRequiredLogic(
        buildDeps({
          businessRepo: {
            findOne: jest.fn(async () => ({
              id: 'biz-1',
              settings: {
                publicBooking: { acceptCashPayments: false },
                integrations: { stripe: { connectAccountId: 'acct_1' } },
              },
            })),
          } as any,
        }),
        'biz-1',
      );
      expect(onlineOnly.summary).toContain('only');
      const servicePrepayment = await handleExplainWhyStripeRequiredLogic(
        buildDeps(),
        'biz-1',
        {},
        'Why prepayment for massage?',
      );
      expect(servicePrepayment.success).toBe(true);
      expect(servicePrepayment.summary).toContain('50% deposit');
      expect((servicePrepayment.details as any).amountDueNow).toBe(40);
      const noPrepayment = await handleExplainWhyStripeRequiredLogic(
        buildDeps(),
        'biz-1',
        {},
        'Why prepayment for haircut?',
      );
      expect(noPrepayment.success).toBe(true);
      expect(noPrepayment.summary).toContain(
        'does not require online prepayment',
      );
      const noPrepaymentCheckout = await handleExplainCheckoutTotalLogic(
        buildDeps(),
        'biz-1',
        { _prompt: 'How much do I pay today for haircut?' },
      );
      expect(noPrepaymentCheckout.success).toBe(true);
      expect((noPrepaymentCheckout.details as any).prepaymentDue).toBe(0);
      expect((noPrepaymentCheckout.details as any).amountDue).toBe(40);
      const catalogDeposit = await handleExplainWhyStripeRequiredLogic(
        buildDeps(),
        'biz-1',
        {},
        'Do I pay online for this service?',
        { serviceId: 's1', serviceName: 'Massage' },
      );
      expect(catalogDeposit.success).toBe(true);
      expect(catalogDeposit.summary).toMatch(/^Yes —/);
      expect((catalogDeposit.details as any).prepaymentMode).toBe(
        PrepaymentMode.DEPOSIT,
      );
      const catalogNone = await handleExplainWhyStripeRequiredLogic(
        buildDeps(),
        'biz-1',
        {},
        'Do I pay online for the selected service?',
        { serviceId: 's2', serviceName: 'Haircut' },
      );
      expect(catalogNone.success).toBe(true);
      expect(catalogNone.summary).toMatch(/^No —/);
      expect(
        (
          await handleExplainWhyStripeRequiredLogic(
            buildDeps(),
            'biz-1',
            {},
            'Do I pay online for this service?',
            {},
          )
        ).success,
      ).toBe(false);
      expect(
        (
          await handleExplainCheckoutTotalLogic(
            buildDeps(),
            'biz-1',
            {
              _prompt: 'How much do I pay today for this service?',
            },
            { serviceId: 's1', serviceName: 'Massage' },
          )
        ).success,
      ).toBe(true);
      expect(
        (
          await handleReceiptStatusLogic(buildDeps(), 'biz-1', {
            bookingId: 'b-paid',
          })
        ).success,
      ).toBe(true);
      expect(
        (
          await handleReceiptStatusLogic(buildDeps(), 'biz-1', {
            bookingId: 'b1',
          })
        ).summary,
      ).toContain('unavailable');
      const receiptSent = await handleReceiptStatusLogic(
        buildDeps({
          bookingRepo: {
            findOne: jest.fn(async () => ({
              id: 'b5',
              businessId: 'biz-1',
              paymentStatus: PaymentStatus.PAID,
              metadata: { confirmationEmailSent: true },
            })),
          } as any,
        }),
        'biz-1',
        { bookingId: 'b5' },
      );
      expect(receiptSent.summary).toContain('Receipt sent');
      expect(
        (
          await handleExplainWhyStripeRequiredLogic(
            buildDeps({
              businessRepo: { findOne: jest.fn(async () => null) } as any,
            }),
            'biz-1',
          )
        ).success,
      ).toBe(false);
      expect(
        (await handleReceiptStatusLogic(buildDeps(), 'biz-1', {})).success,
      ).toBe(false);
    });

    // e2e-bug.188 — confirm_stripe_payment only ever read params.sessionId,
    // so "did my payment go through?" always failed with "missing session"
    // even though the widget's own assistantContext carries an in-progress
    // checkout as pendingCheckoutSessionId (ConsumerBookingAssistant.tsx).
    it('confirm_stripe_payment resolves sessionId from context and fails clean when absent', async () => {
      const missing = await handleConfirmStripePaymentLogic(buildDeps(), 'biz-1');
      expect(missing.success).toBe(false);
      expect(missing.summary).toContain('Missing the Stripe checkout session');
      expect(missing.details).toEqual({ clarify: true, missing: ['sessionId'] });

      const explicit = await handleConfirmStripePaymentLogic(buildDeps(), 'biz-1', {
        sessionId: 'cs_test_explicit',
      });
      expect(explicit.success).toBe(true);
      expect(explicit.summary).toContain('Payment confirmed');

      const fromPending = await handleConfirmStripePaymentLogic(buildDeps(), 'biz-1', {
        pendingCheckoutSessionId: 'cs_test_pending',
      });
      expect(fromPending.success).toBe(true);
      expect(fromPending.details?.sessionContext).toEqual({
        paymentMethod: 'online',
      });

      const failed = await handleConfirmStripePaymentLogic(
        buildDeps({
          bookingPaymentService: {
            confirmCheckoutSession: jest.fn(async () => {
              throw new Error('Payment not complete yet');
            }),
          } as any,
        }),
        'biz-1',
        { sessionId: 'cs_test_incomplete' },
      );
      expect(failed.success).toBe(false);
      expect(failed.summary).toContain('Payment not complete yet');
      expect(failed.details).toEqual({
        sessionId: 'cs_test_incomplete',
        reason: 'confirm_failed',
      });
    });
  });

  describe('handlePaymentsCompoundLogic', () => {
    it('runs multi-step payments compound with context passing', async () => {
      const ok = await handlePaymentsCompoundLogic(
        buildDeps(),
        'biz-1',
        'Check who is available tomorrow evening for massage and book the nearest slot and apply my gift card',
        { giftCardCode: 'GCM-ABCD1234' },
        'user-1',
      );
      expect(ok.success).toBe(true);
      expect((ok.details as any).paymentsCompound).toBe(true);

      const withoutParams = await handlePaymentsCompoundLogic(
        buildDeps(),
        'biz-1',
        'Who is available tomorrow evening for massage and book the nearest slot',
        undefined as any,
      );
      expect(withoutParams.success).toBe(true);

      const fail = await handlePaymentsCompoundLogic(
        buildDeps(),
        'biz-1',
        'hello world',
        {},
      );
      expect(fail.success).toBe(false);

      const stopped = await handlePaymentsCompoundLogic(
        buildDeps(),
        'biz-1',
        'x',
        {
          compoundSteps: [
            { action: 'book_nearest_slot', params: {}, segment: 'a' },
            {
              action: 'apply_gift_card_code',
              params: { giftCardCode: 'GCM-ABCD1234' },
              segment: 'b',
            },
          ],
        },
      );
      expect(stopped.success).toBe(false);

      const flow = await handlePaymentsCompoundLogic(
        buildDeps(),
        'biz-1',
        'x',
        {
          compoundSteps: [
            {
              action: 'check_providers_for_service',
              params: { serviceName: 'Massage' },
              segment: 'a',
            },
            {
              action: 'book_nearest_slot',
              params: { serviceName: 'Massage' },
              segment: 'b',
            },
            {
              action: 'apply_gift_card_code',
              params: { giftCardCode: 'GCM-ABCD1234' },
              segment: 'c',
            },
            { action: 'choose_payment_method', params: {}, segment: 'd' },
          ],
        },
        'user-2',
      );
      expect(flow.success).toBe(true);

      const dashboardCompound = await handlePaymentsCompoundLogic(
        buildDeps(),
        'biz-1',
        'x',
        {
          compoundSteps: [
            { action: 'summarize_unpaid', params: {}, segment: 'a' },
            {
              action: 'validate_gift_card',
              params: { giftCardCode: 'GCM-ABCD1234' },
              segment: 'b',
            },
            { action: 'export_accounting', params: {}, segment: 'c' },
            { action: 'export_commissions', params: {}, segment: 'd' },
          ],
        },
      );
      expect(dashboardCompound.success).toBe(true);

      const mutateCompound = await handlePaymentsCompoundLogic(
        buildDeps(),
        'biz-1',
        'x',
        {
          compoundSteps: [
            {
              action: 'configure_cash_payments',
              params: { acceptCashPayments: true },
              segment: 'a',
            },
            {
              action: 'adjust_gift_card_balance',
              params: { giftCardId: 'gc-1', delta: 5 },
              segment: 'b',
            },
            {
              action: 'extend_gift_card_expiry',
              params: { giftCardId: 'gc-1', extendMonths: 1 },
              segment: 'c',
            },
            {
              action: 'refund_gift_card_order',
              params: { giftCardId: 'gc-1', reason: 'Goodwill refund' },
              segment: 'd',
            },
          ],
        },
        'admin',
      );
      expect(mutateCompound.success).toBe(true);

      const providerCompound = await handlePaymentsCompoundLogic(
        buildDeps(),
        'biz-1',
        'x',
        {
          compoundSteps: [
            {
              action: 'explain_payment_status',
              params: { bookingId: 'b1' },
              segment: 'a',
            },
            {
              action: 'collect_cash_confirm',
              params: { bookingId: 'b1' },
              segment: 'b',
            },
            {
              action: 'explain_checkout_total',
              params: { serviceName: 'Massage' },
              segment: 'c',
            },
            { action: 'list_subscription_revenue', params: {}, segment: 'd' },
          ],
        },
        'p1',
      );
      expect(providerCompound.success).toBe(true);

      const customerCompound = await handlePaymentsCompoundLogic(
        buildDeps(),
        'biz-1',
        'x',
        {
          compoundSteps: [
            { action: 'buy_gift_card', params: { amount: 50 }, segment: 'a' },
            {
              action: 'buy_gift_card_physical',
              params: { amount: 50 },
              segment: 'b',
            },
            {
              action: 'pay_online',
              params: {
                serviceId: 's2',
                employeeId: 'e1',
                startTime: '2026-06-06T18:00:00Z',
              },
              segment: 'c',
            },
            { action: 'pay_cash_at_visit', params: {}, segment: 'd' },
          ],
        },
      );
      expect(customerCompound.success).toBe(true);

      const tailCompound = await handlePaymentsCompoundLogic(
        buildDeps(),
        'biz-1',
        'x',
        {
          compoundSteps: [
            {
              action: 'purchase_subscription_checkout',
              params: { planId: 'plan-1' },
              segment: 'a',
            },
            { action: 'explain_why_stripe_required', params: {}, segment: 'b' },
            {
              action: 'receipt_status',
              params: { bookingId: 'b-paid' },
              segment: 'c',
            },
            {
              action: 'check_gift_card_balance',
              params: { giftCardCode: 'GCM-ABCD1234' },
              segment: 'd',
            },
          ],
        },
      );
      expect(tailCompound.success).toBe(true);

      const unsupported = await handlePaymentsCompoundLogic(
        buildDeps(),
        'biz-1',
        'x',
        {
          compoundSteps: [
            { action: 'merge_customers' as any, params: {}, segment: 'a' },
            { action: 'summarize_unpaid', params: {}, segment: 'b' },
          ],
        },
      );
      expect(unsupported.success).toBe(false);
    });
  });

  describe('branch coverage', () => {
    it('covers optional branches across handlers', async () => {
      expect(
        (
          await handleValidateGiftCardLogic(buildDeps(), 'biz-1', {
            _prompt: 'GCM-ABCD1234',
          })
        ).success,
      ).toBe(true);
      expect(
        (
          await handleValidateGiftCardLogic(
            buildDeps({
              giftCardsService: {
                validate: jest.fn(async () => {
                  throw {};
                }),
                getBalanceView: jest.fn(),
              } as any,
            }),
            'biz-1',
            { giftCardCode: 'GCM-ABCD1234' },
          )
        ).summary,
      ).toBe('Gift card validation failed.');

      const csv =
        'short\nonly,one\n2026-01-01,income,subscription,x,10,USD,ref\n';
      const revenue = await handleListSubscriptionRevenueLogic(
        buildDeps({
          accountingIntegrationService: {
            generateExport: jest.fn(async () => ({
              content: csv,
              rowCount: 0,
              format: 'csv',
              filename: 'x.csv',
              provider: 'csv',
            })),
          } as any,
        }),
        'biz-1',
        {},
      );
      expect(revenue.success).toBe(true);

      expect(
        (
          await handleChoosePaymentMethodLogic(
            buildDeps({
              businessRepo: {
                findOne: jest.fn(async () => ({
                  id: 'biz-1',
                  settings: {
                    publicBooking: { acceptCashPayments: true },
                    integrations: {},
                  },
                })),
              } as any,
            }),
            'biz-1',
          )
        ).success,
      ).toBe(true);

      expect(
        (
          await handleApplyGiftCardCodeLogic(buildDeps(), 'biz-1', {
            giftCardCode: 'GCM-ABCD1234',
          })
        ).success,
      ).toBe(true);
      const applyNoService = await handleApplyGiftCardCodeLogic(
        buildDeps({
          giftCardsService: {
            validate: jest.fn(async () => baseCard),
            getBalanceView: jest.fn(async () => ({
              code: 'GCM-ABCD1234',
              balance: 50,
              cardType: 'monetary',
              currency: 'USD',
              expiresAt: null,
              isActive: true,
              serviceCredits: [],
            })),
          } as any,
        }),
        'biz-1',
        { giftCardCode: 'GCM-ABCD1234' },
      );
      expect((applyNoService.details as any).servicePrice).toBeNull();

      const compoundBalance = await handlePaymentsCompoundLogic(
        buildDeps(),
        'biz-1',
        'x',
        {
          compoundSteps: [
            {
              action: 'check_gift_card_balance',
              params: { giftCardCode: 'GCM-ABCD1234' },
              segment: 'a',
            },
            { action: 'apply_gift_card_code', params: {}, segment: 'b' },
          ],
        },
      );
      expect(compoundBalance.success).toBe(true);

      expect(
        (
          await handleExplainCheckoutTotalLogic(buildDeps(), 'biz-1', {
            serviceName: 'Massage',
          })
        ).summary,
      ).not.toContain('gift card');

      expect(
        (
          await handleChoosePaymentMethodLogic(
            buildDeps({
              businessRepo: {
                findOne: jest.fn(async () => ({
                  id: 'biz-1',
                  settings: undefined,
                })),
              } as any,
            }),
            'biz-1',
          )
        ).success,
      ).toBe(false);

      expect(
        (
          await handleListSubscriptionRevenueLogic(
            buildDeps({
              accountingIntegrationService: {
                generateExport: jest.fn(async () => ({
                  content:
                    'Date,Type,IncomeSubType,Description,Amount,Currency,Reference\n2026-01-01,income,subscription,x,,USD,ref',
                  rowCount: 1,
                  format: 'csv',
                  filename: 'x.csv',
                  provider: 'csv',
                })),
              } as any,
            }),
            'biz-1',
            {},
          )
        ).success,
      ).toBe(true);

      for (const handler of [
        () =>
          handleExportAccountingLogic(
            buildDeps({
              accountingIntegrationService: {
                generateExport: jest.fn(async () => {
                  throw {};
                }),
              } as any,
            }),
            'biz-1',
            {},
          ),
        () =>
          handleExportCommissionsLogic(
            buildDeps({
              commissionsService: {
                exportPayoutCsv: jest.fn(async () => {
                  throw {};
                }),
              } as any,
            }),
            'biz-1',
            {},
          ),
        () =>
          handleListSubscriptionRevenueLogic(
            buildDeps({
              accountingIntegrationService: {
                generateExport: jest.fn(async () => {
                  throw {};
                }),
              } as any,
            }),
            'biz-1',
            {},
          ),
        () =>
          handleCheckProvidersForServiceLogic(
            buildDeps({
              publicBookingService: {
                recommendProviders: jest.fn(async () => {
                  throw {};
                }),
              } as any,
            }),
            'biz-1',
            { serviceName: 'Massage' },
          ),
        () =>
          handleApplyGiftCardCodeLogic(
            buildDeps({
              giftCardsService: {
                validate: jest.fn(async () => {
                  throw {};
                }),
                getBalanceView: jest.fn(),
              } as any,
            }),
            'biz-1',
            { giftCardCode: 'X' },
          ),
        () =>
          handleBuyGiftCardLogic(
            buildDeps({
              giftCardPurchaseService: {
                getPublicCatalog: jest.fn(async () => ({
                  purchaseEnabled: true,
                  settings: { presetAmounts: [50] },
                })),
                quotePurchase: jest.fn(async () => {
                  throw {};
                }),
              } as any,
            }),
            'biz-1',
            { amount: 50 },
            false,
          ),
        () =>
          handleBuyGiftCardLogic(
            buildDeps({
              giftCardPurchaseService: {
                getPublicCatalog: jest.fn(async () => ({
                  purchaseEnabled: true,
                  settings: { presetAmounts: [50] },
                })),
                quotePurchase: jest.fn(async () => {
                  throw {};
                }),
              } as any,
            }),
            'biz-1',
            { amount: 50 },
            true,
          ),
        () =>
          handlePurchaseSubscriptionCheckoutLogic(
            buildDeps({
              subscriptionsService: {
                getPlanCheckoutDetails: jest.fn(async () => {
                  throw {};
                }),
              } as any,
            }),
            'biz-1',
            { planId: 'p1' },
          ),
        () =>
          handleExtendGiftCardExpiryLogic(
            buildDeps({
              giftCardsService: {
                updateExpiration: jest.fn(async () => {
                  throw {};
                }),
              } as any,
            }),
            'biz-1',
            { giftCardCode: 'GCM-ABCD1234' },
          ),
        () =>
          handleCheckGiftCardBalanceLogic(
            buildDeps({
              giftCardsService: {
                getBalanceView: jest.fn(async () => {
                  throw {};
                }),
              } as any,
            }),
            'biz-1',
            { giftCardCode: 'X' },
          ),
      ]) {
        const result = await handler();
        expect(result.success).toBe(false);
      }

      expect(
        (
          await handleCollectCashConfirmLogic(
            buildDeps({
              bookingRepo: {
                findOne: jest.fn(async () => ({
                  id: 'b6',
                  businessId: 'biz-1',
                  paymentStatus: PaymentStatus.PAID,
                  metadata: { paymentMethod: 'online' },
                })),
                save: jest.fn(),
              } as any,
            }),
            'biz-1',
            { bookingId: 'b6' },
          )
        ).success,
      ).toBe(false);

      expect(
        (
          await handleExplainPaymentStatusLogic(buildDeps(), 'biz-1', {
            bookingId: 'missing',
          })
        ).success,
      ).toBe(false);
      expect(
        (
          await handleReceiptStatusLogic(buildDeps(), 'biz-1', {
            bookingId: 'missing',
          })
        ).success,
      ).toBe(false);
      expect(
        (
          await handleRefundGiftCardOrderLogic(buildDeps(), 'biz-1', {
            giftCardCode: 'GCM-ABCD1234',
            reason: 'Duplicate purchase',
          })
        ).success,
      ).toBe(true);
      expect(
        (
          await handleExtendGiftCardExpiryLogic(
            buildDeps(),
            'biz-1',
            { giftCardCode: 'GCM-ABCD1234' },
            'admin',
          )
        ).success,
      ).toBe(true);
      expect(
        (
          await handleAdjustGiftCardBalanceLogic(buildDeps(), 'biz-1', {
            giftCardCode: 'GCM-ABCD1234',
            delta: -5,
          })
        ).success,
      ).toBe(true);
      expect(
        (
          await handleExplainCheckoutTotalLogic(buildDeps(), 'biz-1', {
            serviceName: 'Massage',
            _prompt: 'GCM-ABCD1234',
          })
        ).success,
      ).toBe(true);

      expect(
        (
          await handleExplainPaymentStatusLogic(
            buildDeps({
              bookingRepo: {
                findOne: jest.fn(async () => ({
                  id: 'b7',
                  businessId: 'biz-1',
                  paymentStatus: PaymentStatus.PAID,
                  metadata: {},
                  service: null,
                  customer: null,
                })),
              } as any,
            }),
            'biz-1',
            { bookingId: 'b7' },
          )
        ).summary,
      ).toBe('Paid.');

      expect(
        (
          await handleExplainPaymentStatusLogic(
            buildDeps({
              bookingRepo: {
                findOne: jest.fn(async () => ({
                  id: 'b8',
                  businessId: 'biz-1',
                  paymentStatus: PaymentStatus.PARTIALLY_PAID,
                  metadata: {},
                  service: { price: 10 },
                  customer: { name: 'X' },
                })),
              } as any,
            }),
            'biz-1',
            { bookingId: 'b8' },
          )
        ).summary,
      ).toContain('partially_paid');

      expect(
        (
          await handleCollectCashConfirmLogic(buildDeps(), 'biz-1', {
            bookingId: 'missing',
          })
        ).success,
      ).toBe(false);

      expect(
        (
          await handleBookNearestSlotLogic(
            buildDeps({
              serviceRepo: {
                findOne: jest.fn(async () => null),
                find: jest.fn(async () => services),
              } as any,
            }),
            'biz-1',
            { serviceId: 'missing' },
          )
        ).success,
      ).toBe(false);

      expect(
        (
          await handleBuyGiftCardLogic(
            buildDeps({
              giftCardPurchaseService: {
                getPublicCatalog: jest.fn(async () => ({
                  purchaseEnabled: false,
                })),
              } as any,
            }),
            'biz-1',
            { amount: 50 },
            true,
          )
        ).action,
      ).toBe('buy_gift_card_physical');

      expect(
        (
          await handleBuyGiftCardLogic(
            buildDeps(),
            'biz-1',
            { _prompt: 'Buy $25 gift card' },
            false,
          )
        ).success,
      ).toBe(true);

      expect(
        (
          await handleReceiptStatusLogic(
            buildDeps({
              bookingRepo: {
                findOne: jest.fn(async () => ({
                  id: 'b9',
                  businessId: 'biz-1',
                  paymentStatus: PaymentStatus.PAID,
                  metadata: {},
                })),
              } as any,
            }),
            'biz-1',
            { bookingId: 'b9' },
          )
        ).summary,
      ).toContain('pending');

      expect(
        (
          await handleSummarizeUnpaidLogic(
            buildDeps({
              bookingRepo: {
                find: jest.fn(async () => [
                  {
                    id: 'b0',
                    paymentStatus: PaymentStatus.PENDING,
                    status: BookingStatus.CONFIRMED,
                    startTime: new Date(),
                    service: null,
                    customer: null,
                    employee: null,
                  },
                ]),
              } as any,
            }),
            'biz-1',
            {},
          )
        ).success,
      ).toBe(true);

      expect(
        (
          await handleConfigureCashPaymentsLogic(buildDeps(), 'biz-1', {
            acceptCashPayments: false,
          })
        ).success,
      ).toBe(true);

      expect(
        (
          await handleCollectCashConfirmLogic(
            buildDeps({
              bookingRepo: {
                findOne: jest.fn(async () => ({
                  id: 'b10',
                  businessId: 'biz-1',
                  paymentStatus: PaymentStatus.PENDING,
                  metadata: null,
                })),
                save: jest.fn(async (b) => b),
              } as any,
            }),
            'biz-1',
            { bookingId: 'b10' },
            'p2',
          )
        ).success,
      ).toBe(true);

      expect(
        (
          await handleChoosePaymentMethodLogic(
            buildDeps({
              businessRepo: {
                findOne: jest.fn(async () => ({
                  id: 'biz-1',
                  settings: {
                    publicBooking: { acceptCashPayments: false },
                    integrations: { stripe: { connectAccountId: 'acct_1' } },
                  },
                })),
              } as any,
            }),
            'biz-1',
          )
        ).success,
      ).toBe(true);

      expect(
        (
          await handlePayCashAtVisitLogic(
            buildDeps({
              businessRepo: { findOne: jest.fn(async () => null) } as any,
            }),
            'biz-1',
          )
        ).success,
      ).toBe(false);

      const slotContext = await handlePaymentsCompoundLogic(
        buildDeps({
          publicBookingService: {
            findNearestBookableSlot: jest.fn(async () => ({
              startTime: '2026-06-06T18:00:00Z',
              employeeId: 'e1',
              employeeName: 'Anna',
              serviceId: 's1',
            })),
            recommendProviders: jest.fn(async () => ({ providers: [] })),
          } as any,
        }),
        'biz-1',
        'x',
        {
          compoundSteps: [
            {
              action: 'book_nearest_slot',
              params: { serviceName: 'Massage' },
              segment: 'a',
            },
            {
              action: 'check_providers_for_service',
              params: { serviceName: 'Massage' },
              segment: 'b',
            },
          ],
        },
      );
      expect(slotContext.success).toBe(true);

      expect(
        (
          await handleConfigureCashPaymentsLogic(
            buildDeps(),
            'biz-1',
            {},
            'Disable cash payments at checkout',
          )
        ).success,
      ).toBe(true);

      expect(
        (
          await handleConfigureCashPaymentsLogic(
            buildDeps({
              businessRepo: {
                findOne: jest.fn(async () => null),
                save: jest.fn(),
              } as any,
            }),
            'biz-1',
            { acceptCashPayments: true },
          )
        ).success,
      ).toBe(false);

      expect(
        (
          await handlePaymentsCompoundLogic(
            buildDeps({
              giftCardsService: {
                validate: jest.fn(async () => baseCard),
                getBalanceView: jest.fn(async () => ({
                  balance: 50,
                  cardType: 'monetary',
                  currency: 'USD',
                  expiresAt: null,
                  isActive: true,
                  serviceCredits: [],
                })),
              } as any,
            }),
            'biz-1',
            'x',
            {
              compoundSteps: [
                {
                  action: 'apply_gift_card_code',
                  params: { giftCardCode: 'GCM-ABCD1234' },
                  segment: 'a',
                },
                { action: 'summarize_unpaid', params: {}, segment: 'b' },
              ],
            },
          )
        ).success,
      ).toBe(true);

      expect(
        (
          await handleExplainCheckoutTotalLogic(buildDeps(), 'biz-1', {
            serviceName: 'Massage',
            giftCardCode: 'GCM-ABCD1234',
          })
        ).summary,
      ).toContain('gift card');

      expect(
        (
          await handleConfigureCashPaymentsLogic(
            buildDeps({
              businessRepo: {
                findOne: jest.fn(async () => ({
                  id: 'biz-1',
                  slug: 'salon',
                  settings: null,
                })),
                save: jest.fn(async (b) => b),
              } as any,
            }),
            'biz-1',
            { acceptCashPayments: true },
          )
        ).success,
      ).toBe(true);

      expect(
        (
          await handleBookNearestSlotLogic(
            buildDeps({
              businessRepo: {
                findOne: jest.fn(async () => null),
                save: jest.fn(),
              } as any,
            }),
            'biz-1',
            { serviceName: 'Massage' },
          )
        ).success,
      ).toBe(false);

      expect(
        (
          await handleApplyGiftCardCodeLogic(
            buildDeps(),
            'biz-1',
            {},
            'apply GCM-ABCD1234 at checkout',
          )
        ).success,
      ).toBe(true);

      expect(
        (await handleBuyGiftCardLogic(buildDeps(), 'biz-1', { amount: 50 }))
          .success,
      ).toBe(true);

      expect(
        (
          await handleConfigureCashPaymentsLogic(buildDeps(), 'biz-1', {
            _prompt: 'Enable cash payments',
          })
        ).success,
      ).toBe(true);

      expect(
        (
          await handleExplainCheckoutTotalLogic(
            buildDeps({
              giftCardsService: {
                validate: jest.fn(async () => baseCard),
                getBalanceView: jest.fn(async () => ({
                  code: 'GCM-ABCD1234',
                  balance: undefined,
                  cardType: 'monetary',
                })),
              } as any,
            }),
            'biz-1',
            { serviceName: 'Massage', giftCardCode: 'GCM-ABCD1234' },
          )
        ).success,
      ).toBe(true);

      expect(
        (
          await handleBookNearestSlotLogic(
            buildDeps({
              serviceRepo: {
                findOne: jest.fn(async ({ where }: any) =>
                  where.id === 's-miss' ? null : services[0],
                ),
                find: jest.fn(async () => services),
              } as any,
            }),
            'biz-1',
            { serviceId: 's-miss' },
          )
        ).success,
      ).toBe(false);
      const nearestBooked = await handleBookNearestSlotLogic(
        buildDeps(),
        'biz-1',
        {
          serviceId: 's1',
        },
      );
      expect(nearestBooked.success).toBe(true);
      expect(nearestBooked.details?.navigate).toEqual({
        path: 'checkout',
        query: {
          serviceId: 's1',
          employeeId: 'e1',
          startTime: '2026-06-06T18:00:00Z',
        },
      });

      expect(
        (
          await handleApplyGiftCardCodeLogic(buildDeps(), 'biz-1', {
            giftCardCode: 'GCM-ABCD1234',
          })
        ).success,
      ).toBe(true);

      expect(
        (
          await handleListSubscriptionRevenueLogic(
            buildDeps({
              accountingIntegrationService: {
                generateExport: jest.fn(async () => ({
                  content:
                    'Date,Type,IncomeSubType,Description,Amount,Currency,Reference\n2026-01-01,income,subscription,x,not-a-number,USD,ref',
                  rowCount: 1,
                  format: 'csv',
                  filename: 'x.csv',
                  provider: 'csv',
                })),
              } as any,
            }),
            'biz-1',
            {},
          )
        ).details,
      ).toMatchObject({ total: 0 });
      const withReference = await handleListSubscriptionRevenueLogic(
        buildDeps({
          accountingIntegrationService: {
            generateExport: jest.fn(async () => ({
              content:
                'Date,Type,IncomeSubType,Description,Amount,Currency,Reference\n2026-01-01,income,subscription,plan,25,USD,sub-001\n2026-01-01,income,subscription,plan,10,USD,',
              rowCount: 2,
              format: 'csv',
              filename: 'x.csv',
              provider: 'csv',
            })),
          } as any,
        }),
        'biz-1',
        {},
      );
      expect(withReference.success).toBe(true);
      expect((withReference.details as any).rows[0].reference).toBe('sub-001');
      expect((withReference.details as any).rows[1].reference).toBe('');
      expect(
        (
          await handlePayOnlineLogic(
            buildDeps({
              businessRepo: { findOne: jest.fn(async () => null) } as any,
            }),
            'biz-1',
          )
        ).success,
      ).toBe(false);

      const providerContext = await handlePaymentsCompoundLogic(
        buildDeps(),
        'biz-1',
        'x',
        {
          compoundSteps: [
            {
              action: 'check_providers_for_service',
              params: { serviceName: 'Massage' },
              segment: 'a',
            },
            {
              action: 'book_nearest_slot',
              params: { serviceName: 'Massage' },
              segment: 'b',
            },
          ],
        },
      );
      expect(providerContext.success).toBe(true);
    });
  });

  describe('resolve branches', () => {
    it('covers service resolution and business slug failures', async () => {
      expect(
        (
          await handleCheckProvidersForServiceLogic(
            buildDeps({
              businessRepo: { findOne: jest.fn(async () => null) } as any,
            }),
            'biz-1',
            { serviceName: 'Massage' },
          )
        ).success,
      ).toBe(false);
      expect(
        (
          await handleBookNearestSlotLogic(buildDeps(), 'biz-1', {
            serviceId: 's1',
          })
        ).success,
      ).toBe(true);
      expect(
        (
          await handleCheckProvidersForServiceLogic(buildDeps(), 'biz-1', {
            serviceName: 'Mass',
          })
        ).success,
      ).toBe(true);
      const withExpiry = await handleCheckGiftCardBalanceLogic(
        buildDeps({
          giftCardsService: {
            getBalanceView: jest.fn(async () => ({
              code: 'GCM-ABCD1234',
              balance: 25,
              expiresAt: new Date('2028-06-01'),
            })),
          } as any,
        }),
        'biz-1',
        { giftCardCode: 'GCM-ABCD1234' },
      );
      expect(withExpiry.summary).toContain('expires');
      expect(
        (
          await handleExplainPaymentStatusLogic(buildDeps(), 'biz-1', {
            bookingId: 'missing',
          })
        ).success,
      ).toBe(false);
      expect(
        (
          await handleRefundGiftCardOrderLogic(
            buildDeps({
              businessRepo: { findOne: jest.fn(async () => null) } as any,
            }),
            'biz-1',
            { giftCardId: 'gc-1' },
          )
        ).success,
      ).toBe(false);
      expect(
        (
          await handleChoosePaymentMethodLogic(
            buildDeps({
              businessRepo: { findOne: jest.fn(async () => null) } as any,
            }),
            'biz-1',
          )
        ).success,
      ).toBe(false);
    });
  });
});
