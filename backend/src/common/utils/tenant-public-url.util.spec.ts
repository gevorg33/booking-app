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
      expected: 'https://woodwork-decor-d44d9c9c.example.com/',
    },
    {
      id: 'prod-services',
      input: {
        slug: 'gloss',
        pathSuffix: '/services',
        frontendUrl: 'https://example.com',
        rootDomain: 'example.com',
      },
      expected: 'https://gloss.example.com/services',
    },
    {
      id: 'local-subdomain',
      input: {
        slug: 'salon',
        frontendUrl: 'http://localhost:3000',
        rootDomain: 'localhost:3000',
      },
      expected: 'http://salon.localhost:3000/',
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
      expected: 'https://salon.example.com/manage?bookingId=b1&token=tok',
    },
    {
      id: 'staging-vercel-root',
      input: {
        slug: 'woodwork-decor-d44d9c9c',
        frontendUrl: 'https://frontend-sand-six-17.vercel.app',
        rootDomain: 'frontend-sand-six-17.vercel.app',
      },
      expected: 'https://woodwork-decor-d44d9c9c.frontend-sand-six-17.vercel.app/',
    },
  ])('buildTenantPublicUrl $id', ({ input, expected }) => {
    expect(buildTenantPublicUrl(input)).toBe(expected);
  });
});
