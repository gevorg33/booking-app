export const INTELLIGENCE_CONTEXT_KEYS = [
  '_entityMemoryBlock',
  '_entityMemoryAliases',
  '_conversationSummary',
  '_ragContextBlock',
  '_capabilityHints',
  '_accessTier',
  '_actorRole',
  '_roleProfile',
  '_membershipRole',
  '_planTierId',
  '_scopedEmployeeId',
  '_locationId',
  '_branchHint',
  '_confidenceHigh',
  '_abVariantId',
  '_commandTraceId',
] as const;

export interface IntelligenceBlocks {
  entityMemoryBlock?: string;
  conversationSummary?: string;
  ragContextBlock?: string;
  capabilityHints?: string;
}

export function extractIntelligenceBlocks(
  context?: Record<string, unknown>,
): IntelligenceBlocks {
  return {
    entityMemoryBlock:
      typeof context?._entityMemoryBlock === 'string'
        ? context._entityMemoryBlock
        : undefined,
    conversationSummary:
      typeof context?._conversationSummary === 'string'
        ? context._conversationSummary
        : undefined,
    ragContextBlock:
      typeof context?._ragContextBlock === 'string'
        ? context._ragContextBlock
        : undefined,
    capabilityHints:
      typeof context?._capabilityHints === 'string'
        ? context._capabilityHints
        : undefined,
  };
}

export function buildIntelligenceClassifierAppendix(
  blocks: IntelligenceBlocks,
): string {
  const parts: string[] = [];
  if (blocks.capabilityHints) parts.push(blocks.capabilityHints);
  if (blocks.entityMemoryBlock) parts.push(blocks.entityMemoryBlock);
  if (blocks.conversationSummary) parts.push(blocks.conversationSummary);
  if (blocks.ragContextBlock) parts.push(blocks.ragContextBlock);
  return parts.length ? `\n\n${parts.join('\n\n')}` : '';
}

export function stripIntelligenceKeysFromSessionContext(
  context?: Record<string, unknown>,
): Record<string, unknown> | undefined {
  if (!context) return undefined;

  const next = { ...context };
  for (const key of INTELLIGENCE_CONTEXT_KEYS) {
    delete next[key];
  }

  return Object.keys(next).length > 0 ? next : undefined;
}
