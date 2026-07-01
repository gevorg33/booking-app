import { PrepaymentMode } from '../service/entities/service.entity.js';
import {
  buildCompareServicesSummary,
  handleCompareServicesLogic,
} from './ai-compare-services.logic.js';
import type { PaymentsLogicDeps } from './ai-payments.logic.js';

const services = [
  {
    id: 's-haircut',
    name: 'Haircut',
    businessId: 'biz-1',
    price: 40,
    currency: 'USD',
    durationMinutes: 45,
    isActive: true,
    prepaymentMode: PrepaymentMode.NONE,
    depositAmount: null,
  },
  {
    id: 's-blowdry',
    name: 'Blowdry',
    businessId: 'biz-1',
    price: 55,
    currency: 'USD',
    durationMinutes: 30,
    isActive: true,
    prepaymentMode: PrepaymentMode.NONE,
    depositAmount: null,
  },
  {
    id: 's-massage',
    name: 'Massage',
    businessId: 'biz-1',
    price: 80,
    currency: 'USD',
    durationMinutes: 60,
    isActive: true,
    prepaymentMode: PrepaymentMode.DEPOSIT,
    depositAmount: null,
  },
] as const;

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

describe('ai-compare-services.logic (ai-cmd-customer-4.1.4)', () => {
  it('buildCompareServicesSummary compares price and duration', () => {
    const result = buildCompareServicesSummary([services[0], services[1]], {
      tax: { enabled: true, name: 'VAT', rate: 20, model: 'inclusive' },
    });
    expect(result.summary).toContain('Haircut');
    expect(result.summary).toContain('Blowdry');
    expect(result.verdict).toContain('cheaper');
    expect(result.verdict).toContain('shorter');
  });

  it('requires at least two service names', async () => {
    const result = await handleCompareServicesLogic(
      buildDeps(),
      'biz-1',
      {},
      'Compare services',
    );
    expect(result.success).toBe(false);
    expect(result.action).toBe('compare_services');
    expect((result.details as { clarify?: boolean }).clarify).toBe(true);
  });

  it('compares haircut and blowdry from prompt', async () => {
    const result = await handleCompareServicesLogic(
      buildDeps(),
      'biz-1',
      {},
      'Haircut vs blowdry price and duration',
    );
    expect(result.success).toBe(true);
    expect(result.action).toBe('compare_services');
    expect(result.summary).toContain('Haircut');
    expect(result.summary).toContain('Blowdry');
    expect(
      (result.details as { navigate?: { path: string } }).navigate?.path,
    ).toBe('services');
  });

  it('reports missing catalog matches', async () => {
    const result = await handleCompareServicesLogic(
      buildDeps(),
      'biz-1',
      { serviceNames: ['haircut', 'unicorn grooming'] },
      'Compare haircut and unicorn grooming',
    );
    expect(result.success).toBe(false);
    expect(result.summary).toContain('unicorn grooming');
  });
});
