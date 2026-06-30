import { describe, expect, it } from 'vitest';
import {
  PROVIDER_CLINIC_GUIDE_TOPIC_ID,
  PROVIDER_TEAM_MANAGER_GUIDE_TOPIC_ID,
} from './provider-guide-gating.fixtures.js';
import {
  buildProviderGuideListContext,
  buildProviderGuidePath,
  isProviderGuideTopicVisible,
  parseProviderGuideTopicId,
  providerGuideProfilePath,
  providerGuideTopicElementId,
  resolveProviderGuideNavigateHref,
  resolveProviderGuideRoleProfile,
  sanitizeProviderGuideTopicId,
} from './provider-guide.util.js';

describe('buildProviderGuidePath', () => {
  it('builds profile guide route with optional topicId', () => {
    expect(buildProviderGuidePath()).toBe('/tabs/profile/guide');
    expect(buildProviderGuidePath({ topicId: 'provider-getting-started' })).toBe(
      '/tabs/profile/guide?topicId=provider-getting-started',
    );
  });
});

describe('parseProviderGuideTopicId', () => {
  it('reads topicId from search string', () => {
    expect(parseProviderGuideTopicId('?topicId=provider-tabs')).toBe('provider-tabs');
    expect(parseProviderGuideTopicId('')).toBeNull();
  });
});

describe('resolveProviderGuideRoleProfile', () => {
  it.each([
    { role: 'owner', expected: 'owner' },
    { role: 'manager', expected: 'manager' },
    { role: 'admin', expected: 'manager' },
    { role: 'provider', expected: 'provider' },
  ])('maps membership role $role', ({ role, expected }) => {
    expect(resolveProviderGuideRoleProfile(role)).toBe(expected);
  });
});

describe('buildProviderGuideListContext', () => {
  it('uses clinic vertical when lab features are enabled', () => {
    expect(
      buildProviderGuideListContext({ membershipRole: 'provider', labFeaturesEnabled: true })
        .vertical,
    ).toBe('clinic');
  });
});

describe('resolveProviderGuideNavigateHref', () => {
  it('maps guide navigate target to profile guide route', () => {
    expect(
      resolveProviderGuideNavigateHref({
        path: 'guide',
        query: { topicId: 'provider-assistant' },
      }),
    ).toBe('/tabs/profile/guide?topicId=provider-assistant');
  });

  it('maps tab navigate targets', () => {
    expect(resolveProviderGuideNavigateHref({ path: '/tabs/today' })).toBe('/tabs/today');
  });
});

describe('providerGuideTopicElementId', () => {
  it('prefixes topic ids for anchor scroll', () => {
    expect(providerGuideTopicElementId('provider-appointments')).toBe(
      'guide-topic-provider-appointments',
    );
  });
});

describe('providerGuideProfilePath', () => {
  it('returns profile tab path for back navigation', () => {
    expect(providerGuideProfilePath()).toBe('/tabs/profile');
  });
});

describe('sanitizeProviderGuideTopicId (ai-guide-1.9.9)', () => {
  it('strips team-manager topic for staff', () => {
    expect(
      sanitizeProviderGuideTopicId(PROVIDER_TEAM_MANAGER_GUIDE_TOPIC_ID, {
        membershipRole: 'provider',
        labFeaturesEnabled: true,
      }),
    ).toBeNull();
  });

  it('keeps team-manager topic for owners', () => {
    expect(
      sanitizeProviderGuideTopicId(PROVIDER_TEAM_MANAGER_GUIDE_TOPIC_ID, {
        membershipRole: 'owner',
        labFeaturesEnabled: false,
      }),
    ).toBe(PROVIDER_TEAM_MANAGER_GUIDE_TOPIC_ID);
  });

  it('strips clinic topic when lab features are off', () => {
    expect(
      sanitizeProviderGuideTopicId(PROVIDER_CLINIC_GUIDE_TOPIC_ID, {
        membershipRole: 'owner',
        labFeaturesEnabled: false,
      }),
    ).toBeNull();
    expect(
      isProviderGuideTopicVisible(PROVIDER_CLINIC_GUIDE_TOPIC_ID, {
        membershipRole: 'provider',
        labFeaturesEnabled: false,
      }),
    ).toBe(false);
  });
});
