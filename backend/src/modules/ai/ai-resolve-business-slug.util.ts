import type { Repository } from 'typeorm';
import type { Business } from '../business/entities/business.entity.js';

export type BusinessSlugRepo = Pick<Repository<Business>, 'findOne'>;

/**
 * e2e-bug.82 / e2e-bug.125 — customer AI handlers must not require a
 * classifier-extracted `params.slug`. Prefer an explicit slug when present
 * (session/booking page), otherwise resolve from authenticated `businessId`.
 */
export async function resolveBusinessSlugFromParamsOrId(
  businessRepo: BusinessSlugRepo | undefined | null,
  businessId: string,
  params: Record<string, unknown> = {},
): Promise<string | null> {
  if (typeof params.slug === 'string' && params.slug.trim()) {
    return params.slug.trim();
  }
  if (!businessRepo || !businessId) return null;
  const business = await businessRepo.findOne({ where: { id: businessId } });
  return business?.slug ?? null;
}
