import { SUPPORTED_BUSINESS_CURRENCIES } from './business-currency.util.js';
import {
  appendPriceToAppointmentDetail,
  buildBookingPriceLines,
  formatGiftCardBalanceLine,
  formatGiftCardPurchaseLine,
  formatNotificationMoney,
  resolveBookingNotificationAmount,
} from './notification-currency.util.js';

describe('Sprint 28 — notification currency integration', () => {
  it.each([
    {
      id: 'confirmation-amd-default',
      settings: { currency: 'AMD' },
      booking: {
        metadata: {},
        service: { price: 12000, currency: null },
        paymentStatus: 'pending',
      },
      locale: 'en' as const,
      pattern: /Price:.*(֏|AMD)/,
    },
    {
      id: 'confirmation-legacy-usd',
      settings: { currency: 'EUR' },
      booking: {
        metadata: {},
        service: { price: 45, currency: 'USD' },
        paymentStatus: 'pending',
      },
      locale: 'en' as const,
      pattern: /Price:.*\$/,
    },
    {
      id: 'reminder-paid-gel',
      settings: { currency: 'GEL' },
      booking: {
        metadata: { amountPaid: 80 },
        service: { price: 100, currency: null },
        paymentStatus: 'paid',
      },
      locale: 'en' as const,
      pattern: /Amount paid:/,
    },
    {
      id: 'partially-paid-usd',
      settings: { currency: 'USD' },
      booking: {
        metadata: {},
        service: { price: 40, currency: 'USD' },
        paymentStatus: 'partially_paid',
      },
      locale: 'en' as const,
      pattern: /Amount paid:/,
    },
    {
      id: 'metadata-amount-paid-label',
      settings: { currency: 'USD' },
      booking: {
        metadata: { amountPaid: 30 },
        service: { price: 50, currency: 'USD' },
        paymentStatus: 'pending',
      },
      locale: 'en' as const,
      pattern: /Amount paid:/,
    },
    {
      id: 'pricing-amount-due',
      settings: { currency: 'USD' },
      booking: {
        metadata: { pricing: { amountDue: 22 } },
        service: { price: 99, currency: 'USD' },
        paymentStatus: 'pending',
      },
      locale: 'en' as const,
      pattern: /22/,
    },
    {
      id: 'prepayment-amount',
      settings: { currency: 'EUR' },
      booking: {
        metadata: { prepaymentAmount: 15 },
        service: { price: 60, currency: 'EUR' },
        paymentStatus: 'pending',
      },
      locale: 'en' as const,
      pattern: /15/,
    },
    {
      id: 'armenian-confirmation-copy',
      settings: { currency: 'AMD' },
      booking: {
        metadata: {},
        service: { price: 8000, currency: null },
        paymentStatus: 'pending',
      },
      locale: 'hy' as const,
      pattern: /Գին/,
    },
    {
      id: 'russian-confirmation-copy',
      settings: { currency: 'RUB' },
      booking: {
        metadata: {},
        service: { price: 3000, currency: null },
        paymentStatus: 'pending',
      },
      locale: 'ru' as const,
      pattern: /Цена/,
    },
    {
      id: 'no-price-available',
      settings: { currency: 'USD' },
      booking: {
        metadata: {},
        service: null,
        paymentStatus: 'pending',
      },
      locale: 'en' as const,
      pattern: /^$/,
    },
  ])(
    'booking notification price line for $id',
    ({ settings, booking, locale, pattern }) => {
      const lines = buildBookingPriceLines(booking, settings, locale);
      if (pattern.source === '^$') {
        expect(lines.priceLineText).toBe('');
        expect(lines.priceLineHtml).toBe('');
        expect(lines.priceLabel).toBe('');
        return;
      }
      expect(lines.priceLineText).toMatch(pattern);
      expect(lines.priceLineHtml).toMatch(pattern);
      expect(lines.priceLabel).toBeTruthy();
    },
  );

  it('resolves notification amounts in priority order', () => {
    expect(
      resolveBookingNotificationAmount({
        metadata: {
          pricing: { amountDue: 10 },
          amountPaid: 20,
          prepaymentAmount: 5,
        },
        service: { price: 100, currency: 'USD' },
      }),
    ).toBe(10);
    expect(
      resolveBookingNotificationAmount({
        metadata: { amountPaid: 20, prepaymentAmount: 5 },
        service: { price: 100, currency: 'USD' },
      }),
    ).toBe(20);
    expect(
      resolveBookingNotificationAmount({
        metadata: { prepaymentAmount: 5 },
        service: { price: 100, currency: 'USD' },
      }),
    ).toBe(5);
  });

  it('formats gift card balance and purchaser receipt with tenant currency', () => {
    const settings = { currency: 'EUR' };
    expect(formatGiftCardBalanceLine(50, 'EUR', settings, 'en')).toMatch(
      /Balance:.*(€|EUR)/,
    );
    expect(formatGiftCardPurchaseLine(120, 'EUR', settings, 'en')).toMatch(
      /Amount paid:.*(€|EUR)/,
    );
    expect(formatGiftCardPurchaseLine('', 'EUR', settings, 'en')).toBe('');
  });

  it('localizes gift card balance and purchase copy', () => {
    const amd = { currency: 'AMD' };
    expect(formatGiftCardBalanceLine(25000, 'AMD', amd, 'hy')).toContain(
      'Մնացորդ',
    );
    expect(formatGiftCardPurchaseLine(5000, 'AMD', amd, 'hy')).toContain(
      'Վճարված',
    );
    expect(
      formatGiftCardPurchaseLine(100, 'RUB', { currency: 'RUB' }, 'ru'),
    ).toContain('Оплачено');
  });

  it('appends formatted price to appointment schedule labels', () => {
    expect(appendPriceToAppointmentDetail('Jun 5 · 10:00', '€45')).toBe(
      'Jun 5 · 10:00 · €45',
    );
    expect(appendPriceToAppointmentDetail('Jun 5 · 10:00', '')).toBe(
      'Jun 5 · 10:00',
    );
  });

  it('covers every supported business currency in notification formatter', () => {
    for (const code of SUPPORTED_BUSINESS_CURRENCIES) {
      expect(
        formatNotificationMoney(10, null, { currency: code }, 'en'),
      ).toBeTruthy();
      const lines = buildBookingPriceLines(
        {
          metadata: {},
          service: { price: 10, currency: null },
          paymentStatus: 'pending',
        },
        { currency: code },
        'en',
      );
      expect(lines.priceLabel).toBeTruthy();
    }
  });
});
