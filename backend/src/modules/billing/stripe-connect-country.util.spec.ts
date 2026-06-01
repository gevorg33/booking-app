import { resolveStripeConnectCountry } from './stripe-connect-country.util.js';

describe('resolveStripeConnectCountry', () => {
  it('platform default overrides business timezone and country', () => {
    expect(
      resolveStripeConnectCountry(
        { timezone: 'Asia/Muscat', settings: { country: 'OM' } },
        'AE',
      ),
    ).toBe('AE');
  });

  it('uses explicit stripeConnectCountry when platform default unset', () => {
    expect(
      resolveStripeConnectCountry(
        { timezone: 'UTC', settings: { stripeConnectCountry: 'AE' } },
        '',
      ),
    ).toBe('AE');
  });

  it('prefers platform default over Yerevan timezone for AE platform', () => {
    expect(
      resolveStripeConnectCountry({ timezone: 'Asia/Yerevan', settings: {} }, 'AE'),
    ).toBe('AE');
  });

  it('maps Yerevan timezone to AM when platform default unset', () => {
    expect(resolveStripeConnectCountry({ timezone: 'Asia/Yerevan', settings: {} }, '')).toBe('AM');
  });

  it('maps Dubai timezone to AE when platform default unset', () => {
    expect(resolveStripeConnectCountry({ timezone: 'Asia/Dubai', settings: {} }, '')).toBe('AE');
  });

  it('maps hy locale dial code to AM when platform default is empty', () => {
    expect(resolveStripeConnectCountry({ timezone: 'UTC', settings: { locale: 'hy' } }, '')).toBe(
      'AM',
    );
  });

  it('falls back to platform default', () => {
    expect(resolveStripeConnectCountry({ timezone: 'UTC', settings: {} }, 'AE')).toBe('AE');
  });
});
