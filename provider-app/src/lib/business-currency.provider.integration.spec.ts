import { describe, expect, it } from 'vitest';
import { formatBookingBlockHeadline } from './booking-types';
import {
  formatProviderMoney,
  readBusinessCurrency,
  resolveTenantPriceCurrency,
} from './business-currency';
import { formatBookingMoney, type BookingPaymentSummary } from './booking-payment-summary';

const SURFACES = [
  'today-list-headline',
  'schedule-list-headline',
  'payment-breakdown-service-price',
  'payment-breakdown-charged-amount',
  'payment-breakdown-promo',
  'payment-breakdown-gift-card',
  'payment-breakdown-loyalty',
  'payment-breakdown-retail-adjustment',
  'payment-breakdown-retail-total',
  'payment-breakdown-grand-total',
  'payment-breakdown-fully-covered',
  'payment-breakdown-cash-paid',
  'payment-breakdown-loyalty-points',
] as const;

function formatProviderSurface(
  surface: (typeof SURFACES)[number],
  businessCurrency: string,
  summary?: Partial<BookingPaymentSummary>,
): string {
  const tenant = readBusinessCurrency(businessCurrency);
  const baseSummary: BookingPaymentSummary = {
    currency: resolveTenantPriceCurrency(null, tenant),
    servicePrice: 100,
    subtotal: 80,
    promoDiscount: 10,
    giftCardDiscount: 5,
    loyaltyDiscount: 5,
    loyaltyPointsRedeemed: 5,
    promoCode: 'SAVE10',
    giftCardCode: 'GIFT5',
    cashPaid: 64,
    retailTotal: 36,
    grandTotal: 100,
    totalDiscount: 20,
    hasDiscounts: true,
    adjustments: [
      { type: 'promo', label: 'Promo', code: 'SAVE10', amount: 10 },
      { type: 'gift_card', label: 'Gift card', code: 'GIFT5', amount: 5 },
      { type: 'loyalty', label: 'Loyalty', amount: 5, points: 5 },
      { type: 'retail', label: 'Shampoo', amount: 18 },
    ],
    ...summary,
  };

  switch (surface) {
    case 'today-list-headline':
    case 'schedule-list-headline':
      return formatBookingBlockHeadline({
        startTime: '2026-06-05T10:00:00.000Z',
        endTime: '2026-06-05T11:00:00.000Z',
        status: 'confirmed',
        service: { price: 12000, currency: null },
        businessCurrency: tenant,
      });
    case 'payment-breakdown-service-price':
      return formatBookingMoney(baseSummary.servicePrice, baseSummary.currency, tenant);
    case 'payment-breakdown-charged-amount':
      return formatBookingMoney(baseSummary.subtotal, baseSummary.currency, tenant);
    case 'payment-breakdown-promo':
      return formatBookingMoney(baseSummary.adjustments[0].amount, baseSummary.currency, tenant);
    case 'payment-breakdown-gift-card':
      return formatBookingMoney(baseSummary.adjustments[1].amount, baseSummary.currency, tenant);
    case 'payment-breakdown-loyalty':
      return formatBookingMoney(baseSummary.adjustments[2].amount, baseSummary.currency, tenant);
    case 'payment-breakdown-retail-adjustment':
      return formatBookingMoney(baseSummary.adjustments[3].amount, baseSummary.currency, tenant);
    case 'payment-breakdown-retail-total':
      return formatBookingMoney(baseSummary.retailTotal, baseSummary.currency, tenant);
    case 'payment-breakdown-grand-total':
      return formatBookingMoney(baseSummary.grandTotal, baseSummary.currency, tenant);
    case 'payment-breakdown-fully-covered':
      return formatBookingMoney(0, baseSummary.currency, tenant);
    case 'payment-breakdown-cash-paid':
      return formatBookingMoney(baseSummary.cashPaid, baseSummary.currency, tenant);
    case 'payment-breakdown-loyalty-points':
      return baseSummary.loyaltyPointsRedeemed.toFixed(2);
    default:
      return '';
  }
}

describe('Sprint 28 — provider currency surfaces (integration)', () => {
  it('covers every provider monetary surface id', () => {
    expect(SURFACES.length).toBe(13);
  });

  it.each([
    {
      surface: 'today-list-headline' as const,
      businessCurrency: 'AMD',
      pattern: /֏|AMD/,
    },
    {
      surface: 'schedule-list-headline' as const,
      businessCurrency: 'EUR',
      pattern: /€|EUR/,
    },
    {
      surface: 'payment-breakdown-service-price' as const,
      businessCurrency: 'GEL',
      pattern: /GEL|₾/,
    },
    {
      surface: 'payment-breakdown-charged-amount' as const,
      businessCurrency: 'RUB',
      pattern: /₽|RUB/,
    },
    {
      surface: 'payment-breakdown-retail-total' as const,
      businessCurrency: 'CHF',
      pattern: /CHF|Fr/,
    },
    {
      surface: 'payment-breakdown-grand-total' as const,
      businessCurrency: 'GBP',
      pattern: /£|GBP/,
    },
    {
      surface: 'payment-breakdown-cash-paid' as const,
      businessCurrency: 'USD',
      pattern: /\$|USD/,
    },
    {
      surface: 'payment-breakdown-fully-covered' as const,
      businessCurrency: 'EUR',
      pattern: /€|EUR|0/,
    },
    {
      surface: 'payment-breakdown-loyalty-points' as const,
      businessCurrency: 'AMD',
      pattern: /5\.00/,
    },
  ])('formats $surface with business currency $businessCurrency', ({ surface, businessCurrency, pattern }) => {
    const formatted = formatProviderSurface(surface, businessCurrency);
    expect(formatted).toMatch(pattern);
  });

  it('formats promo, gift card, loyalty, and retail adjustment amounts', () => {
    const tenant = 'AMD';
    expect(formatProviderSurface('payment-breakdown-promo', tenant)).toMatch(/֏|AMD/);
    expect(formatProviderSurface('payment-breakdown-gift-card', tenant)).toMatch(/֏|AMD/);
    expect(formatProviderSurface('payment-breakdown-loyalty', tenant)).toMatch(/֏|AMD/);
    expect(formatProviderSurface('payment-breakdown-retail-adjustment', tenant)).toMatch(/֏|AMD/);
  });

  it('preserves legacy service currency on payment lines', () => {
    const formatted = formatProviderMoney(50, 'USD', 'AMD');
    expect(formatted).toContain('$');
  });
});
