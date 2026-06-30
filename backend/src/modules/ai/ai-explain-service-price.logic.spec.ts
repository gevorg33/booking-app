import { PrepaymentMode } from '../service/entities/service.entity.js';
import { handleExplainServicePriceLogic } from './ai-explain-service-price.logic.js';
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
          tax: {
            enabled: true,
            name: 'VAT',
            rate: 20,
            model: 'inclusive',
          },
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

describe('ai-explain-service-price.logic (ai-cmd-customer-4.1.1)', () => {
  it('requires a service when none is named', async () => {
    const result = await handleExplainServicePriceLogic(
      buildDeps(),
      'biz-1',
      {},
      'How much is it?',
    );
    expect(result.success).toBe(false);
    expect(result.action).toBe('explain_service_price');
    expect((result.details as { clarify?: boolean }).clarify).toBe(true);
  });

  it('explains listed price with tax badge and deposit note', async () => {
    const result = await handleExplainServicePriceLogic(
      buildDeps(),
      'biz-1',
      { serviceName: 'Massage' },
      'How much is massage?',
    );
    expect(result.success).toBe(true);
    expect(result.action).toBe('explain_service_price');
    expect(result.summary).toContain('Massage');
    expect(result.summary).toContain('incl. 20% VAT');
    expect(result.summary).toContain('deposit');
    expect((result.details as { depositDueNow: number }).depositDueNow).toBe(40);
  });

  it('explains no-deposit services', async () => {
    const result = await handleExplainServicePriceLogic(
      buildDeps(),
      'biz-1',
      { serviceName: 'Haircut' },
      'How much is a haircut?',
    );
    expect(result.success).toBe(true);
    expect(result.summary).toContain('Haircut');
    expect(result.summary).toContain('No online deposit');
  });

  it('answers quoted amount inclusion questions', async () => {
    const result = await handleExplainServicePriceLogic(
      buildDeps(),
      'biz-1',
      { serviceName: 'Massage' },
      'Is massage included in the $80?',
    );
    expect(result.success).toBe(true);
    expect(result.summary).toContain('listed at');
  });
});
