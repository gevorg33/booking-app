import { describe, expect, it } from 'vitest';
import {
  appendAttributionParams,
  buildAttributedBookUrl,
  buildCustomSchemeBookUrl,
  buildTenantAppInstallUrl,
  isValidTenantSlug,
  parseInstallAttributionFromParams,
  parseInstallSource,
  saveDeferredInstallLink,
} from './deferred-install-link.util';

describe('deferred-install-link.util (web)', () => {
  it('validates tenant slug format', () => {
    expect(isValidTenantSlug('glow-nails')).toBe(true);
    expect(isValidTenantSlug('bad slug')).toBe(false);
  });

  it('builds attributed URLs for banner and custom scheme', () => {
    const link = {
      slug: 'salon-a',
      serviceId: 'svc-1',
      installSource: 'web_banner' as const,
      campaign: 'banner',
    };
    expect(buildAttributedBookUrl('https://app.test/', link)).toBe(
      'https://app.test/book/salon-a?serviceId=svc-1&src=web_banner&utm_campaign=banner',
    );
    expect(buildCustomSchemeBookUrl(link)).toBe(
      'optischedule://book/salon-a?serviceId=svc-1&src=web_banner&utm_campaign=banner',
    );
  });

  it('buildTenantAppInstallUrl defaults qr source and venue campaign', () => {
    expect(buildTenantAppInstallUrl('https://app.test', 'salon-a')).toBe(
      'https://app.test/get-app/salon-a?src=qr&utm_campaign=venue_qr',
    );
  });

  it('appendAttributionParams adds slug to store URL', () => {
    const url = appendAttributionParams('https://apps.apple.com/app/id123', {
      slug: 'salon-a',
      serviceId: 'svc-1',
      installSource: 'web_banner',
      campaign: 'banner',
      capturedAt: '2026-06-01T00:00:00.000Z',
    });
    expect(url).toContain('slug=salon-a');
    expect(url).toContain('src=web_banner');
  });

  it('saveDeferredInstallLink stores payload in localStorage', () => {
    const store = new Map<string, string>();
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      value: {
        getItem: (key: string) => store.get(key) ?? null,
        setItem: (key: string, value: string) => store.set(key, value),
        removeItem: (key: string) => store.delete(key),
      },
    });
    saveDeferredInstallLink({ slug: 'salon-a', installSource: 'qr' });
    expect(store.get('consumer_deferred_install')).toContain('salon-a');
  });

  it('skips save when slug is invalid', () => {
    const store = new Map<string, string>();
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      value: {
        getItem: (key: string) => store.get(key) ?? null,
        setItem: (key: string, value: string) => store.set(key, value),
        removeItem: (key: string) => store.delete(key),
      },
    });
    saveDeferredInstallLink({ slug: 'bad slug', installSource: 'qr' });
    expect(store.size).toBe(0);
  });

  it('buildTenantAppInstallUrl passes optional campaign', () => {
    expect(
      buildTenantAppInstallUrl('https://app.test', 'salon-a', {
        campaign: 'venue_qr',
        installSource: 'referral',
      }),
    ).toContain('utm_campaign=venue_qr');
    expect(
      buildTenantAppInstallUrl('https://app.test', 'salon-a', {
        campaign: 'venue_qr',
        installSource: 'referral',
      }),
    ).toContain('src=referral');
  });

  it.each([
    ['referral', 'referral'],
    ['bogus', 'unknown'],
  ] as const)('parseInstallSource(%s)', (raw, expected) => {
    expect(parseInstallSource(raw)).toBe(expected);
  });

  it('parseInstallAttributionFromParams maps ref and utm to install sources', () => {
    expect(parseInstallAttributionFromParams({ ref: 'abc' })).toBe('referral');
    expect(
      parseInstallAttributionFromParams({ utm_source: 'facebook', utm_medium: 'cpc' }),
    ).toBe('ad');
  });
});
