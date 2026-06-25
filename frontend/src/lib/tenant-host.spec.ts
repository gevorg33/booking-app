import { describe, it, expect } from 'vitest';
import { bookPath, buildTenantPublicUrl } from './tenant-host';

describe('tenant-host', () => {
  it('bookPath keeps internal routing paths', () => {
    expect(bookPath('salon')).toBe('/book/salon');
    expect(bookPath('salon', '/services')).toBe('/book/salon/services');
  });

  it.each([
    {
      id: 'prod-home',
      slug: 'woodwork-decor-d44d9c9c',
      path: '',
      options: { origin: 'https://example.com', rootDomain: 'example.com' },
      expected: 'https://woodwork-decor-d44d9c9c.example.com/',
    },
    {
      id: 'prod-services',
      slug: 'gloss',
      path: '/services',
      options: { origin: 'https://example.com', rootDomain: 'example.com' },
      expected: 'https://gloss.example.com/services',
    },
    {
      id: 'staging-vercel',
      slug: 'woodwork-decor-d44d9c9c',
      path: '',
      options: {
        origin: 'https://frontend-sand-six-17.vercel.app',
        rootDomain: 'frontend-sand-six-17.vercel.app',
      },
      expected: 'https://woodwork-decor-d44d9c9c.frontend-sand-six-17.vercel.app/',
    },
  ])('buildTenantPublicUrl $id', ({ slug, path, options, expected }) => {
    expect(buildTenantPublicUrl(slug, path, options)).toBe(expected);
  });
});
