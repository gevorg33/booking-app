import type { AccessTier } from './access-control.matrix.js';
import { COMMAND_REGISTRY } from './ai-command-registry.js';
import type { CommandRegistryEntry } from './ai-command-registry.types.js';
import {
  AI_UI_FEATURE_CATALOG,
  AI_UI_FEATURE_CATALOG_MIN_COUNTS,
} from './ai-feature-catalog.fixtures.js';
import type {
  AiFeatureCatalogEntry,
  AiFeatureActionKind,
} from './ai-feature-catalog.types.js';

export type {
  AiAllowDenyDivergence,
  AiAllowDenyDivergenceKind,
  AllowDenyParityExport,
  AllowDenyParityRoleSurfaceSummary,
  AiFeatureActionKind,
  AiFeatureCatalogEntry,
  AiFeatureCoverageCell,
  AiFeatureExtractionReconciliation,
  AiFeatureExtractionSource,
  AiParityCoverageReport,
  AiParityCoverageStatus,
  AiParityRoleSurfaceSummary,
  AiParitySprint56BacklogItem,
  AiParityUncoveredAction,
  AiParityUsageAvailability,
  AppAnalyticsUsageRow,
} from './ai-feature-catalog.types.js';

export {
  AI_UI_FEATURE_CATALOG,
  AI_UI_FEATURE_CATALOG_MIN_COUNTS,
  AI_UI_FEATURE_CATALOG_UNCONFIRMED_IDS,
  CUSTOMER_UI_FEATURES,
  DASHBOARD_PAGE_UI_FEATURES,
  DASHBOARD_ROUTE_UI_FEATURES,
  DASHBOARD_UI_FEATURES,
  PROVIDER_UI_FEATURES,
  PUBLIC_UI_FEATURES,
} from './ai-feature-catalog.fixtures.js';

/** @deprecated parity-1.3 — use AI_FEATURE_EXTRACTION_SEEDS + reconcileFeatureCatalogExtraction. */
export {
  AI_FEATURE_EXTRACTION_SEEDS,
  AI_FEATURE_EXTRACTION_SEED_COUNTS,
  assertExtractionSeedCoverage,
  buildExtractionCandidates,
  CUSTOMER_NAV_EXTRACTION_SEEDS,
  CUSTOMER_PERMISSION_EXTRACTION_SEEDS,
  CUSTOMER_ROUTE_EXTRACTION_SEEDS,
  DASHBOARD_NAV_EXTRACTION_CANDIDATES,
  DASHBOARD_NAV_EXTRACTION_SEEDS,
  DASHBOARD_PAGE_EXTRACTION_SEEDS,
  DASHBOARD_PERMISSION_EXTRACTION_SEEDS,
  DASHBOARD_ROUTE_EXTRACTION_SEEDS,
  formatFeatureExtractionReport,
  listReviewerBacklog,
  PROVIDER_NAV_EXTRACTION_SEEDS,
  PROVIDER_PERMISSION_EXTRACTION_SEEDS,
  PROVIDER_ROUTE_EXTRACTION_SEEDS,
  PUBLIC_ROUTE_EXTRACTION_SEEDS,
  reconcileFeatureCatalogExtraction,
  summarizeExtractionCoverage,
  UI_EXTRACTION_CANDIDATES,
} from './ai-feature-catalog.extraction.js';

const TIER_RANK: Record<AccessTier, number> = {
  client: 0,
  staff: 1,
  manager: 2,
  owner: 3,
};

const VALID_ACTION_KINDS = new Set<AiFeatureActionKind>(['read', 'mutate']);

export function minTierFromRegistryTiers(tiers: readonly AccessTier[]): AccessTier {
  return [...tiers].sort((a, b) => TIER_RANK[a] - TIER_RANK[b])[0] ?? 'owner';
}

/** parity-1.1 — derive supplemental rows from registry intents (AI-only actions). */
export function buildCatalogFromRegistry(
  entries: readonly CommandRegistryEntry[],
): AiFeatureCatalogEntry[] {
  const rows: AiFeatureCatalogEntry[] = [];

  for (const entry of entries) {
    if (entry.id === 'unknown') continue;
    for (const surface of entry.surfaces) {
      rows.push({
        id: `${surface}.${entry.id}`,
        surface,
        module: entry.apiModule,
        actionKind: entry.mutating ? 'mutate' : 'read',
        minTier: minTierFromRegistryTiers(entry.tiers),
        label: entry.label ?? entry.id.replace(/_/g, ' '),
        intentIds: [entry.id],
        extractionSource: 'registry',
        confirmed: true,
      });
    }
  }

  return rows.sort((a, b) => a.id.localeCompare(b.id));
}

/** Merge UI catalog with registry rows (UI ids win on collision). */
export function mergeFeatureCatalog(
  uiRows: readonly AiFeatureCatalogEntry[],
  registryRows: readonly AiFeatureCatalogEntry[] = [],
): AiFeatureCatalogEntry[] {
  const byId = new Map<string, AiFeatureCatalogEntry>();
  for (const row of registryRows) byId.set(row.id, row);
  for (const row of uiRows) byId.set(row.id, row);
  return [...byId.values()].sort((a, b) => a.id.localeCompare(b.id));
}

/** Build the full feature catalog: enumerated UI actions + registry intent coverage. */
export function buildAiFeatureCatalog(
  registry: readonly CommandRegistryEntry[],
  uiRows: readonly AiFeatureCatalogEntry[] = AI_UI_FEATURE_CATALOG,
): AiFeatureCatalogEntry[] {
  return mergeFeatureCatalog(uiRows, buildCatalogFromRegistry(registry));
}

export function createAiFeatureCatalog(
  registry: readonly CommandRegistryEntry[],
): readonly AiFeatureCatalogEntry[] {
  return Object.freeze(buildAiFeatureCatalog(registry));
}

/** parity-1.1 gate — validate catalog shape and surface coverage floors. */
export function validateFeatureCatalog(
  catalog: readonly AiFeatureCatalogEntry[],
  minCounts = AI_UI_FEATURE_CATALOG_MIN_COUNTS,
): string[] {
  const errors: string[] = [];
  const ids = new Set<string>();

  for (const entry of catalog) {
    if (ids.has(entry.id)) errors.push(`Duplicate catalog id: ${entry.id}`);
    ids.add(entry.id);
    if (!entry.label.trim()) errors.push(`Missing label: ${entry.id}`);
    if (!VALID_ACTION_KINDS.has(entry.actionKind)) {
      errors.push(`Invalid actionKind on ${entry.id}`);
    }
    if (!entry.module) errors.push(`Missing module on ${entry.id}`);
  }

  for (const surface of ['dashboard', 'provider', 'customer', 'public'] as const) {
    const uiCount = catalog.filter(
      (entry) => entry.surface === surface && entry.extractionSource !== 'registry',
    ).length;
    if (uiCount < minCounts[surface]) {
      errors.push(
        `Surface ${surface} has ${uiCount} UI actions; minimum is ${minCounts[surface]}`,
      );
    }
  }

  return errors;
}

/** Live feature catalog — UI inventory + registry intents (parity-1.1 single source of truth). */
export const AI_FEATURE_CATALOG: readonly AiFeatureCatalogEntry[] =
  createAiFeatureCatalog(COMMAND_REGISTRY);

export const AI_UI_FEATURE_CATALOG_ERRORS = validateFeatureCatalog(AI_UI_FEATURE_CATALOG);
