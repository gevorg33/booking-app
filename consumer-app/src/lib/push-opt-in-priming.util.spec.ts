import { beforeEach, describe, expect, it } from 'vitest';
import {
  PUSH_PRIMING_OPT_IN_SCENARIOS,
  PUSH_PRIMING_SCENARIOS,
} from './push-opt-in-priming.fixtures.js';
import {
  buildPushOptInPrimingCopy,
  canPresentPushOptInPriming,
  computePushPrimingOptInRate,
  markPushOptInPrimingShown,
  meetsPushPrimingOptInTarget,
  PUSH_PRIMING_OPT_IN_TARGET,
  readPushPrimingDecision,
  recordPushPrimingDecision,
  shouldShowPushOptInPriming,
} from './push-opt-in-priming.util.js';

describe('push-opt-in-priming.util', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it.each(PUSH_PRIMING_SCENARIOS)(
    'shouldShowPushOptInPriming $id',
    ({ completedBookingCount, primingShown, expected }) => {
      if (primingShown) markPushOptInPrimingShown();
      expect(shouldShowPushOptInPriming(completedBookingCount)).toBe(expected);
    },
  );

  it.each(PUSH_PRIMING_OPT_IN_SCENARIOS)(
    'computePushPrimingOptInRate $id',
    ({ shown, accepted, expectedRate }) => {
      expect(computePushPrimingOptInRate({ shown, accepted })).toBe(expectedRate);
    },
  );

  it('requires native FCM build to present priming', () => {
    expect(
      canPresentPushOptInPriming({
        completedBookingCount: 1,
        isNative: true,
        isFcmBuild: true,
      }),
    ).toBe(true);
    expect(
      canPresentPushOptInPriming({
        completedBookingCount: 1,
        isNative: false,
        isFcmBuild: true,
      }),
    ).toBe(false);
  });

  it('builds value-first copy with confirmed-slot framing', () => {
    expect(buildPushOptInPrimingCopy().title).toContain('confirmed');
    expect(buildPushOptInPrimingCopy().body).toContain('remind');
  });

  it('tracks priming decisions once', () => {
    recordPushPrimingDecision('declined');
    expect(readPushPrimingDecision()).toBe('declined');
    expect(shouldShowPushOptInPriming(1)).toBe(false);
  });

  it('exposes the 80% opt-in target', () => {
    expect(PUSH_PRIMING_OPT_IN_TARGET).toBe(0.8);
    expect(meetsPushPrimingOptInTarget(0.8)).toBe(true);
    expect(meetsPushPrimingOptInTarget(0.79)).toBe(false);
  });
});
