import { beforeEach, describe, expect, it } from 'vitest';
import {
  PROVISIONAL_ENGAGEMENT_MARK_SCENARIOS,
  PROVISIONAL_TO_FULL_UPGRADE_SCENARIOS,
  PROVISIONAL_UPGRADE_SLUG_SCENARIOS,
} from './provisional-to-full-push.fixtures.js';
import {
  buildProvisionalToFullUpgradeAcceptedAnalyticsProps,
  buildProvisionalToFullUpgradeCopy,
  buildProvisionalToFullUpgradeShownAnalyticsProps,
  markProvisionalPushEngaged,
  markProvisionalUpgradeShown,
  resolveProvisionalUpgradeSlug,
  shouldMarkProvisionalPushEngaged,
  shouldShowProvisionalToFullUpgradePrompt,
} from './provisional-to-full-push.util.js';

describe('provisional-to-full-push.util (n99-4.5)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it.each(PROVISIONAL_TO_FULL_UPGRADE_SCENARIOS)(
    'shouldShowProvisionalToFullUpgradePrompt $id',
    ({ platform, permission, engaged, upgradeShown, expected }) => {
      if (engaged) markProvisionalPushEngaged();
      if (upgradeShown) markProvisionalUpgradeShown();
      expect(
        shouldShowProvisionalToFullUpgradePrompt({
          platform,
          permission,
          engaged,
          upgradeShown,
        }),
      ).toBe(expected);
    },
  );

  it.each(PROVISIONAL_ENGAGEMENT_MARK_SCENARIOS)(
    'shouldMarkProvisionalPushEngaged $id',
    ({ platform, permission, expected }) => {
      expect(shouldMarkProvisionalPushEngaged({ platform, permission })).toBe(expected);
    },
  );

  it.each(PROVISIONAL_UPGRADE_SLUG_SCENARIOS)(
    'resolveProvisionalUpgradeSlug $id',
    ({ eventSlug, pathname, activePushSlug, expected }) => {
      expect(
        resolveProvisionalUpgradeSlug({ eventSlug, pathname, activePushSlug }),
      ).toBe(expected);
    },
  );

  it('builds keep-these-on copy after engagement', () => {
    const copy = buildProvisionalToFullUpgradeCopy('en');
    expect(copy.title.toLowerCase()).toMatch(/keep|reminder/);
    expect(copy.body.toLowerCase()).toMatch(/reminder|notification|lock screen/);
    expect(copy.accept.toLowerCase()).toMatch(/keep|reminder/);
  });

  it('analytics props distinguish shown vs accepted upgrade', () => {
    expect(buildProvisionalToFullUpgradeShownAnalyticsProps()).toEqual({
      pushReachability: true,
      pushReachabilityScope: 'transactional',
      pushPermissionState: 'provisional',
    });
    expect(buildProvisionalToFullUpgradeAcceptedAnalyticsProps(true)).toEqual({
      pushReachability: true,
      pushReachabilityScope: 'transactional',
      pushPermissionState: 'full',
      pushOptIn: true,
    });
  });
});
