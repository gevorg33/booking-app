import { describe, expect, it } from 'vitest';
import {
  buildLabRequestsPath,
  buildLabToBookPath,
  buildManageBookingPath,
  buildResultsPath,
  buildSalonPath,
  consumeDeferredSlug,
  isValidSlug,
  parseLabBookingRequestRoute,
  parseManageBookingRoute,
  parseResultReadyRoute,
  parseTenantSlugFromUrl,
  resolveLabBookingRequestNavigationPath,
  saveDeferredSlug,
} from './deep-link.js';

describe('deep-link', () => {
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

  it('builds in-app salon routes', () => {
    expect(buildSalonPath('x', '/services')).toBe('/s/x/services');
    expect(buildSalonPath('x')).toBe('/s/x/home');
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

  it('parses manage booking deep links', () => {
    expect(
      parseManageBookingRoute(
        'https://app.test/book/glow-nails/manage?bookingId=b1&token=tok',
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

  it('parses inline slug fallback when URL is invalid', () => {
    expect(parseTenantSlugFromUrl('book/fallback-salon')).toBe('fallback-salon');
    expect(parseTenantSlugFromUrl('http://[bad/book/catch-slug')).toBe('catch-slug');
    expect(parseTenantSlugFromUrl('plain-slug')).toBe('plain-slug');
    expect(parseTenantSlugFromUrl('not valid slug')).toBeNull();
  });
});
