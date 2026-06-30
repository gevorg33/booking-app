import { describe, expect, it } from 'vitest';
import {
  consumerMobileGuide,
  isGuideFlowPlaybookVisible,
  isMobileGuideOfflineBundleFresh,
  resolveActiveGuideVerticalOverlays,
} from './index.ts';
import {
  MOBILE_GUIDE_BUNDLE,
  MOBILE_GUIDE_OFFLINE_MANIFEST,
} from './mobile-guide.bundle.ts';

describe('consumer mobile guide (ai-guide-1.9.1)', () => {
  it('loads synced customer playbooks with unique topicIds', () => {
    consumerMobileGuide.assertIntegrity();
    expect(consumerMobileGuide.bundle.playbooks.length).toBeGreaterThanOrEqual(6);
  });

  it('resolves EN copy for getting started', () => {
    consumerMobileGuide.assertI18nCoverage('en');
    const resolved = consumerMobileGuide.resolveGuidePlaybook(
      'consumer-getting-started',
      'en',
      { surface: 'customer' },
    );
    expect(resolved?.title).toMatch(/getting started/i);
    expect(resolved?.steps.length).toBeGreaterThanOrEqual(3);
  });

  it.each([
    {
      id: 'clinic-consumer-visible',
      topicId: 'consumer-clinic',
      ctx: { surface: 'customer' as const, vertical: 'clinic' },
      expectedVisible: true,
    },
    {
      id: 'clinic-consumer-hidden-salon',
      topicId: 'consumer-clinic',
      ctx: { surface: 'customer' as const, vertical: 'salon' },
      expectedVisible: false,
    },
  ])('vertical gating $id', ({ topicId, ctx, expectedVisible }) => {
    const playbooks = consumerMobileGuide.listGuideTopics(ctx);
    const visible = playbooks.some((row) => row.topicId === topicId);
    expect(visible).toBe(expectedVisible);
  });

  it('filters overlay playbooks by surface during merge', () => {
    const activeVerticals = resolveActiveGuideVerticalOverlays({ vertical: 'clinic' });
    const providerOverlayPlaybook = consumerMobileGuide.bundle.overlays
      .flatMap((row) => row.playbooks)
      .find((row) => row.topicId === 'provider-clinic');
    expect(providerOverlayPlaybook).toBeTruthy();
    expect(
      isGuideFlowPlaybookVisible(providerOverlayPlaybook!, { surface: 'customer' }, activeVerticals),
    ).toBe(false);
  });
});

describe('consumer mobile guide offline bundle (ai-guide-1.9.12)', () => {
  it('ships manifest stamped with app version and corpus revision', () => {
    expect(MOBILE_GUIDE_OFFLINE_MANIFEST.surface).toBe('customer');
    expect(MOBILE_GUIDE_OFFLINE_MANIFEST.appVersion).toMatch(/\d+\.\d+\.\d+/);
    expect(MOBILE_GUIDE_OFFLINE_MANIFEST.corpusRevision.length).toBeGreaterThanOrEqual(8);
    expect(MOBILE_GUIDE_OFFLINE_MANIFEST.playbookCount).toBe(MOBILE_GUIDE_BUNDLE.playbooks.length);
    expect(MOBILE_GUIDE_OFFLINE_MANIFEST.overlayCount).toBe(MOBILE_GUIDE_BUNDLE.overlays.length);
    expect(MOBILE_GUIDE_OFFLINE_MANIFEST.locales).toEqual(['en', 'hy', 'ru']);
  });

  it('matches embedded app version for offline fallback (1.8.10)', () => {
    expect(
      isMobileGuideOfflineBundleFresh(
        MOBILE_GUIDE_OFFLINE_MANIFEST,
        MOBILE_GUIDE_OFFLINE_MANIFEST.appVersion,
      ),
    ).toBe(true);
  });

  it('resolves guide topics without network from embedded assets', () => {
    const topics = consumerMobileGuide.listGuideTopics({ surface: 'customer' });
    expect(topics.some((row) => row.topicId === 'consumer-getting-started')).toBe(true);
    const resolved = consumerMobileGuide.resolveGuidePlaybook(
      'consumer-getting-started',
      'en',
      { surface: 'customer' },
    );
    expect(resolved?.steps.length).toBeGreaterThanOrEqual(3);
  });
});
