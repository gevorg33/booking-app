import {
  type AccessTier,
  isCustomerIntentAllowed,
  isDashboardIntentAllowed,
  isProviderIntentAllowed,
} from './access-control.matrix.js';
import { getAllowedIntents, type AiSurface } from './ai-capability.matrix.js';
import type { CommandSurface } from './ai-command-registry.types.js';
import type {
  AiAllowDenyDivergence,
  AiFeatureCatalogEntry,
  AllowDenyParityExport,
  AllowDenyParityRoleSurfaceSummary,
} from './ai-feature-catalog.types.js';
import { isUiCatalogEntry } from './ai-feature-intent-map.util.js';

export type {
  AllowDenyParityExport,
  AllowDenyParityRoleSurfaceSummary,
} from './ai-feature-catalog.types.js';

export {
  ALLOW_DENY_PARITY_CLEAN_CATALOG,
  ALLOW_DENY_PARITY_FIXTURE_CATALOG,
  ALLOW_DENY_PARITY_LIVE_SAMPLES,
  ALLOW_DENY_PARITY_SCENARIOS,
} from './ai-feature-allow-deny-parity.fixtures.js';

/** Roles evaluated on each surface — mirrored from ai-feature-parity.util. */
export const PARITY_TIER_SURFACE_PAIRS: ReadonlyArray<{
  tier: AccessTier;
  surface: CommandSurface;
}> = [
  { tier: 'owner', surface: 'dashboard' },
  { tier: 'manager', surface: 'dashboard' },
  { tier: 'staff', surface: 'dashboard' },
  { tier: 'staff', surface: 'provider' },
  { tier: 'client', surface: 'customer' },
  { tier: 'client', surface: 'public' },
];

const TIER_RANK: Record<AccessTier, number> = {
  client: 0,
  staff: 1,
  manager: 2,
  owner: 3,
};

function toAiSurface(surface: CommandSurface): AiSurface {
  return surface;
}

function roleMeetsCatalogMinTier(tier: AccessTier, minTier: AccessTier): boolean {
  return TIER_RANK[tier] >= TIER_RANK[minTier];
}

function isIntentAllowedForTier(
  surface: CommandSurface,
  tier: AccessTier,
  intentId: string,
): boolean {
  if (surface === 'dashboard') return isDashboardIntentAllowed(tier, intentId);
  if (surface === 'provider') return isProviderIntentAllowed(tier, intentId);
  if (surface === 'customer' || surface === 'public') {
    return isCustomerIntentAllowed(tier, intentId);
  }
  return false;
}

function listUiAccessibleCatalogEntries(
  catalog: readonly AiFeatureCatalogEntry[],
  surface: CommandSurface,
  tier: AccessTier,
): AiFeatureCatalogEntry[] {
  return catalog.filter(
    (entry) =>
      entry.surface === surface && roleMeetsCatalogMinTier(tier, entry.minTier),
  );
}

function divergenceKey(row: AiAllowDenyDivergence): string {
  return `${row.kind}:${row.tier}:${row.surface}:${row.featureId}:${row.intentId}`;
}

function dedupeDivergences(rows: readonly AiAllowDenyDivergence[]): AiAllowDenyDivergence[] {
  const byKey = new Map<string, AiAllowDenyDivergence>();
  for (const row of rows) byKey.set(divergenceKey(row), row);
  return [...byKey.values()].sort((a, b) =>
    `${a.surface}.${a.tier}.${a.kind}.${a.featureId}`.localeCompare(
      `${b.surface}.${b.tier}.${b.kind}.${b.featureId}`,
    ),
  );
}

/** parity-1.6 — intents reachable in UI for role/surface via catalog minTier. */
export function listUiBackedIntentsForRoleSurface(
  catalog: readonly AiFeatureCatalogEntry[],
  surface: CommandSurface,
  tier: AccessTier,
): Set<string> {
  const uiCatalog = catalog.filter(isUiCatalogEntry);
  const intents = new Set<string>();
  for (const entry of listUiAccessibleCatalogEntries(uiCatalog, surface, tier)) {
    for (const intentId of entry.intentIds) intents.add(intentId);
  }
  return intents;
}

