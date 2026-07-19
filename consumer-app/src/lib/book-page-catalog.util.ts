/**
 * e2e-bug.29 — BookPage must not treat a warm cached services snapshot as proof a
 * service is still bookable. Wait for an authoritative catalog, then require the
 * service id to be present (public list only returns active services).
 */
export type BookPageCatalogResolution = 'loading' | 'missing' | 'found';

export function resolveBookPageCatalogService(input: {
  serviceId: string | undefined | null;
  services: Array<{ id: string }>;
  /** True while the online authoritative fetch has not settled. */
  awaitingAuthoritativeCatalog: boolean;
}): BookPageCatalogResolution {
  if (input.awaitingAuthoritativeCatalog) return 'loading';
  if (!input.serviceId?.trim()) return 'missing';
  return input.services.some((service) => service.id === input.serviceId)
    ? 'found'
    : 'missing';
}
