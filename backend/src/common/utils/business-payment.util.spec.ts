import {
  DEFAULT_BUSINESS_PAYMENT_SETTINGS,
  businessPaymentTipsEnabled,
  readBusinessPaymentSettings,
} from './business-payment.util.js';

describe('business-payment.util (prov-exp-2.3)', () => {
  it('defaults tips to disabled', () => {
    expect(DEFAULT_BUSINESS_PAYMENT_SETTINGS).toEqual({ tipsEnabled: false });
    expect(readBusinessPaymentSettings(undefined)).toEqual({
      tipsEnabled: false,
    });
    expect(readBusinessPaymentSettings({})).toEqual({ tipsEnabled: false });
    expect(readBusinessPaymentSettings({ payment: {} })).toEqual({
      tipsEnabled: false,
    });
  });

  it('reads tipsEnabled when explicitly true', () => {
    expect(
      readBusinessPaymentSettings({ payment: { tipsEnabled: true } }),
    ).toEqual({ tipsEnabled: true });
    expect(businessPaymentTipsEnabled({ payment: { tipsEnabled: true } })).toBe(
      true,
    );
  });

  it('treats non-boolean tipsEnabled as disabled', () => {
    expect(
      readBusinessPaymentSettings({ payment: { tipsEnabled: 'yes' } }),
    ).toEqual({ tipsEnabled: false });
    expect(
      readBusinessPaymentSettings({ payment: { tipsEnabled: 1 } }),
    ).toEqual({ tipsEnabled: false });
  });
});
