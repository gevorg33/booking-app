import { beforeEach, describe, expect, it } from 'vitest';
import {
  IOS_PROVISIONAL_FIRST_OPEN_SCENARIOS,
  IOS_PROVISIONAL_REGISTER_SCENARIOS,
} from './ios-provisional-push.fixtures.js';
import {
  buildIosProvisionalReachabilityAnalyticsProps,
  resolveIosProvisionalPermissionState,
  shouldEnsureIosProvisionalReachabilityOnFirstOpen,
} from './ios-provisional-push.util.js';
import {
  hasRegisteredPushReachability,
  markPushReachabilityRegistered,
  persistIosProvisionalPermissionState,
  readStoredIosProvisionalPermissionState,
} from './push-reachability.util.js';

describe('ios-provisional-push.util (n99-4.1)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it.each(IOS_PROVISIONAL_FIRST_OPEN_SCENARIOS)(
    'shouldEnsureIosProvisionalReachabilityOnFirstOpen $id',
    (scenario) => {
      expect(
        shouldEnsureIosProvisionalReachabilityOnFirstOpen({
          platform: scenario.platform,
          isNative: scenario.isNative,
          isFcmBuild: scenario.isFcmBuild,
          alreadyRegistered: scenario.alreadyRegistered,
          permissionReceive: scenario.permissionReceive,
        }),
      ).toBe(scenario.expectReachability);
    },
  );

  it.each(IOS_PROVISIONAL_REGISTER_SCENARIOS)(
    'signed-in iOS registration policy $id',
    ({ hasCustomerToken, expectRegister }) => {
      expect(hasCustomerToken).toBe(expectRegister);
    },
  );

  it('resolveIosProvisionalPermissionState treats granted as provisional', () => {
    expect(resolveIosProvisionalPermissionState('granted')).toBe('provisional');
    expect(resolveIosProvisionalPermissionState('denied')).toBe('denied');
    expect(resolveIosProvisionalPermissionState('prompt')).toBe('prompt');
  });

  it('buildIosProvisionalReachabilityAnalyticsProps marks reachable provisional', () => {
    expect(buildIosProvisionalReachabilityAnalyticsProps()).toEqual({
      pushReachability: true,
      pushReachabilityScope: 'transactional',
      pushPermissionState: 'provisional',
    });
  });

  it('persists provisional permission state on first open', () => {
    persistIosProvisionalPermissionState();
    expect(readStoredIosProvisionalPermissionState()).toBe('provisional');
    markPushReachabilityRegistered();
    expect(hasRegisteredPushReachability()).toBe(true);
  });
});
