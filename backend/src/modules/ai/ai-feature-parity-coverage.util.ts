import type { AccessTier } from './access-control.matrix.js';
import type { CommandSurface } from './ai-command-registry.types.js';
import type { AiTraceAnalyticsRow } from './ai-command-trace.util.js';
import type {
  AiFeatureCatalogEntry,
  AiFeatureCoverageCell,
  AiParitySprint56BacklogItem,
  AiParityUncoveredAction,
  AppAnalyticsUsageRow,
} from './ai-feature-catalog.types.js';
import { isUiCatalogEntry } from './ai-feature-intent-map.util.js';

export type {
  AiParitySprint56BacklogItem,
  AiParityUncoveredAction,
  AiParityUsageAvailability,
  AppAnalyticsUsageRow,
} from './ai-feature-catalog.types.js';

export {
  AI_PARITY_COVERAGE_ANALYTICS_FIXTURES,
  AI_PARITY_COVERAGE_SCENARIOS,
  AI_PARITY_COVERAGE_TRACE_FIXTURES,
} from './ai-feature-parity-coverage.fixtures.js';

const TRACE_WEIGHT = 10;

function catalogEntryById(
  catalog: readonly AiFeatureCatalogEntry[],
  featureId: string,
): AiFeatureCatalogEntry | undefined {
  return catalog.find((entry) => entry.id === featureId);
}

function analyticsSurfaceForCommandSurface(
  surface: CommandSurface,
): AppAnalyticsUsageRow['appSurface'] {
  switch (surface) {
    case 'dashboard':
      return 'dashboard_web';
    case 'provider':
      return 'provider_app';
    case 'customer':
      return 'consumer_app';
    case 'public':
      return 'public_web';
    default:
      return 'dashboard_web';
  }
}

function normalizeRoute(path: string): string {
  return path.replace(/:[^/]+/g, '*').replace(/\/+$/, '') || '/';
}

/** parity-1.5 — aggregate ai_command_trace rows by surface + intent action. */
export function aggregateTraceIntentUsage(
  rows: readonly AiTraceAnalyticsRow[],
): Map<string, number> {
  const usage = new Map<string, number>();
  for (const row of rows) {
    const key = `${row.surface}:${row.action}`;
    usage.set(key, (usage.get(key) ?? 0) + 1);
  }
  return usage;
}

/** parity-1.5 — aggregate app analytics screen/route counts by surface bucket. */
export function aggregateAppAnalyticsUsage(
  rows: readonly AppAnalyticsUsageRow[],
): Map<string, number> {
  const usage = new Map<string, number>();
  for (const row of rows) {
    const key = `${row.appSurface}:${normalizeRoute(row.screenOrRoute)}`;
    usage.set(key, (usage.get(key) ?? 0) + row.eventCount);
  }
  return usage;
}

export function countTraceIntentHits(
  entry: AiFeatureCatalogEntry,
  traceUsage: ReadonlyMap<string, number>,
): number {
  return entry.intentIds.reduce(
    (sum, intentId) => sum + (traceUsage.get(`${entry.surface}:${intentId}`) ?? 0),
    0,
  );
}

export function countAnalyticsScreenHits(
  entry: AiFeatureCatalogEntry,
  analyticsUsage: ReadonlyMap<string, number>,
): number {
  if (!entry.uiPath) return 0;
  const key = `${analyticsSurfaceForCommandSurface(entry.surface)}:${normalizeRoute(entry.uiPath)}`;
  return analyticsUsage.get(key) ?? 0;
}

export function scoreFeatureUsage(input: {
  traceIntentHits: number;
  analyticsScreenHits: number;
}): number {
  return input.traceIntentHits * TRACE_WEIGHT + input.analyticsScreenHits;
}

export function buildUncoveredAction(
  cell: AiFeatureCoverageCell,
  catalog: readonly AiFeatureCatalogEntry[],
  traceUsage: ReadonlyMap<string, number>,
  analyticsUsage: ReadonlyMap<string, number>,
): AiParityUncoveredAction | null {
  if (cell.status === 'covered') return null;
  const entry = catalogEntryById(catalog, cell.featureId);
  if (!entry) return null;

  const traceIntentHits = countTraceIntentHits(entry, traceUsage);
  const analyticsScreenHits = countAnalyticsScreenHits(entry, analyticsUsage);

  return {
    featureId: cell.featureId,
    label: entry.label,
    module: String(entry.module),
    status: cell.status === 'gap' ? 'gap' : 'scope_bug',
    usageScore: scoreFeatureUsage({ traceIntentHits, analyticsScreenHits }),
    traceIntentHits,
    analyticsScreenHits,
    blockedIntents: cell.blockedIntents,
  };
}

