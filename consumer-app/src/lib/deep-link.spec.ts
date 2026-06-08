import { beforeEach, describe, expect, it } from 'vitest';
import { DEEP_LINK_LAUNCH_SCENARIOS } from './deferred-install-link.fixtures.js';
import {
  buildBookServicePath,
  buildLabRequestsPath,
  buildLabToBookPath,
  buildManageBookingPath,
  buildResultsPath,
  buildSalonPath,
  consumeDeferredInstallLink,
  consumeDeferredSlug,
  isValidSlug,
  parseAccountRoute,
  parseBookServiceRoute,
  parseLabBookingRequestRoute,
  parseManageBookingRoute,
  parseResultReadyRoute,
  parseTenantSlugFromUrl,
  resolveLabBookingRequestNavigationPath,
  saveDeferredSlug,
} from './deep-link.js';
import { resolveDeepLinkLaunchTarget } from './deep-link-launch.util.js';

function installLocalStorageMock(): void {
  const store = new Map<string, string>();
  const mock = {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, value);
    },
    removeItem: (key: string) => {
      store.delete(key);
    },
    clear: () => store.clear(),
  };
  if (Object.getOwnPropertyDescriptor(globalThis, 'localStorage')?.configurable) {
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      value: mock,
    });
  } else {
    Object.assign(globalThis.localStorage, mock);
  }
}

