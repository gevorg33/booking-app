import {
  type AccessTier,
  isCustomerIntentAllowed,
  isDashboardIntentAllowed,
  isProviderIntentAllowed,
  STAFF_SCOPED_INTENTS,
} from './access-control.matrix.js';
import type { CommandSurface } from './ai-command-registry.types.js';
import { getAllowedIntents, type AiSurface } from './ai-capability.matrix.js';
import type {
  AiFeatureCatalogEntry,
  AiFeatureCoverageCell,
  AiParityCoverageReport,
  AiParityCoverageStatus,
  AiParityRoleSurfaceSummary,
  AiParityUncoveredAction,
  AppAnalyticsUsageRow,
} from './ai-feature-catalog.types.js';
import type { AiTraceAnalyticsRow } from './ai-command-trace.util.js';
import {
  aggregateAppAnalyticsUsage,
  aggregateTraceIntentUsage,
  buildSprint56GapBacklog,
  describeUsageAvailability,
  mergeUncoveredMaps,
  rankUncoveredActionsForRoleSurface,
} from './ai-feature-parity-coverage.util.js';
import type {
  AllowDenyParityExport,
} from './ai-feature-catalog.types.js';
import { buildAllowDenyParityExport } from './ai-feature-allow-deny-parity.util.js';

export const PARITY_ACCESS_TIERS: readonly AccessTier[] = [
  'client',
  'staff',
  'manager',
  'owner',
];

export const PARITY_SURFACES: readonly CommandSurface[] = [
  'dashboard',
  'provider',
  'customer',
  'public',
];

/** Roles evaluated on each surface — client-only on consumer/public; staff+ on ops surfaces. */
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

export function roleMeetsCatalogMinTier(
  tier: AccessTier,
  minTier: AccessTier,
): boolean {
  return TIER_RANK[tier] >= TIER_RANK[minTier];
}

