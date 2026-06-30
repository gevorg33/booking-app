import { describe, expect, it } from 'vitest';
import { providerMobileGuide } from '../lib/mobile-guide/index.ts';
import {
  buildProviderGuideListContext,
  PROVIDER_GUIDE_PATH,
} from '../lib/provider-guide.util.js';

describe('GuidePage corpus (ai-guide-1.9.7)', () => {
  it('lists provider topics for staff role', () => {
    const topics = providerMobileGuide.listGuideTopics(
      buildProviderGuideListContext({ membershipRole: 'provider' }),
    );
    expect(topics.some((row) => row.topicId === 'provider-getting-started')).toBe(true);
    expect(topics.some((row) => row.topicId === 'provider-team-manager')).toBe(false);
  });

  it('includes manager topics for owner role', () => {
    const topics = providerMobileGuide.listGuideTopics(
      buildProviderGuideListContext({ membershipRole: 'owner' }),
    );
    expect(topics.some((row) => row.topicId === 'provider-team-manager')).toBe(true);
  });

  it('includes clinic overlay for lab-enabled businesses', () => {
    const topics = providerMobileGuide.listGuideTopics(
      buildProviderGuideListContext({
        membershipRole: 'provider',
        labFeaturesEnabled: true,
      }),
    );
    expect(topics.some((row) => row.topicId === 'provider-clinic')).toBe(true);
  });

  it('registers guide route under profile tab', () => {
    expect(PROVIDER_GUIDE_PATH).toBe('/tabs/profile/guide');
  });
});
