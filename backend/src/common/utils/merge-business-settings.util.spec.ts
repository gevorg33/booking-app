import { mergeBusinessSettings } from './merge-business-settings.util.js';

describe('mergeBusinessSettings', () => {
  it('merges nested publicBooking without dropping branding', () => {
    const existing = {
      branding: { logoUrl: 'https://cdn/logo.png' },
      publicBooking: { enabled: true, acceptCashPayments: false },
    };
    const patch = {
      publicBooking: { acceptCashPayments: true },
      reports: { weeklyDigest: true },
    };
    expect(mergeBusinessSettings(existing, patch)).toEqual({
      branding: { logoUrl: 'https://cdn/logo.png' },
      publicBooking: { enabled: true, acceptCashPayments: true },
      reports: { weeklyDigest: true },
    });
  });

  it('returns copy of existing when patch is empty', () => {
    const existing = { locale: 'en' };
    expect(mergeBusinessSettings(existing, {})).toEqual({ locale: 'en' });
  });
});
