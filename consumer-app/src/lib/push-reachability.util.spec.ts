import { beforeEach, describe, expect, it } from 'vitest';
import {
  PROVISIONAL_UPGRADE_SCENARIOS,
  PUSH_REACHABILITY_SCENARIOS,
  PUSH_REASK_SCENARIOS,
} from './push-reachability.fixtures.js';
import {
  buildPushReachabilityAnalyticsProps,
  hasRegisteredPushReachability,
  hasShownProvisionalUpgrade,
  hasShownPushSettingsReask,
  isPushReachableState,
  mapCapacitorPermission,
  markProvisionalPushEngaged,
  markProvisionalUpgradeShown,
  markPushReachabilityRegistered,
  markPushSettingsReaskShown,
  shouldReaskPushPermission,
  shouldShowProvisionalUpgradePrompt,
} from './push-reachability.util.js';

describe('push-reachability.util (n99-4)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it.each(PUSH_REACHABILITY_SCENARIOS)(
    'isPushReachableState $id',
    ({ state, expectedReachable }) => {
      expect(isPushReachableState(state)).toBe(expectedReachable);
    },
  );

  it('mapCapacitorPermission distinguishes provisional and default-on', () => {
    expect(mapCapacitorPermission('granted', { provisional: true })).toBe('provisional');
    expect(mapCapacitorPermission('granted')).toBe('full');
    expect(mapCapacitorPermission('prompt', { defaultOn: true })).toBe('default_on');
  });

  it.each(PUSH_REASK_SCENARIOS)('shouldReaskPushPermission $id', (scenario) => {
    if (scenario.reaskShown) markPushSettingsReaskShown();
    expect(
      shouldReaskPushPermission({
        permission: scenario.permission,
        completedBookingCount: scenario.completedBookingCount,
        reaskShown: scenario.reaskShown,
      }),
    ).toBe(scenario.expected);
  });

  it.each(PROVISIONAL_UPGRADE_SCENARIOS)(
    'shouldShowProvisionalUpgradePrompt $id',
    (scenario) => {
      if (scenario.engaged) markProvisionalPushEngaged();
      if (scenario.upgradeShown) markProvisionalUpgradeShown();
      expect(
        shouldShowProvisionalUpgradePrompt({
          permission: scenario.permission,
          engaged: scenario.engaged,
          upgradeShown: scenario.upgradeShown,
        }),
      ).toBe(scenario.expected);
    },
  );

  it('buildPushReachabilityAnalyticsProps marks reachable states', () => {
    expect(
      buildPushReachabilityAnalyticsProps({ permissionState: 'provisional' }),
    ).toEqual({
      pushReachability: true,
      pushReachabilityScope: 'transactional',
      pushPermissionState: 'provisional',
    });
  });

  it('persists reachability and re-ask markers', () => {
    markPushReachabilityRegistered();
    markProvisionalPushEngaged();
    expect(hasRegisteredPushReachability()).toBe(true);
    expect(hasShownPushSettingsReask()).toBe(false);
    markPushSettingsReaskShown();
    expect(hasShownPushSettingsReask()).toBe(true);
    markProvisionalUpgradeShown();
    expect(hasShownProvisionalUpgrade()).toBe(true);
  });
});
