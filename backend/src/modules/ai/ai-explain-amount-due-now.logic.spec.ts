import { PrepaymentMode } from '../service/entities/service.entity.js';
import { handleExplainAmountDueNowLogic } from './ai-explain-amount-due-now.logic.js';
import type { PaymentsLogicDeps } from './ai-payments.logic.js';

const massageService = {
  id: 's-massage',
  name: 'Massage',
  businessId: 'biz-1',
  price: 80,
  currency: 'USD',
  durationMinutes: 60,
  isActive: true,
  prepaymentMode: PrepaymentMode.DEPOSIT,
  depositAmount: null,
} as const;

function buildDeps(
  overrides: Partial<PaymentsLogicDeps> = {},
): PaymentsLogicDeps {
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
      findOne: jest.fn(async () => ({ id: 'biz-1', settings: {} })),
    } as unknown as PaymentsLogicDeps['businessRepo'],
    serviceRepo: {
      find: jest.fn(async () => [massageService]),
      findOne: jest.fn(async () => massageService),
    } as unknown as PaymentsLogicDeps['serviceRepo'],
    giftCardRepo: {} as PaymentsLogicDeps['giftCardRepo'],
    serviceService: {
      findByBusiness: jest.fn(async () => [massageService]),
    } as unknown as PaymentsLogicDeps['serviceService'],
    bookingPaymentService: {} as PaymentsLogicDeps['bookingPaymentService'],
    ...overrides,
  };
}

describe('ai-explain-amount-due-now.logic (ai-cmd-customer-4.2.1)', () => {
  it('returns prepaymentDue semantics for deposit service', async () => {
    const result = await handleExplainAmountDueNowLogic(
      buildDeps(),
      'biz-1',
      {},
      'How much do I pay today for massage?',
    );
    expect(result.success).toBe(true);
    expect(result.action).toBe('explain_amount_due_now');
    expect(result.summary).toContain('$40.00 due now');
    expect((result.details as { prepaymentDue?: number }).prepaymentDue).toBe(
      40,
    );
    expect((result.details as { balanceAtVisit?: number }).balanceAtVisit).toBe(
      40,
    );
  });

  it('clarifies when service is missing', async () => {
    const result = await handleExplainAmountDueNowLogic(
      buildDeps(),
      'biz-1',
      {},
      'How much do I pay today?',
    );
    expect(result.success).toBe(false);
    expect(result.action).toBe('explain_amount_due_now');
    expect((result.details as { clarify?: boolean }).clarify).toBe(true);
  });
});
