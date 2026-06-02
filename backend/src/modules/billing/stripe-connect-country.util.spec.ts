import { resolveStripeConnectCountry } from './stripe-connect-country.util.js';

describe('resolveStripeConnectCountry', () => {
  it('uses tenant stripeConnectCountry when set', () => {
    expect(
      resolveStripeConnectCountry(
        { timezone: 'UTC', settings: { stripeConnectCountry: 'DE' } },
        'AE',
      ),
    ).toBe('DE');
  });

  it('infers country from timezone before platform default', () => {
    expect(
      resolveStripeConnectCountry({ timezone: 'Asia/Yerevan', settings: {} }, 'AE'),
    ).toBe('AM');
  });

  it('falls back to platform default when timezone and locale are unknown', () => {
    expect(resolveStripeConnectCountry({ timezone: 'UTC', settings: {} }, 'AE')).toBe('AE');
  });
});
