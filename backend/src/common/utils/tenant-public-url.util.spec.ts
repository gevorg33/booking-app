import {
  buildTenantPublicPath,
  buildTenantPublicUrl,
} from './tenant-public-url.util.js';

describe('tenant-public-url.util', () => {
  it('buildTenantPublicPath returns internal book route', () => {
    expect(buildTenantPublicPath('Salon-A')).toBe('/book/salon-a');
    expect(buildTenantPublicPath('salon-a', '/services')).toBe('/book/salon-a/services');
  });

  it.each([
    {
      id: 'prod-home',
      input: {
        slug: 'woodwork-decor-d44d9c9c',
        frontendUrl: 'https://example.com',
        rootDomain: 'example.com',
      },
      expected: 'https://example.com/book/woodwork-decor-d44d9c9c',
    },
    {
      id: 'prod-services',
      input: {
        slug: 'gloss',
        pathSuffix: '/services',
        frontendUrl: 'https://example.com',
        rootDomain: 'example.com',
      },
      expected: 'https://example.com/book/gloss/services',
    },
    {
      id: 'local-path',
      input: {
        slug: 'salon',
        frontendUrl: 'http://localhost:3000',
        rootDomain: 'localhost:3000',
      },
      expected: 'http://localhost:3000/book/salon',
    },
    {
      id: 'manage-query',
      input: {
        slug: 'salon',
        pathSuffix: '/manage',
        frontendUrl: 'https://example.com',
        rootDomain: 'example.com',
        query: { bookingId: 'b1', token: 'tok' },
      },
      expected: 'https://example.com/book/salon/manage?bookingId=b1&token=tok',
    },
    {
      id: 'staging-vercel-root',
      input: {
        slug: 'gnuni-beauty-salon',
        pathSuffix: '/manage',
        frontendUrl: 'https://frontend-sand-six-17.vercel.app',
        rootDomain: 'frontend-sand-six-17.vercel.app',
        query: { bookingId: 'b1', token: 'tok' },
      },
      expected:
        'https://frontend-sand-six-17.vercel.app/book/gnuni-beauty-salon/manage?bookingId=b1&token=tok',
    },
  ])('buildTenantPublicUrl $id', ({ input, expected }) => {
    expect(buildTenantPublicUrl(input)).toBe(expected);
  });
});
