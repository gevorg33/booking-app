import {
  appendPriceToAppointmentDetail,
  buildBookingPriceLines,
  formatGiftCardBalanceLine,
  formatGiftCardPurchaseLine,
  formatNotificationMoney,
  resolveBookingNotificationAmount,
  resolveEmailFooterNote,
} from './notification-currency.util.js';

describe('notification-currency.util', () => {
  const amdSettings = { currency: 'AMD' };

  describe('formatNotificationMoney', () => {
    it.each([
      { amount: 45, entity: null, settings: amdSettings, pattern: /֏|AMD/ },
      {
        amount: 50,
        entity: 'USD',
        settings: { currency: 'EUR' },
        pattern: /\$/,
      },
      {
        amount: 80,
        entity: null,
        settings: { currency: 'EUR' },
        pattern: /€|EUR/,
      },
    ])(
      'formats $amount with resolved currency',
      ({ amount, entity, settings, pattern }) => {
        expect(formatNotificationMoney(amount, entity, settings, 'en')).toMatch(
          pattern,
        );
      },
    );

    it('returns null for invalid amounts', () => {
      expect(formatNotificationMoney(null, 'USD', undefined, 'en')).toBeNull();
      expect(formatNotificationMoney('bad', 'USD', undefined, 'en')).toBeNull();
      expect(formatNotificationMoney(5, 'USD')).toContain('$');
    });

    it('formats fractional amounts with two decimal places', () => {
      expect(formatNotificationMoney(10.99, 'USD', undefined, 'en')).toContain(
        '10.99',
      );
    });

    it('falls back to code suffix when Intl formatter throws', () => {
      const original = Intl.NumberFormat;
      jest.spyOn(Intl, 'NumberFormat').mockImplementation(() => {
        throw new Error('formatter unavailable');
      });
      try {
        expect(
          formatNotificationMoney(5, 'EUR', { currency: 'EUR' }, 'en'),
        ).toBe('5 EUR');
      } finally {
        Intl.NumberFormat = original;
      }
    });

    it('uses locale-specific number formatting', () => {
      expect(
        formatNotificationMoney(1000, 'AMD', { currency: 'AMD' }, 'hy'),
      ).toBeTruthy();
    });
  });

  describe('resolveBookingNotificationAmount', () => {
    it('prefers pricing amountDue over service price', () => {
      expect(
        resolveBookingNotificationAmount({
          metadata: { pricing: { amountDue: 30 }, amountPaid: 30 },
          service: { price: 100, currency: 'USD' },
        }),
      ).toBe(30);
    });

    it('falls back to service price', () => {
      expect(
        resolveBookingNotificationAmount({
          metadata: {},
          service: { price: 75, currency: 'EUR' },
        }),
      ).toBe(75);
    });

    it('reads prepayment amount and skips invalid candidates', () => {
      expect(
        resolveBookingNotificationAmount({
          metadata: { prepaymentAmount: 25, amountPaid: 'bad' },
          service: { price: 100, currency: 'USD' },
        }),
      ).toBe(25);
    });

    it('skips negative amounts and handles missing metadata', () => {
      expect(
        resolveBookingNotificationAmount({
          metadata: null,
          service: { price: 15, currency: 'USD' },
        }),
      ).toBe(15);
      expect(
        resolveBookingNotificationAmount({
          metadata: { pricing: 'invalid' },
          service: { price: 20, currency: 'USD' },
        }),
      ).toBe(20);
      expect(
        resolveBookingNotificationAmount({
          metadata: { pricing: { amountDue: -5 }, amountPaid: 40 },
          service: { price: 100, currency: 'USD' },
        }),
      ).toBe(40);
    });
  });

  describe('buildBookingPriceLines', () => {
    it('uses service price label when booking is unpaid without metadata', () => {
      const lines = buildBookingPriceLines(
        {
          metadata: null,
          service: { price: 45, currency: 'USD' },
          paymentStatus: 'pending',
        },
        { currency: 'USD' },
        'en',
      );
      expect(lines.priceLineText).toContain('Price:');
    });

    it('ignores null amountPaid metadata for unpaid bookings', () => {
      const lines = buildBookingPriceLines(
        {
          metadata: { amountPaid: null },
          service: { price: 45, currency: 'USD' },
          paymentStatus: 'pending',
        },
        { currency: 'USD' },
        'en',
      );
      expect(lines.priceLineText).toContain('Price:');
      expect(lines.priceLineText).not.toContain('Amount paid:');
    });

    it('builds localized price lines for confirmations', () => {
      const lines = buildBookingPriceLines(
        {
          metadata: {},
          service: { price: 45, currency: 'USD' },
          paymentStatus: 'pending',
        },
        amdSettings,
        'en',
      );
      expect(lines.priceLabel).toContain('$');
      expect(lines.priceLineText).toContain('Price:');
      expect(lines.priceLineHtml).toContain('Price:');
    });

    it('uses amount paid label when booking is paid', () => {
      const lines = buildBookingPriceLines(
        {
          metadata: { amountPaid: 60 },
          service: { price: 100, currency: null },
          paymentStatus: 'paid',
        },
        { currency: 'GEL' },
        'en',
      );
      expect(lines.priceLineText).toContain('Amount paid:');
    });

    it('uses amount paid label for partially paid bookings', () => {
      const lines = buildBookingPriceLines(
        {
          metadata: {},
          service: { price: 40, currency: 'USD' },
          paymentStatus: 'partially_paid',
        },
        { currency: 'USD' },
        'en',
      );
      expect(lines.priceLineText).toContain('Amount paid:');
    });

    it('returns empty lines when no amount is available', () => {
      expect(
        buildBookingPriceLines(
          { metadata: {}, service: null },
          amdSettings,
          'en',
        ),
      ).toEqual({
        priceLabel: '',
        priceLineText: '',
        priceLineHtml: '',
      });
    });

    it('falls back to simple price line when tax metadata is absent', () => {
      const lines = buildBookingPriceLines(
        {
          metadata: {},
          service: { price: 45, currency: 'USD' },
          paymentStatus: 'pending',
        },
        { currency: 'USD' },
        'en',
      );
      expect(lines.priceLineText).toContain('Price:');
      expect(lines.priceLineText).not.toContain('Subtotal:');
      expect(lines.taxRegistrationFooter).toBeUndefined();
    });
  });

  describe('resolveEmailFooterNote', () => {
    it('returns base footer when tax registration footer is absent', () => {
      expect(resolveEmailFooterNote('en', 'Thanks!')).toBe('Thanks!');
    });
  });

  it('appends price to appointment detail strings', () => {
    expect(appendPriceToAppointmentDetail('Mar 6 · 14:00', '€45')).toBe(
      'Mar 6 · 14:00 · €45',
    );
    expect(appendPriceToAppointmentDetail('Mar 6 · 14:00', '')).toBe(
      'Mar 6 · 14:00',
    );
  });

  it('formats gift card balance and purchase lines', () => {
    expect(formatGiftCardBalanceLine(50, 'USD', amdSettings, 'en')).toContain(
      'Balance:',
    );
    expect(
      formatGiftCardPurchaseLine(120, 'EUR', { currency: 'EUR' }, 'en'),
    ).toContain('Amount paid:');
    expect(formatGiftCardPurchaseLine(null, 'USD', undefined, 'en')).toBe('');
    expect(formatGiftCardPurchaseLine('bad', 'USD', undefined, 'en')).toBe('');
  });

  it('falls back when gift card balance cannot be formatted', () => {
    const line = formatGiftCardBalanceLine('bad', 'USD', undefined, 'en');
    expect(line).toContain('Balance:');
    expect(line).toContain('NaN');
  });

  it('builds localized Armenian booking price lines', () => {
    const lines = buildBookingPriceLines(
      {
        metadata: {},
        service: { price: 5000, currency: null },
        paymentStatus: 'pending',
      },
      { currency: 'AMD' },
      'hy',
    );
    expect(lines.priceLineText).toContain('Գին');
  });
});
