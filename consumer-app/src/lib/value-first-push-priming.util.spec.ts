import { beforeEach, describe, expect, it } from 'vitest';
import {
  DEFER_OS_PERMISSION_SCENARIOS,
  POST_BOOKING_PUSH_FLOW_SCENARIOS,
  VALUE_FIRST_PRIMING_ELIGIBILITY_SCENARIOS,
} from './value-first-push-priming.fixtures.js';
import {
  buildPushOptInPrimingCopy,
  isValueFirstPrimingEligible,
  resolvePostBookingPushFlow,
  shouldDeferOsPushPermissionUntilPrimingAccept,
  shouldRequestOsPushPermissionBeforePriming,
  shouldTriggerOsPushPermissionOnPrimingAccept,
} from './value-first-push-priming.util.js';
import { markPushOptInPrimingShown } from './push-opt-in-priming.util.js';

describe('value-first-push-priming.util (n99-4.4)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it.each(VALUE_FIRST_PRIMING_ELIGIBILITY_SCENARIOS)(
    'isValueFirstPrimingEligible $id',
    ({ completedBookingCount, isNative, isFcmBuild, permission, primingShown, expected }) => {
      if (primingShown) markPushOptInPrimingShown();
      expect(
        isValueFirstPrimingEligible({
          completedBookingCount,
          isNative,
          isFcmBuild,
          permission,
          primingShown,
        }),
      ).toBe(expected);
    },
  );

  it.each(DEFER_OS_PERMISSION_SCENARIOS)(
    'shouldDeferOsPushPermissionUntilPrimingAccept $id',
    ({ primingEligible, expected }) => {
      expect(shouldDeferOsPushPermissionUntilPrimingAccept({ primingEligible })).toBe(expected);
    },
  );

  it.each(POST_BOOKING_PUSH_FLOW_SCENARIOS)(
    'resolvePostBookingPushFlow $id',
    (scenario) => {
      expect(
        resolvePostBookingPushFlow({
          platform: scenario.platform,
          completedBookingCount: scenario.completedBookingCount,
          isNative: scenario.isNative,
          isFcmBuild: scenario.isFcmBuild,
          permission: scenario.permission,
          engagedProvisional: scenario.engagedProvisional,
          reaskShown: scenario.reaskShown,
        }),
      ).toBe(scenario.expected);
    },
  );

  it('defers Android POST_NOTIFICATIONS while value-first priming is eligible', () => {
    expect(
      shouldRequestOsPushPermissionBeforePriming({
        platform: 'android',
        completedBookingCount: 1,
        permission: 'prompt',
        isNative: true,
        isFcmBuild: true,
        primingEligible: true,
      }),
    ).toBe(false);
    expect(
      shouldRequestOsPushPermissionBeforePriming({
        platform: 'android',
        completedBookingCount: 1,
        permission: 'prompt',
        isNative: true,
        isFcmBuild: false,
        primingEligible: false,
      }),
    ).toBe(true);
  });

  it('builds peak-happiness copy about confirming the slot and reminders', () => {
    const copy = buildPushOptInPrimingCopy('en');
    expect(copy.title.toLowerCase()).toContain('confirm');
    expect(copy.body.toLowerCase()).toMatch(/remind|notify/);
    expect(copy.accept.toLowerCase()).toMatch(/remind|yes/);
  });

  it('only triggers OS permission after priming accept', () => {
    expect(shouldTriggerOsPushPermissionOnPrimingAccept()).toBe(true);
  });
});
