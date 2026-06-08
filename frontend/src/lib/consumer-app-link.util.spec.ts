import { describe, expect, it } from 'vitest';
import {
  APP_LINK_CONFIG_SCENARIOS,
  UNIVERSAL_LINK_PATH_MATCH_SCENARIOS,
  WEB_FALLBACK_SCENARIOS,
} from './consumer-app-link.fixtures';
import {
  buildAndroidAssetLinks,
  buildAppleAppSiteAssociation,
  buildOpenInAppUrlSequence,
  matchesUniversalLinkPath,
  readConsumerAppLinkConfigFromEnv,
  resolveUniversalLinkWebFallbackUrl,
  validateConsumerAppLinkConfig,
} from './consumer-app-link.util';

describe('consumer-app-link.util', () => {
  it.each(UNIVERSAL_LINK_PATH_MATCH_SCENARIOS)(
    'matchesUniversalLinkPath $id',
    ({ pathname, matches }) => {
      expect(matchesUniversalLinkPath(pathname)).toBe(matches);
    },
  );

  it('buildAppleAppSiteAssociation includes book and in-app salon paths', () => {
    const aasa = buildAppleAppSiteAssociation({
      appleTeamId: 'ABCDE12345',
      iosBundleId: 'com.optischedule.consumer',
    });
    expect(aasa.applinks.details[0]?.appID).toBe('ABCDE12345.com.optischedule.consumer');
    expect(aasa.applinks.details[0]?.paths).toEqual(['/book/*', '/s/*']);
  });

  it('buildAndroidAssetLinks maps package and fingerprints', () => {
    const links = buildAndroidAssetLinks({
      androidPackageName: 'com.optischedule.consumer',
      androidSha256Fingerprints: ['AA:BB:CC'],
    });
    expect(links[0]?.target.package_name).toBe('com.optischedule.consumer');
    expect(links[0]?.target.sha256_cert_fingerprints).toEqual(['AA:BB:CC']);
  });

  it.each(APP_LINK_CONFIG_SCENARIOS)('validateConsumerAppLinkConfig $id', ({ config, valid }) => {
    expect(validateConsumerAppLinkConfig(config).length === 0).toBe(valid);
  });

  it('readConsumerAppLinkConfigFromEnv parses deployment env', () => {
    expect(
      readConsumerAppLinkConfigFromEnv({
        CONSUMER_APPLE_TEAM_ID: 'ABCDE12345',
        CONSUMER_ANDROID_SHA256_FINGERPRINTS: 'AA:BB:CC,DD:EE:FF',
      }),
    ).toEqual({
      appleTeamId: 'ABCDE12345',
      iosBundleId: 'com.optischedule.consumer',
      androidPackageName: 'com.optischedule.consumer',
      androidSha256Fingerprints: ['AA:BB:CC', 'DD:EE:FF'],
    });
    expect(readConsumerAppLinkConfigFromEnv({})).toBeNull();
  });

  it('matchesUniversalLinkPath supports exact patterns without wildcard', () => {
    expect(matchesUniversalLinkPath('/book/salon-a', ['/book/salon-a'])).toBe(true);
    expect(matchesUniversalLinkPath('book/salon-a', ['/book/salon-a'])).toBe(true);
  });

  it.each(WEB_FALLBACK_SCENARIOS)(
    'resolveUniversalLinkWebFallbackUrl $id',
    ({ input, webOrigin, expected }) => {
      expect(resolveUniversalLinkWebFallbackUrl(input, webOrigin)).toBe(expected);
    },
  );

  it('buildOpenInAppUrlSequence prefers verified https before custom scheme', () => {
    const sequence = buildOpenInAppUrlSequence(
      'https://app.test',
      'https://app.test/book/salon-a?src=web_banner',
      'optischedule://book/salon-a?src=web_banner',
    );
    expect(sequence.primary).toMatch(/^https:\/\//);
    expect(sequence.fallback).toMatch(/^optischedule:\/\//);
    expect(sequence.webFallback).toBe('https://app.test/book/salon-a?src=web_banner');
  });
});
