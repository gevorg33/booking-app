import { beforeEach, describe, expect, it } from 'vitest';
import {
  ANDROID_DEFAULT_ON_FIRST_OPEN_SCENARIOS,
  ANDROID_DEFAULT_ON_REACHABLE_SCENARIOS,
  ANDROID_POST_BOOKING_PERMISSION_SCENARIOS,
} from './android-post-booking-push.fixtures.js';
import {
  buildAndroidDefaultOnReachabilityAnalyticsProps,
  hasRequestedAndroidPostBookingPermission,
  isAndroidDefaultOnReachable,
  markAndroidPostBookingPermissionRequested,
  markPushReachabilityRegistered,
  persistAndroidDefaultOnPermissionState,
  shouldEnsureAndroidDefaultOnReachabilityOnFirstOpen,
  shouldRequestAndroidPostBookingPermission,
} from './android-post-booking-push.util.js';
import { hasRegisteredPushReachability } from './push-reachability.util.js';

describe('android-post-booking-push.util (n99-4.2)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it.each(ANDROID_POST_BOOKING_PERMISSION_SCENARIOS)(
    'shouldRequestAndroidPostBookingPermission $id',
    ({ platform, sdkInt, completedBookingCount, permission, alreadyRequested, expected }) => {
      expect(
        shouldRequestAndroidPostBookingPermission({
          platform,
          sdkInt,
          completedBookingCount,
          permission,
          alreadyRequested,
        }),
      ).toBe(expected);
    },
  );

  it.each(ANDROID_DEFAULT_ON_FIRST_OPEN_SCENARIOS)(
    'shouldEnsureAndroidDefaultOnReachabilityOnFirstOpen $id',
    (scenario) => {
      expect(
        shouldEnsureAndroidDefaultOnReachabilityOnFirstOpen({
          platform: scenario.platform,
          isNative: scenario.isNative,
          isFcmBuild: scenario.isFcmBuild,
          alreadyRegistered: scenario.alreadyRegistered,
          permissionReceive: scenario.permissionReceive,
          sdkInt: scenario.sdkInt,
        }),
      ).toBe(scenario.expectReachability);
    },
  );

  it.each(ANDROID_DEFAULT_ON_REACHABLE_SCENARIOS)(
    'isAndroidDefaultOnReachable $id',
    ({ platform, sdkInt, permissionReceive, expected }) => {
      expect(isAndroidDefaultOnReachable({ platform, sdkInt, permissionReceive })).toBe(expected);
    },
  );

  it('buildAndroidDefaultOnReachabilityAnalyticsProps marks reachable default_on', () => {
    expect(buildAndroidDefaultOnReachabilityAnalyticsProps()).toEqual({
      pushReachability: true,
      pushReachabilityScope: 'transactional',
      pushPermissionState: 'default_on',
    });
  });

  it('persists post-booking request marker and default-on state', () => {
    markAndroidPostBookingPermissionRequested();
    expect(hasRequestedAndroidPostBookingPermission()).toBe(true);
    persistAndroidDefaultOnPermissionState();
    expect(localStorage.getItem('consumer-push-permission-state')).toBe('default_on');
    markPushReachabilityRegistered();
    expect(hasRegisteredPushReachability()).toBe(true);
  });
});
