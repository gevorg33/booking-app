import {
  buildManageBookingPath,
  buildSalonPath,
  consumeDeferredSlug,
  isValidSlug,
  parseManageBookingRoute,
  parseTenantSlugFromUrl,
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
  });

  it('parses inline slug fallback when URL is invalid', () => {
    expect(parseTenantSlugFromUrl('book/fallback-salon')).toBe('fallback-salon');
    expect(parseTenantSlugFromUrl('http://[bad/book/catch-slug')).toBe('catch-slug');
    expect(parseTenantSlugFromUrl('plain-slug')).toBe('plain-slug');
    expect(parseTenantSlugFromUrl('not valid slug')).toBeNull();
  });
});