/** parity-1.6 — catalog-linked under/over grants for one role/surface pair. */
export function findCatalogAllowDenyDivergencesForPair(
  catalog: readonly AiFeatureCatalogEntry[],
  surface: CommandSurface,
  tier: AccessTier,
): AiAllowDenyDivergence[] {
  const divergences: AiAllowDenyDivergence[] = [];
  const uiCatalog = catalog.filter(
    (entry) => entry.surface === surface && isUiCatalogEntry(entry),
  );
  const uiBackedIntents = listUiBackedIntentsForRoleSurface(catalog, surface, tier);

  for (const entry of uiCatalog) {
    for (const intentId of entry.intentIds) {
      const uiAccessible = roleMeetsCatalogMinTier(tier, entry.minTier);
      const aiAllowed = isIntentAllowedForTier(surface, tier, intentId);

      if (uiAccessible && !aiAllowed) {
        divergences.push({
          kind: 'under_grant',
          source: 'catalog',
          featureId: entry.id,
          surface,
          tier,
          intentId,
          reason: `UI allows ${entry.id} but AI denies ${intentId} for ${tier} on ${surface}`,
        });
      }

      // parity-4.1 — skip over-grant when another UI-accessible catalog row already maps the intent.
      if (!uiAccessible && aiAllowed && !uiBackedIntents.has(intentId)) {
        divergences.push({
          kind: 'over_grant',
          source: 'catalog',
          featureId: entry.id,
          surface,
          tier,
          intentId,
          reason: `AI allows ${intentId} but no UI-accessible catalog feature maps it for ${tier} on ${surface}`,
        });
      }
    }
  }

  return divergences;
}

/** parity-1.6 — AI exposes intent with no UI-accessible catalog mapping (capability orphan). */
export function findCapabilityAllowDenyDivergencesForPair(
  catalog: readonly AiFeatureCatalogEntry[],
  surface: CommandSurface,
  tier: AccessTier,
): AiAllowDenyDivergence[] {
  const uiBacked = listUiBackedIntentsForRoleSurface(catalog, surface, tier);
  const aiAllowed = getAllowedIntents(toAiSurface(surface), tier);

  return aiAllowed
    .filter((intentId) => !uiBacked.has(intentId))
    .map((intentId) => ({
      kind: 'over_grant' as const,
      source: 'capability' as const,
      featureId: '*ai_capability*',
      surface,
      tier,
      intentId,
      reason: `AI exposes ${intentId} but no UI-accessible catalog feature maps it for ${tier} on ${surface}`,
    }));
}

/** parity-1.6 — all catalog + capability allow/deny divergences (target zero). */
export function findAllowDenyDivergences(
  catalog: readonly AiFeatureCatalogEntry[],
  options?: { includeCapabilityOrphans?: boolean },
): AiAllowDenyDivergence[] {
  const includeCapabilityOrphans = options?.includeCapabilityOrphans ?? true;
  const divergences: AiAllowDenyDivergence[] = [];

  for (const { tier, surface } of PARITY_TIER_SURFACE_PAIRS) {
    divergences.push(...findCatalogAllowDenyDivergencesForPair(catalog, surface, tier));
    if (includeCapabilityOrphans) {
      divergences.push(...findCapabilityAllowDenyDivergencesForPair(catalog, surface, tier));
    }
  }

  return dedupeDivergences(divergences);
}

export function summarizeAllowDenyByRoleSurface(
  divergences: readonly AiAllowDenyDivergence[],
): AllowDenyParityRoleSurfaceSummary[] {
  const map = new Map<string, AllowDenyParityRoleSurfaceSummary>();

  for (const { tier, surface } of PARITY_TIER_SURFACE_PAIRS) {
    map.set(`${tier}:${surface}`, {
      tier,
      surface,
      overGrantCount: 0,
      underGrantCount: 0,
    });
  }

  for (const row of divergences) {
    const summary = map.get(`${row.tier}:${row.surface}`);
    if (!summary) continue;
    if (row.kind === 'over_grant') summary.overGrantCount += 1;
    if (row.kind === 'under_grant') summary.underGrantCount += 1;
  }

  return [...map.values()];
}

