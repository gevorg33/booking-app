import { PrepaymentMode } from '../service/entities/service.entity.js';
import { handleExplainPaymentOptionsForServiceLogic } from './ai-explain-payment-options-for-service.logic.js';
import type { PaymentsLogicDeps } from './ai-payments.logic.js';

const services = [
  {
    id: 's1',
    name: 'Massage',
    businessId: 'biz-1',
    price: 80,
    currency: 'USD',
    durationMinutes: 60,
    isActive: true,
    prepaymentMode: PrepaymentMode.DEPOSIT,
    depositAmount: null,
  },
  {
    id: 's2',
    name: 'Haircut',
    businessId: 'biz-1',
    price: 40,
    currency: 'USD',
    durationMinutes: 45,
    isActive: true,
    prepaymentMode: PrepaymentMode.NONE,
    depositAmount: null,
  },
] as const;

function buildDeps(overrides: Partial<PaymentsLogicDeps> = {}): PaymentsLogicDeps {
  return {
    giftCardsService: {} as PaymentsLogicDeps['giftCardsService'],
    giftCardPurchaseService: {} as PaymentsLogicDeps['giftCardPurchaseService'],
    giftCardOrderService: {} as PaymentsLogicDeps['giftCardOrderService'],
    giftCardRefundService: {} as PaymentsLogicDeps['giftCardRefundService'],
    publicBookingService: {} as PaymentsLogicDeps['publicBookingService'],
    accountingIntegrationService:
      {} as PaymentsLogicDeps['accountingIntegrationService'],
    commissionsService: {} as PaymentsLogicDeps['commissionsService'],
    subscriptionsService: {} as PaymentsLogicDeps['subscriptionsService'],
    bookingRepo: {} as PaymentsLogicDeps['bookingRepo'],
    businessRepo: {
      findOne: jest.fn(async () => ({
        id: 'biz-1',
        settings: {
          publicBooking: { acceptCashPayments: true },
          integrations: { stripe: { connectAccountId: 'acct_1' } },
        },
      })),
    } as unknown as PaymentsLogicDeps['businessRepo'],
    serviceRepo: {
      find: jest.fn(async () => [...services]),
    } as unknown as PaymentsLogicDeps['serviceRepo'],
    giftCardRepo: {} as PaymentsLogicDeps['giftCardRepo'],
    serviceService: {} as PaymentsLogicDeps['serviceService'],
    ...overrides,
  };
}

describe('ai-explain-payment-options-for-service.logic (ai-cmd-customer-4.1.2)', () => {
  it('requires a service when none is named', async () => {
    const result = await handleExplainPaymentOptionsForServiceLogic(
      buildDeps(),
      'biz-1',
      {},
      'Can I pay cash?',
    );
    expect(result.success).toBe(false);
    expect(result.action).toBe('explain_payment_options_for_service');
    expect((result.details as { clarify?: boolean }).clarify).toBe(true);
  });

  it('explains online and cash options for a deposit service', async () => {
    const result = await handleExplainPaymentOptionsForServiceLogic(
      buildDeps(),
      'biz-1',
      { serviceName: 'Massage' },
      'Can I pay cash for massage?',
    );
    expect(result.success).toBe(true);
    expect(result.action).toBe('explain_payment_options_for_service');
    expect(result.summary).toContain('Pay online');
    expect(result.summary).toContain('cash');
    expect(result.summary).toContain('Prepayment policy');
    expect((result.details as { prepaymentMode: string }).prepaymentMode).toBe(
      PrepaymentMode.DEPOSIT,
    );
  });

  it('explains cash-friendly no-prepayment services', async () => {
    const result = await handleExplainPaymentOptionsForServiceLogic(
      buildDeps(),
      'biz-1',
      { serviceName: 'Haircut' },
      'Do I pay online for haircut?',
    );
    expect(result.success).toBe(true);
    expect(result.summary).toContain('Haircut');
    expect(
      (result.details as { serviceCash?: { cashAtVenueAllowed: boolean } })
        .serviceCash?.cashAtVenueAllowed,
    ).toBe(true);
  });

  it('uses catalog session context for this-service prompts', async () => {
    const result = await handleExplainPaymentOptionsForServiceLogic(
      buildDeps(),
      'biz-1',
      {},
      'Do I pay online for this service?',
      { serviceId: 's1', serviceName: 'Massage' },
    );
    expect(result.success).toBe(true);
    expect((result.details as { serviceName: string }).serviceName).toBe('Massage');
  });
});
