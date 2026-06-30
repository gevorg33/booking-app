import { CONFIGURE_PACKAGE_ONLINE_PAYMENT_PROMPTS } from './ai-configure-package-online-payment.fixtures.js';
import {
  enrichConfigurePackageOnlinePaymentParamsFromPrompt,
  isConfigurePackageOnlinePaymentPrompt,
  parseConfigurePackageOnlinePaymentFromPrompt,
  rescueConfigurePackageOnlinePaymentIntent,
} from './ai-configure-package-online-payment.util.js';

describe('ai-configure-package-online-payment.util', () => {
  it.each(CONFIGURE_PACKAGE_ONLINE_PAYMENT_PROMPTS)(
    'detects package online payment prompt $id',
    ({ prompt }) => {
      expect(isConfigurePackageOnlinePaymentPrompt(prompt)).toBe(true);
    },
  );

  it.each(CONFIGURE_PACKAGE_ONLINE_PAYMENT_PROMPTS)(
    'parses package online payment prompt $id',
    ({ prompt, paramsPartial }) => {
      const parsed = parseConfigurePackageOnlinePaymentFromPrompt(prompt, {});
      expect(parsed).toMatchObject(paramsPartial ?? {});
    },
  );

  it('does not detect service-scoped online payment', () => {
    expect(
      isConfigurePackageOnlinePaymentPrompt(
        'Accept online payment on public booking for all services with 50% prepayment',
      ),
    ).toBe(false);
  });

  it('does not detect package CRUD without payment', () => {
    expect(
      isConfigurePackageOnlinePaymentPrompt(
        'Create Spa Day package with massage + facial',
      ),
    ).toBe(false);
    expect(
      isConfigurePackageOnlinePaymentPrompt('Update Glow package discount to 20%'),
    ).toBe(false);
  });

  it('rescues unknown action to configure_package_online_payment', () => {
    expect(
      rescueConfigurePackageOnlinePaymentIntent(
        'Require 50% online prepayment for Spa Day package',
        'unknown',
      ),
    ).toEqual({
      action: 'configure_package_online_payment',
      rescueReason: 'configure_package_online_payment',
    });
  });

  it('enriches params from prompt', () => {
    const params = enrichConfigurePackageOnlinePaymentParamsFromPrompt(
      {},
      'Require 50% online prepayment for Spa Day package',
    );
    expect(params.packageName).toBe('Spa Day');
    expect(params.prepaymentMode).toBe('deposit');
    expect(params.depositPercent).toBe(50);
  });
});