describe('deep-link', () => {
  beforeEach(() => {
    installLocalStorageMock();
    localStorage.clear();
  });

  it('parses /book/{slug} paths', () => {
    expect(parseTenantSlugFromUrl('https://app.example.com/book/glow-nails')).toBe('glow-nails');
    expect(parseTenantSlugFromUrl('/book/my-salon')).toBe('my-salon');
    expect(parseTenantSlugFromUrl('https://app.example.com/s/spa-one')).toBe('spa-one');
  });

  it('parses query slug and custom scheme', () => {
    expect(parseTenantSlugFromUrl('https://x.test/?slug=Glow-Nails')).toBe('glow-nails');
    expect(parseTenantSlugFromUrl('optischedule://book/spa-one')).toBe('spa-one');
  });

  it('validates slug format', () => {
    expect(isValidSlug('valid-slug')).toBe(true);
    expect(isValidSlug('bad slug')).toBe(false);
  });

  it('stores deferred slug for post-install open', () => {
    saveDeferredSlug('deferred-salon');
    expect(consumeDeferredSlug()).toBe('deferred-salon');
    expect(consumeDeferredSlug()).toBeNull();
  });

  it('stores full deferred install payload via saveDeferredSlug', () => {
    saveDeferredSlug('deferred-salon', { serviceId: 'svc-1', installSource: 'qr' });
    const consumed = consumeDeferredInstallLink();
    expect(consumed?.slug).toBe('deferred-salon');
    expect(consumed?.serviceId).toBe('svc-1');
    expect(consumed?.installSource).toBe('qr');
  });

  it('builds in-app salon routes', () => {
    expect(buildSalonPath('x', '/services')).toBe('/s/x/services');
    expect(buildResultsPath('x')).toBe('/s/x/results');
    expect(buildLabToBookPath('x')).toBe('/s/x/lab-to-book');
  });

  it('parses lab-booking-request deep links', () => {
    expect(
      parseLabBookingRequestRoute(
        'optischedule://book/city-clinic/lab-requests?serviceId=svc-1&clinicOrderToken=token-abc',
      ),
    ).toEqual({
      slug: 'city-clinic',
      collectionServiceId: 'svc-1',
      clinicOrderToken: 'token-abc',
    });
    expect(parseLabBookingRequestRoute('https://app.test/s/city-clinic/lab-requests')).toEqual({
      slug: 'city-clinic',
    });
    expect(
      parseLabBookingRequestRoute(
        'https://app.test/book/city-clinic/account?section=lab-requests',
      ),
    ).toEqual({ slug: 'city-clinic' });
    expect(buildLabRequestsPath('city-clinic', { collectionServiceId: 'svc-1', clinicOrderToken: 'tok' })).toBe(
      '/s/city-clinic/lab-requests?serviceId=svc-1&clinicOrderToken=tok',
    );
    expect(
      resolveLabBookingRequestNavigationPath({
        slug: 'city-clinic',
        collectionServiceId: 'svc-1',
        clinicOrderToken: 'token-abc',
      }),
    ).toBe('/s/city-clinic/book/svc-1?clinicOrderToken=token-abc');
    expect(resolveLabBookingRequestNavigationPath({ slug: 'city-clinic' })).toBe(
      '/s/city-clinic/lab-to-book',
    );
    expect(buildLabRequestsPath('city-clinic')).toBe('/s/city-clinic/lab-requests');
    expect(
      resolveLabBookingRequestNavigationPath({
        slug: 'city-clinic',
        collectionServiceId: 'svc-1',
      }),
    ).toBe('/s/city-clinic/lab-to-book');
  });

  it('parses result-ready deep links', () => {
    expect(parseResultReadyRoute('optischedule://book/city-clinic/results')).toEqual({
      slug: 'city-clinic',
    });
    expect(parseResultReadyRoute('https://app.test/s/city-clinic/results')).toEqual({
      slug: 'city-clinic',
    });
    expect(
      parseResultReadyRoute(
        'https://app.test/book/city-clinic/account?section=results',
      ),
    ).toEqual({ slug: 'city-clinic' });
    expect(parseResultReadyRoute('book/city-clinic/account?section=results')).toEqual({
      slug: 'city-clinic',
    });
    expect(parseResultReadyRoute('optischedule://book/city-clinic/lab-requests')).toBeNull();
    expect(
      parseResultReadyRoute('http://[bad/book/city-clinic/account?section=results'),
    ).toEqual({ slug: 'city-clinic' });
  });

  it('parses lab-booking inline fallback when URL constructor throws', () => {
    expect(parseLabBookingRequestRoute('book/city-clinic/account?section=lab-requests')).toEqual({
      slug: 'city-clinic',
    });
    expect(parseLabBookingRequestRoute('totally-unrelated')).toBeNull();
    expect(parseLabBookingRequestRoute('https://example.com/book/salon/services')).toBeNull();
  });

  it('parses book-service deep links for rebooking nudges', () => {
    expect(
      parseBookServiceRoute('optischedule://book/glow-nails/book/svc-1'),
    ).toEqual({ slug: 'glow-nails', serviceId: 'svc-1' });
    expect(
      parseBookServiceRoute(
        'optischedule://book/glow-nails/book/svc-1?employeeId=emp-9&date=2026-05-01&slot=2026-05-01T10%3A00%3A00.000Z&rebook=1&rebookBookingId=bk-1&rebookSource=widget',
      ),
    ).toEqual({
      slug: 'glow-nails',
      serviceId: 'svc-1',
      employeeId: 'emp-9',
      date: '2026-05-01',
      slot: '2026-05-01T10:00:00.000Z',
      rebookBookingId: 'bk-1',
      rebookSource: 'widget',
    });
    expect(parseBookServiceRoute('/s/glow-nails/book/svc-1')).toEqual({
      slug: 'glow-nails',
      serviceId: 'svc-1',
    });
    expect(buildBookServicePath('glow-nails', 'svc-1', { employeeId: 'emp-9' })).toBe(
      '/s/glow-nails/book/svc-1?employeeId=emp-9',
    );
  });

  it('parses account-tab deep links for home-screen widget', () => {
    expect(parseAccountRoute('optischedule://book/glow-nails/account')).toEqual({
      slug: 'glow-nails',
    });
    expect(parseAccountRoute('/s/glow-nails/account')).toEqual({ slug: 'glow-nails' });
    expect(resolveDeepLinkLaunchTarget('optischedule://book/glow-nails/account')?.path).toBe(
      '/s/glow-nails/account',
    );
  });

  it('parses manage booking deep links', () => {
    expect(
      parseManageBookingRoute(
        'https://app.test/book/glow-nails/manage?bookingId=b1&token=tok',
      ),
    ).toEqual({ slug: 'glow-nails', bookingId: 'b1', token: 'tok' });
    expect(
      parseManageBookingRoute(
        'optischedule://book/glow-nails/manage?bookingId=b1&token=tok',
      ),
    ).toEqual({ slug: 'glow-nails', bookingId: 'b1', token: 'tok' });
    expect(buildManageBookingPath('glow-nails', 'b1', 'tok')).toBe(
      '/s/glow-nails/manage?bookingId=b1&token=tok',
    );
    expect(parseManageBookingRoute('invalid-manage-url')).toBeNull();
    expect(
      parseManageBookingRoute('http://[bad/book/glow-nails/manage?bookingId=b1&token=tok'),
    ).toBeNull();
  });

  it.each(DEEP_LINK_LAUNCH_SCENARIOS)(
    'resolveDeepLinkLaunchTarget $id restores salon/service path',
    ({ url, path, installSource }) => {
      const target = resolveDeepLinkLaunchTarget(url);
      expect(target?.path).toBe(path);
      expect(target?.deferredLink?.installSource).toBe(installSource);
    },
  );

  it('resolveDeepLinkLaunchTarget uses stored deferred payload when URL has no slug', () => {
    const target = resolveDeepLinkLaunchTarget('https://example.com/', {
      slug: 'stored-salon',
      serviceId: 'svc-99',
      installSource: 'web_banner',
      capturedAt: '2026-06-01T00:00:00.000Z',
    });
    expect(target?.path).toBe('/s/stored-salon/book/svc-99');
  });

  it('parses inline slug fallback when URL is invalid', () => {
    expect(parseTenantSlugFromUrl('book/fallback-salon')).toBe('fallback-salon');
    expect(parseTenantSlugFromUrl('http://[bad/book/catch-slug')).toBe('catch-slug');
    expect(parseTenantSlugFromUrl('plain-slug')).toBe('plain-slug');
    expect(parseTenantSlugFromUrl('not valid slug')).toBeNull();
  });
});
