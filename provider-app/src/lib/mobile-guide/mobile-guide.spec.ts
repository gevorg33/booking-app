import { describe, expect, it } from 'vitest';
import { isMobileGuideOfflineBundleFresh, providerMobileGuide } from './index.ts';
import {
  MOBILE_GUIDE_BUNDLE,
  MOBILE_GUIDE_OFFLINE_MANIFEST,
} from './mobile-guide.bundle.ts';

describe('provider mobile guide (ai-guide-1.9.1)', () => {
  it('loads synced provider playbooks with unique topicIds', () => {
    providerMobileGuide.assertIntegrity();
    expect(providerMobileGuide.bundle.playbooks.length).toBeGreaterThanOrEqual(10);
  });

  it('resolves EN copy for getting started', () => {
    providerMobileGuide.assertI18nCoverage('en');
    const resolved = providerMobileGuide.resolveGuidePlaybook(
      'provider-getting-started',
      'en',
      { surface: 'provider', roleProfile: 'provider' },
    );
    expect(resolved?.title).toMatch(/provider app/i);
    expect(resolved?.steps.length).toBeGreaterThanOrEqual(2);
  });

  it.each([
    {
      id: 'team-manager-owner',
      topicId: 'provider-team-manager',
      ctx: { surface: 'provider' as const, roleProfile: 'owner' as const },
      expectedVisible: true,
    },
    {
      id: 'team-manager-provider-hidden',
      topicId: 'provider-team-manager',
      ctx: { surface: 'provider' as const, roleProfile: 'provider' as const },
      expectedVisible: false,
    },
    {
      id: 'clinic-provider-visible',
      topicId: 'provider-clinic',
      ctx: { surface: 'provider' as const, vertical: 'clinic', roleProfile: 'provider' as const },
      expectedVisible: true,
    },
  ])('role and vertical gating $id', ({ topicId, ctx, expectedVisible }) => {
    const playbooks = providerMobileGuide.listGuideTopics(ctx);
    expect(playbooks.some((row) => row.topicId === topicId)).toBe(expectedVisible);
  });

  it('hides gift cards without module entitlement', () => {
    const hidden = providerMobileGuide.listGuideTopics({
      surface: 'provider',
      roleProfile: 'provider',
    });
    expect(hidden.some((row) => row.topicId === 'provider-gift-cards')).toBe(false);

    const visible = providerMobileGuide.listGuideTopics({
      surface: 'provider',
      roleProfile: 'provider',
      enabledModules: ['giftCards'],
      planTierId: 'business',
    });
    expect(visible.some((row) => row.topicId === 'provider-gift-cards')).toBe(true);
  });
});

describe('provider mobile guide offline bundle (ai-guide-1.9.12)', () => {
  it('ships manifest stamped with app version and corpus revision', () => {
    expect(MOBILE_GUIDE_OFFLINE_MANIFEST.surface).toBe('provider');
    expect(MOBILE_GUIDE_OFFLINE_MANIFEST.appVersion).toMatch(/\d+\.\d+\.\d+/);
    expect(MOBILE_GUIDE_OFFLINE_MANIFEST.corpusRevision.length).toBeGreaterThanOrEqual(8);
    expect(MOBILE_GUIDE_OFFLINE_MANIFEST.playbookCount).toBe(MOBILE_GUIDE_BUNDLE.playbooks.length);
    expect(MOBILE_GUIDE_OFFLINE_MANIFEST.overlayCount).toBe(MOBILE_GUIDE_BUNDLE.overlays.length);
  });

  it('matches embedded app version for offline AI fallback (1.8.10)', () => {
    expect(
      isMobileGuideOfflineBundleFresh(
        MOBILE_GUIDE_OFFLINE_MANIFEST,
        MOBILE_GUIDE_OFFLINE_MANIFEST.appVersion,
      ),
    ).toBe(true);
  });

  it('resolves provider guide topics from embedded assets without network', () => {
    const resolved = providerMobileGuide.resolveGuidePlaybook(
      'provider-getting-started',
      'hy',
      { surface: 'provider', roleProfile: 'provider' },
    );
    expect(resolved?.title).toMatch(/[\u0530-\u058F]/);
    expect(resolved?.steps.length).toBeGreaterThanOrEqual(2);
  });
});
