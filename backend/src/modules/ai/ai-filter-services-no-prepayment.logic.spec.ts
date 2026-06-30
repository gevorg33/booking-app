import { PrepaymentMode } from '../service/entities/service.entity.js';
import {
  buildFilterServicesNoPrepaymentSummary,
  handleFilterServicesNoPrepaymentLogic,
} from './ai-filter-services-no-prepayment.logic.js';
import type { PaymentsLogicDeps } from './ai-payments.logic.js';

const services = [
  {
    id: 's-cash-cut',
    name: 'Cash Cut',
    businessId: 'biz-1',
    price: 35,
    currency: 'USD',
    durationMinutes: 30,
    isActive: true,
    prepaymentMode: PrepaymentMode.NONE,
    onlinePaymentEnabled: false,
    category: { name: 'Hair' },
  },
  {
    id: 's-deposit-massage',
    name: 'Deposit Massage',
    businessId: 'biz-1',
    price: 90,
    currency: 'USD',
    durationMinutes: 60,
    isActive: true,
    prepaymentMode: PrepaymentMode.DEPOSIT,
    onlinePaymentEnabled: true,
    category: { name: 'Massage' },
  },
  {
    id: 's-cash-massage',
    name: 'Relax Massage',
    businessId: 'biz-1',
    price: 70,
    currency: 'USD',
    durationMinutes: 45,
    isActive: true,
    prepaymentMode: PrepaymentMode.NONE,
    onlinePaymentEnabled: false,
    category: { name: 'Massage' },
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
        settings: {},
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

describe('ai-filter-services-no-prepayment.logic (ai-cmd-customer-4.1.7)', () => {
  it('buildFilterServicesNoPrepaymentSummary lists matched services', () => {
    const summary = buildFilterServicesNoPrepaymentSummary({
      header: 'Services without online payment',
      services: [
        {
          name: 'Cash Cut',
          priceLabel: '$35',
          durationMinutes: 30,
          taxBadge: null,
        },
      ],
    });
    expect(summary).toContain('Cash Cut');
    expect(summary).toContain('Services without online payment');
  });

  it('returns only prepaymentMode none services', async () => {
    const result = await handleFilterServicesNoPrepaymentLogic(
      buildDeps(),
      'biz-1',
      {},
      'What can I book without paying online?',
    );
    expect(result.success).toBe(true);
    expect(result.action).toBe('filter_services_no_prepayment');
    expect(result.summary).toContain('Cash Cut');
    expect(result.summary).toContain('Relax Massage');
    expect(result.summary).not.toContain('Deposit Massage');
    expect(
      (result.details as { navigate?: { path: string } }).navigate?.path,
    ).toBe('services');
  });

  it('narrows by service category when requested', async () => {
    const result = await handleFilterServicesNoPrepaymentLogic(
      buildDeps(),
      'biz-1',
      {},
      'What massage services can I book without paying online?',
    );
    expect(result.success).toBe(true);
    expect(result.summary).toContain('Relax Massage');
    expect(result.summary).not.toContain('Cash Cut');
  });

  it('returns empty summary when no matches', async () => {
    const result = await handleFilterServicesNoPrepaymentLogic(
      buildDeps({
        serviceRepo: {
          find: jest.fn(async () => [services[1]]),
        } as unknown as PaymentsLogicDeps['serviceRepo'],
      }),
      'biz-1',
      {},
      'What can I book without paying online?',
    );
    expect(result.success).toBe(false);
    expect(result.summary).toContain('No services without online payment');
  });
});
