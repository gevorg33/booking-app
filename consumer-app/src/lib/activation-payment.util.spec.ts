import { describe, expect, it } from 'vitest';
import {
  ACTIVATION_CONFIRM_BLOCK_SCENARIOS,
  ACTIVATION_PATH_SCENARIOS,
  ACTIVATION_PAYMENT_FALLBACK_SCENARIOS,
  ACTIVATION_PAYMENT_METHOD_SCENARIOS,
  ACTIVATION_SLOT_PREFILL_SCENARIOS,
} from './activation-payment.fixtures.js';
import {
  activationPaymentBlocksConfirm,
  buildActivationPaymentCopy,
  isActivationBookingPath,
  isActivationSlotPrefilled,
  resolveActivationPaymentAnalyticsProps,
  resolveActivationPaymentMethod,
  resolveCheckoutAmountLabel,
  shouldAutoRetryWithPayAtVenue,
  shouldPreferPayAtVenueForActivation,
  shouldShowPaymentHiccupFallback,
} from './activation-payment.util.js';

describe('activation-payment.util (n99-3.3)', () => {
  it.each(ACTIVATION_PATH_SCENARIOS)('isActivationBookingPath $id', ({ input, expectActivation }) => {
    expect(isActivationBookingPath(input)).toBe(expectActivation);
  });

  it.each(ACTIVATION_PAYMENT_METHOD_SCENARIOS)(
    'resolveActivationPaymentMethod $id',
    ({ input, expectMethod }) => {
      expect(resolveActivationPaymentMethod(input)).toBe(expectMethod);
    },
  );

  it.each(ACTIVATION_PAYMENT_FALLBACK_SCENARIOS)(
    'payment fallback $id',
    ({ input, expectAutoRetry, expectShowFallback }) => {
      expect(shouldAutoRetryWithPayAtVenue(input)).toBe(expectAutoRetry);
      expect(shouldShowPaymentHiccupFallback(input)).toBe(expectShowFallback);
    },
  );

  it.each(ACTIVATION_CONFIRM_BLOCK_SCENARIOS)(
    'activationPaymentBlocksConfirm $id',
    ({ profile, service, quote, isActivationPath, paymentMethod, expectBlocks }) => {
      expect(
        activationPaymentBlocksConfirm({
          isActivationPath,
          profile,
          service,
          quote,
          paymentMethod,
        }),
      ).toBe(expectBlocks);
    },
  );

  it.each(ACTIVATION_SLOT_PREFILL_SCENARIOS)(
    'isActivationSlotPrefilled $id',
    ({ input, expectPrefilled }) => {
      expect(isActivationSlotPrefilled(input)).toBe(expectPrefilled);
    },
  );

  it('shouldPreferPayAtVenueForActivation when cash is available on activation path', () => {
    expect(
      shouldPreferPayAtVenueForActivation({ isActivationPath: true, cashAvailable: true }),
    ).toBe(true);
    expect(
      shouldPreferPayAtVenueForActivation({ isActivationPath: false, cashAvailable: true }),
    ).toBe(false);
  });

  it('buildActivationPaymentCopy returns localized strings', () => {
    const copy = buildActivationPaymentCopy('en');
    expect(copy.optionalHint.length).toBeGreaterThan(0);
    expect(copy.payAtVenueFallbackAction.length).toBeGreaterThan(0);
  });

  it('resolveCheckoutAmountLabel prefers pay-at-visit on activation', () => {
    expect(
      resolveCheckoutAmountLabel({
        quote: { servicePrice: 40, subtotal: 40, amountDue: 40, currency: 'USD' },
        service: { price: 40, prepaymentMode: 'none', onlinePaymentEnabled: false, depositAmount: undefined },
        paymentMethod: 'cash',
        isActivationPath: true,
      }),
    ).toBe('pay_at_visit');
  });

  it('resolveActivationPaymentAnalyticsProps includes fallback reason', () => {
    expect(
      resolveActivationPaymentAnalyticsProps({
        serviceId: 'svc-1',
        paymentMethod: 'cash',
        fallbackReason: 'checkout_failed',
      }),
    ).toEqual({
      serviceId: 'svc-1',
      onboardingStep: 'checkout_failed',
    });
  });
});