export function countAllowDenyDivergences(divergences: readonly AiAllowDenyDivergence[]): {
  overGrantCount: number;
  underGrantCount: number;
  totalDivergences: number;
} {
  const overGrantCount = divergences.filter((row) => row.kind === 'over_grant').length;
  const underGrantCount = divergences.filter((row) => row.kind === 'under_grant').length;
  return {
    overGrantCount,
    underGrantCount,
    totalDivergences: divergences.length,
  };
}

export function listUnderGrantDivergences(
  divergences: readonly AiAllowDenyDivergence[],
): AiAllowDenyDivergence[] {
  return divergences.filter((row) => row.kind === 'under_grant');
}

export function listOverGrantDivergences(
  divergences: readonly AiAllowDenyDivergence[],
): AiAllowDenyDivergence[] {
  return divergences.filter((row) => row.kind === 'over_grant');
}

/** parity-1.6 gate — require zero divergences on aligned catalogs. */
export function assertAllowDenyParityZero(
  catalog: readonly AiFeatureCatalogEntry[],
  options?: { includeCapabilityOrphans?: boolean },
): void {
  const divergences = findAllowDenyDivergences(catalog, options);
  if (divergences.length === 0) return;

  const sample = divergences
    .slice(0, 6)
    .map((row) => `${row.kind} ${row.tier}/${row.surface} ${row.intentId}`)
    .join('; ');
  throw new Error(
    `Allow/deny parity failed — ${divergences.length} divergence(s), target zero: ${sample}`,
  );
}

export function buildAllowDenyParityExport(
  catalog: readonly AiFeatureCatalogEntry[],
  now = new Date(),
  options?: { includeCapabilityOrphans?: boolean },
): AllowDenyParityExport {
  const divergences = findAllowDenyDivergences(catalog, options);
  const counts = countAllowDenyDivergences(divergences);

  return {
    generatedAt: now.toISOString(),
    ...counts,
    divergences,
    byRoleSurface: summarizeAllowDenyByRoleSurface(divergences),
    targetZero: counts.totalDivergences === 0,
  };
}

export function formatAllowDenyParityReport(exportData: AllowDenyParityExport): string {
  const lines = [
    'AI Allow/Deny Parity Report (parity-1.6)',
    `Generated: ${exportData.generatedAt}`,
    `Target zero: ${exportData.targetZero ? 'PASS' : 'FAIL'} — total=${exportData.totalDivergences} over=${exportData.overGrantCount} under=${exportData.underGrantCount}`,
    '',
    'Per role / surface:',
  ];

  for (const row of exportData.byRoleSurface) {
    if (row.overGrantCount === 0 && row.underGrantCount === 0) continue;
    lines.push(
      `  ${row.tier.padEnd(7)} ${row.surface.padEnd(9)} over=${row.overGrantCount} under=${row.underGrantCount}`,
    );
  }

  const underGrants = listUnderGrantDivergences(exportData.divergences);
  if (underGrants.length > 0) {
    lines.push('');
    lines.push('Under-grant (UI allows, AI blocks):');
    for (const row of underGrants.slice(0, 20)) {
      lines.push(`  - [${row.tier}/${row.surface}] ${row.featureId} → ${row.intentId}`);
    }
    if (underGrants.length > 20) {
      lines.push(`  ... and ${underGrants.length - 20} more`);
    }
  }

  const overGrants = listOverGrantDivergences(exportData.divergences);
  if (overGrants.length > 0) {
    lines.push('');
    lines.push('Over-grant (AI allows, UI blocks or unmapped):');
    for (const row of overGrants.slice(0, 20)) {
      const tag = row.source === 'capability' ? 'capability' : row.featureId;
      lines.push(`  - [${row.tier}/${row.surface}] ${tag} → ${row.intentId}`);
    }
    if (overGrants.length > 20) {
      lines.push(`  ... and ${overGrants.length - 20} more`);
    }
  }

  return lines.join('\n');
}

export function formatAllowDenyDivergenceLine(row: AiAllowDenyDivergence): string {
  return `[${row.kind}] ${row.tier}/${row.surface} ${row.intentId} — ${row.featureId}`;
}
