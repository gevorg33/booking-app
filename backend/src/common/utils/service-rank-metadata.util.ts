export type ServiceTier = 'standard' | 'premium';

export type ServiceRankMetadata = {
  isFeatured?: boolean;
  serviceTier?: ServiceTier | null;
};

export function isServiceTier(value: unknown): value is ServiceTier {
  return value === 'standard' || value === 'premium';
}

export function resolveServiceTierParam(value: unknown): ServiceTier | null {
  return isServiceTier(value) ? value : null;
}

/** Catalog tier filter — not serviceRank highest_price (rank-tier-metadata-en). */
export function isServiceTierFilterPrompt(prompt: string): boolean {
  return /\b(?:premium|standard)\s+tier\b/i.test(prompt);
}

export function extractServiceTierFromPrompt(
  prompt: string,
): ServiceTier | null {
  const match = prompt.match(/\b(standard|premium)\s+tier\b/i);
  if (!match) return null;
  return match[1].toLowerCase() as ServiceTier;
}

export function enrichServiceTierFromPrompt(
  params: Record<string, unknown>,
  prompt: string | undefined,
): Record<string, unknown> {
  if (!prompt?.trim()) return params;
  const serviceTier = extractServiceTierFromPrompt(prompt);
  if (!serviceTier) return params;
  return { ...params, serviceTier };
}

export function extractServiceRankMetadata(
  metadata: Record<string, unknown> | null | undefined,
): ServiceRankMetadata {
  const result: ServiceRankMetadata = {};
  if (metadata?.isFeatured === true) {
    result.isFeatured = true;
  }
  if (isServiceTier(metadata?.serviceTier)) {
    result.serviceTier = metadata.serviceTier;
  }
  return result;
}

export function applyServiceRankMetadataToMetadata(
  metadata: Record<string, unknown>,
  input: {
    isFeatured?: boolean;
    serviceTier?: ServiceTier | '' | null;
  },
): Record<string, unknown> {
  const next = { ...metadata };

  if (input.isFeatured === true) {
    next.isFeatured = true;
  } else if (input.isFeatured === false) {
    delete next.isFeatured;
  }

  if (input.serviceTier === '') {
    delete next.serviceTier;
  } else if (isServiceTier(input.serviceTier)) {
    next.serviceTier = input.serviceTier;
  } else if (input.serviceTier === null) {
    delete next.serviceTier;
  }

  return next;
}

export function enrichCatalogEntryWithServiceRankMetadata<
  T extends { metadata?: Record<string, unknown> | null },
>(entry: T): T & { isFeatured?: boolean; serviceTier?: ServiceTier | null } {
  const rank = extractServiceRankMetadata(entry.metadata ?? undefined);
  return {
    ...entry,
    ...(rank.isFeatured ? { isFeatured: true } : {}),
    ...(rank.serviceTier ? { serviceTier: rank.serviceTier } : {}),
  };
}
