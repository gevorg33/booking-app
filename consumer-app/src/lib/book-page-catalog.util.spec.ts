import { describe, expect, it } from 'vitest';
import { resolveBookPageCatalogService } from './book-page-catalog.util.js';

describe('resolveBookPageCatalogService (e2e-bug.29)', () => {
  it.each([
    {
      id: 'e2e-bug.29-awaiting-fresh-catalog',
      input: {
        serviceId: 'svc-1',
        services: [{ id: 'svc-1' }],
        awaitingAuthoritativeCatalog: true,
      },
      expected: 'loading' as const,
    },
    {
      id: 'e2e-bug.29-active-in-fresh-catalog',
      input: {
        serviceId: 'svc-1',
        services: [{ id: 'svc-1' }, { id: 'svc-2' }],
        awaitingAuthoritativeCatalog: false,
      },
      expected: 'found' as const,
    },
    {
      id: 'e2e-bug.29-deactivated-absent-from-catalog',
      input: {
        serviceId: 'svc-gone',
        // Warm cache previously had svc-gone; authoritative fetch no longer does.
        services: [{ id: 'svc-1' }],
        awaitingAuthoritativeCatalog: false,
      },
      expected: 'missing' as const,
    },
    {
      id: 'e2e-bug.29-empty-service-id',
      input: {
        serviceId: '',
        services: [{ id: 'svc-1' }],
        awaitingAuthoritativeCatalog: false,
      },
      expected: 'missing' as const,
    },
  ])('$id', ({ input, expected }) => {
    expect(resolveBookPageCatalogService(input)).toBe(expected);
  });
});
