/**
 * e2e-bug.218 — public customer JWTs are minted for one businessId.
 * Route `slug` must resolve to that same business or the session is rejected.
 */

export function readPublicRouteSlug(params: unknown): string | null {
  if (!params || typeof params !== 'object') return null;
  const slug = (params as { slug?: unknown }).slug;
  if (typeof slug !== 'string') return null;
  const trimmed = slug.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function publicCustomerSessionMatchesBusiness(input: {
  payloadBusinessId: string | null | undefined;
  routeBusinessId: string | null | undefined;
}): boolean {
  const payload = input.payloadBusinessId?.trim();
  const route = input.routeBusinessId?.trim();
  if (!payload || !route) return false;
  return payload === route;
}
