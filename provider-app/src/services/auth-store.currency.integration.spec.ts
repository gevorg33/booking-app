import { describe, expect, it } from 'vitest';
import { readBusinessCurrency } from '../lib/business-currency';

describe('auth-store currency integration (provider app)', () => {
  it.each([
    { authCurrency: 'AMD', expected: 'AMD' },
    { authCurrency: 'eur', expected: 'EUR' },
    { authCurrency: undefined, expected: 'USD' },
    { authCurrency: 'INVALID', expected: 'USD' },
  ])(
    'maps auth business.currency=$authCurrency to readBusinessCurrency',
    ({ authCurrency, expected }) => {
      const business = authCurrency ? { currency: authCurrency } : null;
      expect(readBusinessCurrency(business?.currency)).toBe(expected);
    },
  );

  it('simulates login payload with currency on business and businesses[]', () => {
    const authPayload = {
      business: { id: 'b1', name: 'Salon', currency: 'GEL' },
      businesses: [
        { id: 'b1', name: 'Salon', currency: 'GEL' },
        { id: 'b2', name: 'Spa', currency: 'EUR' },
      ],
    };

    expect(readBusinessCurrency(authPayload.business.currency)).toBe('GEL');
    for (const summary of authPayload.businesses) {
      expect(readBusinessCurrency(summary.currency)).toBe(summary.currency);
    }
  });
});