/** parity-1.5 — uncovered actions for one role/surface, ranked by usage score desc. */
export function rankUncoveredActionsForRoleSurface(
  cells: readonly AiFeatureCoverageCell[],
  catalog: readonly AiFeatureCatalogEntry[],
  traceUsage: ReadonlyMap<string, number>,
  analyticsUsage: ReadonlyMap<string, number>,
): AiParityUncoveredAction[] {
  return cells
    .map((cell) => buildUncoveredAction(cell, catalog, traceUsage, analyticsUsage))
    .filter((row): row is AiParityUncoveredAction => row != null)
    .sort((a, b) =>
      b.usageScore - a.usageScore ||
      a.featureId.localeCompare(b.featureId),
    );
}

/** parity-1.5 — Sprint 56 backlog: gaps, scope bugs, and unconfirmed catalog rows. */
export function buildSprint56GapBacklog(input: {
  catalog: readonly AiFeatureCatalogEntry[];
  uncoveredByFeature: ReadonlyMap<string, AiParityUncoveredAction>;
  traceUsage: ReadonlyMap<string, number>;
  analyticsUsage: ReadonlyMap<string, number>;
}): AiParitySprint56BacklogItem[] {
  const items = new Map<string, AiParitySprint56BacklogItem>();

  for (const entry of input.catalog.filter(isUiCatalogEntry)) {
    const uncovered = input.uncoveredByFeature.get(entry.id);
    if (uncovered) {
      items.set(entry.id, {
        featureId: entry.id,
        label: entry.label,
        module: String(entry.module),
        minTier: entry.minTier,
        surface: entry.surface,
        kind: uncovered.status,
        usageScore: uncovered.usageScore,
        traceIntentHits: uncovered.traceIntentHits,
        analyticsScreenHits: uncovered.analyticsScreenHits,
        intentIds: entry.intentIds,
      });
      continue;
    }

    if (!entry.confirmed) {
      const traceIntentHits = countTraceIntentHits(entry, input.traceUsage);
      const analyticsScreenHits = countAnalyticsScreenHits(entry, input.analyticsUsage);
      items.set(entry.id, {
        featureId: entry.id,
        label: entry.label,
        module: String(entry.module),
        minTier: entry.minTier,
        surface: entry.surface,
        kind: 'unconfirmed',
        usageScore: scoreFeatureUsage({ traceIntentHits, analyticsScreenHits }),
        traceIntentHits,
        analyticsScreenHits,
        intentIds: entry.intentIds,
      });
    }
  }

  return [...items.values()].sort((a, b) =>
    b.usageScore - a.usageScore ||
    a.featureId.localeCompare(b.featureId),
  );
}

export function mergeUncoveredMaps(
  rows: readonly AiParityUncoveredAction[],
): Map<string, AiParityUncoveredAction> {
  const merged = new Map<string, AiParityUncoveredAction>();
  for (const row of rows) {
    const existing = merged.get(row.featureId);
    if (!existing || row.usageScore > existing.usageScore) {
      merged.set(row.featureId, row);
    }
  }
  return merged;
}

export function formatUncoveredActionLine(action: AiParityUncoveredAction, rank: number): string {
  return `  ${String(rank).padStart(2)}. ${action.featureId} [${action.status}] score=${action.usageScore} trace=${action.traceIntentHits} analytics=${action.analyticsScreenHits}`;
}

export function formatSprint56BacklogLine(item: AiParitySprint56BacklogItem, rank: number): string {
  return `  ${String(rank).padStart(2)}. ${item.featureId} [${item.kind}] ${item.surface}/${item.minTier} score=${item.usageScore}`;
}

export function describeUsageAvailability(input: {
  traceRows: readonly AiTraceAnalyticsRow[];
  analyticsRows: readonly AppAnalyticsUsageRow[];
}): { traceRows: number; analyticsRows: number } {
  return {
    traceRows: input.traceRows.length,
    analyticsRows: input.analyticsRows.length,
  };
}

/** parity-1.5 — highest-usage uncovered actions across all roles (deduped). */
export function listTopUncoveredActions(
  uncoveredByFeature: ReadonlyMap<string, AiParityUncoveredAction>,
  limit = 20,
): AiParityUncoveredAction[] {
  return [...uncoveredByFeature.values()]
    .sort((a, b) => b.usageScore - a.usageScore || a.featureId.localeCompare(b.featureId))
    .slice(0, limit);
}

export function tierSurfaceKey(tier: AccessTier, surface: CommandSurface): string {
  return `${tier}/${surface}`;
}
