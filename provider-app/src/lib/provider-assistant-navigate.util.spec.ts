import { describe, expect, it } from 'vitest';
import {
  buildProviderAssistantHref,
  buildProviderAssistantHrefFromPathAndSearch,
  isProviderGuideAssistantNavigate,
  isProviderGuidePushUrl,
  mapProviderGuidePushUrl,
  providerGuideDeepLinkPath,
} from './provider-assistant-navigate.util.js';

describe('buildProviderAssistantHref', () => {
  it('maps guide navigate to profile guide route with topicId', () => {
    expect(
      buildProviderAssistantHref({
        path: 'guide',
        query: { topicId: 'provider-getting-started' },
      }),
    ).toBe('/tabs/profile/guide?topicId=provider-getting-started');
  });

  it('maps guide navigate without query to bare guide route', () => {
    expect(buildProviderAssistantHref({ path: 'guide', query: {} })).toBe(
      '/tabs/profile/guide',
    );
  });

  it('maps tab navigate targets', () => {
    expect(
      buildProviderAssistantHref({
        path: '/tabs/today',
        query: { bookingId: 'b1' },
      }),
    ).toBe('/tabs/today?bookingId=b1');
    expect(
      buildProviderAssistantHref({
        path: '/tabs/profile',
        query: {},
      }),
    ).toBe('/tabs/profile');
  });

  it('returns null for unknown relative paths', () => {
    expect(buildProviderAssistantHref({ path: 'today', query: {} })).toBeNull();
  });
});

describe('buildProviderAssistantHrefFromPathAndSearch', () => {
  it('parses guide path with query from guide panel', () => {
    expect(buildProviderAssistantHrefFromPathAndSearch('guide?topicId=provider-assistant')).toBe(
      '/tabs/profile/guide?topicId=provider-assistant',
    );
    expect(buildProviderAssistantHrefFromPathAndSearch('/tabs/today')).toBe('/tabs/today');
  });
});

describe('provider guide deep links', () => {
  it('builds push/deep-link path with topicId', () => {
    expect(providerGuideDeepLinkPath('provider-appointments')).toBe(
      '/tabs/profile/guide?topicId=provider-appointments',
    );
    expect(providerGuideDeepLinkPath(null)).toBe('/tabs/profile/guide');
  });

  it('detects and maps legacy provider profile guide push urls', () => {
    expect(isProviderGuidePushUrl('/provider/profile/guide?topicId=provider-tabs')).toBe(true);
    expect(mapProviderGuidePushUrl('/provider/profile/guide?topicId=provider-tabs')).toBe(
      '/tabs/profile/guide?topicId=provider-tabs',
    );
    expect(isProviderGuidePushUrl('/provider/profile')).toBe(false);
  });

  it('flags guide assistant navigate payloads', () => {
    expect(isProviderGuideAssistantNavigate({ path: 'guide', query: {} })).toBe(true);
    expect(isProviderGuideAssistantNavigate({ path: '/tabs/today' })).toBe(false);
  });
});
