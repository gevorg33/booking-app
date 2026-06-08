import { beforeEach, describe, expect, it } from 'vitest';
import {
  ACTIVATION_PATH_AB_ASSIGNMENT_SCENARIOS,
  ACTIVATION_PATH_AB_BEHAVIOR_SCENARIOS,
  ACTIVATION_PATH_AB_PROMOTION_SCENARIOS,
} from './activation-path-ab.fixtures.js';
import {
  ACTIVATION_PATH_PROMOTED_KEY,
  ACTIVATION_PATH_VARIANTS_KEY,
  assignActivationPathVariants,
  buildActivationPathAnalyticsProps,
  buildPreConfirmSignInStorageKey,
  cacheActivationPathPromoted,
  parseActivationPathPromotedFromConfig,
  readCachedActivationPathPromoted,
  resolveActivationPathVariants,
  shouldAutoPreselectNearestSlot,
  shouldPromptPreConfirmSignIn,
} from './activation-path-ab.util.js';
import {
  resolveActivationPaymentMethod,
  shouldPreferPayAtVenueForActivation,
} from './activation-payment.util.js';
import { shouldPromptPostBookingSignIn } from './post-booking-sign-in.util.js';

describe('activation-path-ab.util (n99-3.8)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it.each(ACTIVATION_PATH_AB_ASSIGNMENT_SCENARIOS)(
    'assignActivationPathVariants $id',
    ({ anonId, expect: expected }) => {
      expect(assignActivationPathVariants(anonId)).toEqual(expected);
    },
  );

  it.each(ACTIVATION_PATH_AB_PROMOTION_SCENARIOS)(
    'resolveActivationPathVariants applies promotion $id',
    ({ anonId, promoted, expect: expected }) => {
      expect(resolveActivationPathVariants(anonId, promoted)).toEqual(expected);
      expect(localStorage.getItem(ACTIVATION_PATH_VARIANTS_KEY)).toBeTruthy();
    },
  );

  it('persists assigned variants and reuses them on subsequent resolves', () => {
    const first = resolveActivationPathVariants('device-stable-001');
    localStorage.removeItem(ACTIVATION_PATH_VARIANTS_KEY);
    localStorage.setItem(ACTIVATION_PATH_VARIANTS_KEY, JSON.stringify(first));
    expect(resolveActivationPathVariants('device-other-999')).toEqual(first);
  });

  it('buildActivationPathAnalyticsProps mirrors resolved variants', () => {
    const variants = resolveActivationPathVariants('device-alpha-001');
    expect(buildActivationPathAnalyticsProps(variants)).toEqual(variants);
  });

  it.each(
    ACTIVATION_PATH_AB_BEHAVIOR_SCENARIOS.filter((entry) => 'expectAttempt' in entry),
  )('shouldAutoPreselectNearestSlot $id', (scenario) => {
    expect(
      shouldAutoPreselectNearestSlot({
        slotPreselection: scenario.slotPreselection,
        nearestAttempted: scenario.nearestAttempted,
        slot: scenario.slot,
      }),
    ).toBe(scenario.expectAttempt);
  });

  it.each(
    ACTIVATION_PATH_AB_BEHAVIOR_SCENARIOS.filter((entry) => 'expectPostBooking' in entry),
  )('sign-in placement $id', (scenario) => {
    expect(
      shouldPromptPostBookingSignIn({
        wasGuestAtBooking: scenario.wasGuestAtBooking,
        hasExistingSession: scenario.hasExistingSession,
        hasOneTapProvider: scenario.hasOneTapProvider,
        signInPlacement: scenario.signInPlacement,
      }),
    ).toBe(scenario.expectPostBooking);
    expect(
      shouldPromptPreConfirmSignIn({
        signInPlacement: scenario.signInPlacement,
        wasGuestAtBooking: scenario.wasGuestAtBooking,
        hasExistingSession: scenario.hasExistingSession,
        hasOneTapProvider: scenario.hasOneTapProvider,
        dismissed: scenario.dismissed,
        slotSelected: true,
      }),
    ).toBe(scenario.expectPreConfirm);
  });

  it.each(
    ACTIVATION_PATH_AB_BEHAVIOR_SCENARIOS.filter((entry) => 'expectPreferPayAtVenue' in entry),
  )('payment timing $id', (scenario) => {
    expect(
      shouldPreferPayAtVenueForActivation({
        isActivationPath: scenario.isActivationPath,
        cashAvailable: scenario.cashAvailable,
        paymentTiming: scenario.paymentTiming,
      }),
    ).toBe(scenario.expectPreferPayAtVenue);
    expect(
      resolveActivationPaymentMethod({
        isActivationPath: scenario.isActivationPath,
        cashAvailable: scenario.cashAvailable,
        currentMethod: scenario.currentMethod ?? 'online',
        paymentTiming: scenario.paymentTiming,
      }),
    ).toBe(scenario.expectMethod);
  });

  it('caches promoted variants from remote config', () => {
    cacheActivationPathPromoted({
      signInPlacement: 'pre_confirm',
      paymentTiming: 'online_first',
    });
    expect(readCachedActivationPathPromoted()).toEqual({
      signInPlacement: 'pre_confirm',
      paymentTiming: 'online_first',
    });
    expect(localStorage.getItem(ACTIVATION_PATH_PROMOTED_KEY)).toBeTruthy();
  });

  it('parseActivationPathPromotedFromConfig validates values', () => {
    expect(
      parseActivationPathPromotedFromConfig({
        activationPathAb: {
          signInPlacement: 'pre_confirm',
          slotPreselection: 'invalid' as never,
          paymentTiming: 'online_first',
        },
      }),
    ).toEqual({
      signInPlacement: 'pre_confirm',
      paymentTiming: 'online_first',
    });
  });

  it('buildPreConfirmSignInStorageKey is stable per salon/service', () => {
    expect(buildPreConfirmSignInStorageKey('salon-a', 'svc-1')).toBe(
      'pre_confirm_salon-a_svc-1',
    );
  });
});
