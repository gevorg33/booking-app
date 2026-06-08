import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  DEFERRED_INSTALL_LINK_SCENARIOS,
  DEFERRED_NAVIGATION_SCENARIOS,
  INSTALL_ATTRIBUTION_PARAM_SCENARIOS,
} from './deferred-install-link.fixtures.js';
import {
  buildAttributedBookUrl,
  buildInstallAttributionProps,
  consumeDeferredInstallLink,
  parseDeferredInstallFromUrl,
  parseInstallAttributionFromParams,
  parseInstallSource,
  peekDeferredInstallLink,
  resolveDeferredNavigationPath,
  saveDeferredInstallLink,
} from './deferred-install-link.util.js';

describe('deferred-install-link.util', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-01T00:00:00.000Z'));
  });

  it.each([
    ['qr', 'qr'],
    ['WEB_BANNER', 'web_banner'],
    ['invalid', 'unknown'],
    [undefined, undefined],
  ] as const)('parseInstallSource(%s) → %s', (raw, expected) => {
    expect(parseInstallSource(raw)).toBe(expected);
  });

  it('builds attributed book URL with params', () => {
    expect(
      buildAttributedBookUrl('https://app.test', {
        slug: 'salon-a',
        serviceId: 'svc-1',
        installSource: 'qr',
        campaign: 'venue_qr',
      }),
    ).toBe('https://app.test/book/salon-a?serviceId=svc-1&src=qr&utm_campaign=venue_qr');
  });

  it.each(DEFERRED_INSTALL_LINK_SCENARIOS)(
    'parseDeferredInstallFromUrl $id',
    ({ url, expected }) => {
      const parsed = parseDeferredInstallFromUrl(url);
      if (!expected) {
        expect(parsed).toBeNull();
        return;
      }
      expect(parsed).toMatchObject({
        slug: expected.slug,
        serviceId: expected.serviceId,
        installSource: expected.installSource,
        campaign: expected.campaign,
        date: 'date' in expected ? expected.date : undefined,
        slot: 'slot' in expected ? expected.slot : undefined,
      });
      expect(parsed?.capturedAt).toBeTruthy();
    },
  );

  it.each(INSTALL_ATTRIBUTION_PARAM_SCENARIOS)(
    'parseInstallAttributionFromParams $id',
    ({ params, expected }) => {
      expect(parseInstallAttributionFromParams(params)).toBe(expected);
    },
  );

  it('persists and consumes deferred install payload', () => {
    saveDeferredInstallLink({
      slug: 'salon-a',
      serviceId: 'svc-1',
      installSource: 'qr',
      campaign: 'venue_qr',
    });
    expect(peekDeferredInstallLink()).toMatchObject({
      slug: 'salon-a',
      serviceId: 'svc-1',
      installSource: 'qr',
      campaign: 'venue_qr',
    });
    expect(consumeDeferredInstallLink()).toMatchObject({ slug: 'salon-a' });
    expect(peekDeferredInstallLink()).toBeNull();
  });

  it('reads legacy deferred slug key', () => {
    localStorage.setItem('consumer_deferred_slug', 'legacy-salon');
    expect(peekDeferredInstallLink()?.slug).toBe('legacy-salon');
  });

  it.each(DEFERRED_NAVIGATION_SCENARIOS)(
    'resolveDeferredNavigationPath $id',
    ({ link, path }) => {
      expect(resolveDeferredNavigationPath(link)).toBe(path);
    },
  );

  it('buildInstallAttributionProps marks deferred installs intent-qualified (n99-3)', () => {
    expect(buildInstallAttributionProps(null)).toBeUndefined();
    expect(
      buildInstallAttributionProps({
        slug: 'x',
        installSource: 'link',
        capturedAt: '2026-06-01T00:00:00.000Z',
      }),
    ).toEqual({ intentQualified: true, installSource: 'link' });
  });
});