export function isIntentAllowedForTier(
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

/** parity-1.2 — catalog actions reachable in the UI for a role on a surface. */
export function listUiAccessibleCatalogEntries(
  catalog: readonly AiFeatureCatalogEntry[],
  surface: CommandSurface,
  tier: AccessTier,
): AiFeatureCatalogEntry[] {
  return catalog.filter(
    (entry) =>
      entry.surface === surface && roleMeetsCatalogMinTier(tier, entry.minTier),
  );
}

/** parity-1.2 — reconcile UI access with access-control deny lists + staff scope. */
export { buildRoleCapabilityMap } from './ai-role-capability-map.util.js';

function resolveCoverageStatus(input: {
  entry: AiFeatureCatalogEntry;
  tier: AccessTier;
  aiAllowed: boolean;
  blockedIntents: string[];
}): AiParityCoverageStatus {
  if (input.entry.aiExempt) return 'covered';
  if (input.entry.intentIds.length === 0) return 'gap';
  if (input.blockedIntents.length > 0) return 'scope_bug';
  if (!input.aiAllowed) return 'scope_bug';
  return 'covered';
}

/** parity-1.4 — per role/surface cell for the coverage matrix. */
export function buildFeatureCoverageCells(
  catalog: readonly AiFeatureCatalogEntry[],
  surface: CommandSurface,
  tier: AccessTier,
): AiFeatureCoverageCell[] {
  const entries = listUiAccessibleCatalogEntries(catalog, surface, tier).filter(
    (entry) => entry.extractionSource !== 'registry',
  );

  return entries.map((entry) => {
    const blockedIntents = entry.intentIds.filter(
      (intentId) => !isIntentAllowedForTier(surface, tier, intentId),
    );
    const aiAllowed =
      entry.intentIds.length > 0 &&
      blockedIntents.length === 0 &&
      entry.intentIds.every((intentId) =>
        getAllowedIntents(toAiSurface(surface), tier).includes(intentId),
      );

    return {
      featureId: entry.id,
      surface,
      tier,
      uiAccessible: true,
      aiAllowed,
      intentIds: entry.intentIds,
      blockedIntents,
      status: resolveCoverageStatus({ entry, tier, aiAllowed, blockedIntents }),
    };
  });
}

export function summarizeRoleSurfaceCoverage(
  cells: readonly AiFeatureCoverageCell[],
  surface: CommandSurface,
  tier: AccessTier,
): Omit<AiParityRoleSurfaceSummary, 'uncoveredRanked'> {
  const uiActionCount = cells.length;
  const coveredCount = cells.filter((cell) => cell.status === 'covered').length;
  const gapCount = cells.filter((cell) => cell.status === 'gap').length;
  const scopeBugCount = cells.filter((cell) => cell.status === 'scope_bug').length;

  return {
    surface,
    tier,
    uiActionCount,
    coveredCount,
    gapCount,
    scopeBugCount,
    coveragePercent:
      uiActionCount === 0 ? null : coveredCount / uiActionCount,
    gaps: cells.filter((cell) => cell.status === 'gap').map((cell) => cell.featureId),
    scopeBugs: cells
      .filter((cell) => cell.status === 'scope_bug')
      .map((cell) => cell.featureId),
  };
}

/** parity-1.6 — over-grant / under-grant divergences between UI and AI permissions. */
export {
  assertAllowDenyParityZero,
  buildAllowDenyParityExport,
  findAllowDenyDivergences,
  formatAllowDenyParityReport,
} from './ai-feature-allow-deny-parity.util.js';

export function listStaffScopedIntentViolations(
  catalog: readonly AiFeatureCatalogEntry[],
): string[] {
  return catalog
    .filter(
      (entry) =>
        entry.surface === 'provider' &&
        entry.intentIds.some((intentId) => STAFF_SCOPED_INTENTS.has(intentId)),
    )
    .map((entry) => entry.id);
}

/** parity-1.5 — full coverage report for all roles and surfaces. */
export function buildAiParityCoverageReport(
  catalog: readonly AiFeatureCatalogEntry[],
  usage?: {
    traceRows?: readonly AiTraceAnalyticsRow[];
    analyticsRows?: readonly AppAnalyticsUsageRow[];
  },
  now = new Date(),
): AiParityCoverageReport {
  const traceRows = usage?.traceRows ?? [];
  const analyticsRows = usage?.analyticsRows ?? [];
  const traceUsage = aggregateTraceIntentUsage(traceRows);
  const analyticsUsage = aggregateAppAnalyticsUsage(analyticsRows);
  const byRoleSurface: AiParityRoleSurfaceSummary[] = [];
  const allUncovered: AiParityUncoveredAction[] = [];

  for (const { tier, surface } of PARITY_TIER_SURFACE_PAIRS) {
    const cells = buildFeatureCoverageCells(catalog, surface, tier);
    const uncoveredRanked = rankUncoveredActionsForRoleSurface(
      cells,
      catalog,
      traceUsage,
      analyticsUsage,
    );
    allUncovered.push(...uncoveredRanked);
    byRoleSurface.push({
      ...summarizeRoleSurfaceCoverage(cells, surface, tier),
      uncoveredRanked,
    });
  }

  const allowDenyParity = buildAllowDenyParityExport(catalog, now, {
    includeCapabilityOrphans: true,
  });

  return {
    generatedAt: now.toISOString(),
    catalogEntryCount: catalog.length,
    confirmedEntryCount: catalog.filter((entry) => entry.confirmed).length,
    unconfirmedCandidateCount: catalog.filter((entry) => !entry.confirmed).length,
    byRoleSurface,
    allowDenyDivergences: allowDenyParity.divergences.filter((row) => row.source !== 'capability'),
    allowDenyParity,
    extractionBacklog: catalog
      .filter((entry) => !entry.confirmed)
      .map((entry) => entry.id),
    sprint56Backlog: buildSprint56GapBacklog({
      catalog,
      uncoveredByFeature: mergeUncoveredMaps(allUncovered),
      traceUsage,
      analyticsUsage,
    }),
    usageAvailability: describeUsageAvailability({ traceRows, analyticsRows }),
  };
}

export function listCoverageGaps(report: AiParityCoverageReport): string[] {
  return [
    ...new Set(report.byRoleSurface.flatMap((row) => row.gaps)),
  ].sort();
}

export function formatCoveragePercent(rate: number | null): string {
  if (rate == null) return 'n/a';
  return `${(rate * 100).toFixed(1)}%`;
}
