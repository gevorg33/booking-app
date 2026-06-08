import { beforeEach, describe, expect, it } from 'vitest';
import {
  HIGH_VALUE_PUSH_MOMENT_SCENARIOS,
  PUSH_DENIED_REASK_SCENARIOS,
} from './push-denied-reask.fixtures.js';
import {
  buildPushDeniedReaskCopy,
  buildPushDeniedReaskShownAnalyticsProps,
  hasShownPushSettingsReask,
  isHighValuePushMoment,
  markPushSettingsReaskShown,
  shouldShowPushDeniedReask,
} from './push-denied-reask.util.js';

describe('push-denied-reask.util (n99-4.6)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it.each(HIGH_VALUE_PUSH_MOMENT_SCENARIOS)(
    'isHighValuePushMoment $id',
    ({ completedBookingCount, expected }) => {
      expect(isHighValuePushMoment(completedBookingCount)).toBe(expected);
    },
  );

  it.each(PUSH_DENIED_REASK_SCENARIOS)(
    'shouldShowPushDeniedReask $id',
    ({ permission, completedBookingCount, isNative, isFcmBuild, reaskShown, expected }) => {
      if (reaskShown) markPushSettingsReaskShown();
      expect(
        shouldShowPushDeniedReask({
          permission,
          completedBookingCount,
          isNative,
          isFcmBuild,
          reaskShown,
        }),
      ).toBe(expected);
    },
  );

  it('never nags more than once', () => {
    expect(
      shouldShowPushDeniedReask({
        permission: 'denied',
        completedBookingCount: 2,
        isNative: true,
        isFcmBuild: true,
      }),
    ).toBe(true);
    markPushSettingsReaskShown();
    expect(hasShownPushSettingsReask()).toBe(true);
    expect(
      shouldShowPushDeniedReask({
        permission: 'denied',
        completedBookingCount: 5,
        isNative: true,
        isFcmBuild: true,
      }),
    ).toBe(false);
  });

  it('builds one-line settings reason copy', () => {
    const copy = buildPushDeniedReaskCopy('en');
    expect(copy.body.toLowerCase()).toMatch(/remind|notification|settings/);
    expect(copy.openSettings.toLowerCase()).toContain('settings');
  });

  it('tracks denied reachability when re-ask is shown', () => {
    expect(buildPushDeniedReaskShownAnalyticsProps()).toEqual({
      pushReachability: false,
      pushReachabilityScope: 'transactional',
      pushPermissionState: 'denied',
    });
  });
});
