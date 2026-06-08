import type { AccessTier } from './access-control.matrix.js';
import type { CommandRegistryEntry } from './ai-command-registry.types.js';
import type {
  AiFeatureCatalogEntry,
  AiParityCoverageStatus,
} from './ai-feature-catalog.types.js';
import type {
  FeatureIntentLink,
  FeatureIntentMapEntry,
  FeatureIntentMapExport,
  FeatureIntentUnknownRef,
} from './ai-feature-intent-map.types.js';
import {
  isIntentAllowedForTier,
  roleMeetsCatalogMinTier,
} from './ai-feature-parity.util.js';

export type {
  FeatureIntentLink,
  FeatureIntentMapEntry,
  FeatureIntentMapExport,
  FeatureIntentUnknownRef,
} from './ai-feature-intent-map.types.js';

export {
  FEATURE_INTENT_MAP_FIXTURE_CATALOG,
  FEATURE_INTENT_MAP_LIVE_SAMPLES,
  FEATURE_INTENT_MAP_SCENARIOS,
} from './ai-feature-intent-map.fixtures.js';

function buildRegistryIndex(
  registry: readonly CommandRegistryEntry[],
): Map<string, CommandRegistryEntry> {
  return new Map(registry.map((entry) => [entry.id, entry]));
}

export function isUiCatalogEntry(entry: AiFeatureCatalogEntry): boolean {
  return entry.extractionSource !== 'registry';
}

export function resolveRegistryIntent(
  registryIndex: Map<string, CommandRegistryEntry>,
  intentId: string,
): CommandRegistryEntry | undefined {
  return registryIndex.get(intentId);
}

/** parity-1.4 — link one catalog intent id to its registry row + access checks. */
export function buildFeatureIntentLink(
  entry: AiFeatureCatalogEntry,
  intentId: string,
  registryIndex: Map<string, CommandRegistryEntry>,
): FeatureIntentLink {
  const registryEntry = resolveRegistryIntent(registryIndex, intentId);
  const surfaceMatch = registryEntry?.surfaces.includes(entry.surface) ?? false;
  const allowedAtMinTier = isIntentAllowedForTier(entry.surface, entry.minTier, intentId);

  return {
    intentId,
    registryEntry,
    surfaceMatch,
    allowedAtMinTier,
  };
}

export function classifyFeatureIntentStatus(input: {
  intentIds: readonly string[];
  blockedIntentIds: readonly string[];
  unknownIntentIds: readonly string[];
  wrongSurfaceIntentIds: readonly string[];
  aiExempt?: boolean;
}): AiParityCoverageStatus {
  if (input.aiExempt) return 'covered';
  if (input.intentIds.length === 0) return 'gap';
  if (
    input.blockedIntentIds.length > 0 ||
    input.unknownIntentIds.length > 0 ||
    input.wrongSurfaceIntentIds.length > 0
  ) {
    return 'scope_bug';
  }
  return 'covered';
}

/** parity-1.4 — one UI catalog row mapped to registry intents at its minTier. */
export function buildFeatureIntentMapEntry(
  entry: AiFeatureCatalogEntry,
  registry: readonly CommandRegistryEntry[],
): FeatureIntentMapEntry {
  const registryIndex = buildRegistryIndex(registry);
  const links = entry.intentIds.map((intentId) =>
    buildFeatureIntentLink(entry, intentId, registryIndex),
  );

  const unknownIntentIds = links
    .filter((link) => !link.registryEntry)
    .map((link) => link.intentId);
  const wrongSurfaceIntentIds = links
    .filter((link) => link.registryEntry && !link.surfaceMatch)
    .map((link) => link.intentId);
  const blockedIntentIds = links
    .filter((link) => link.registryEntry && link.surfaceMatch && !link.allowedAtMinTier)
    .map((link) => link.intentId);

  const status = classifyFeatureIntentStatus({
    intentIds: entry.intentIds,
    blockedIntentIds,
    unknownIntentIds,
    wrongSurfaceIntentIds,
    aiExempt: entry.aiExempt,
  });

  return {
    featureId: entry.id,
    surface: entry.surface,
    minTier: entry.minTier,
    label: entry.label,
    intentIds: entry.intentIds,
    links,
    status,
    gap: status === 'gap',
    scopeBug: status === 'scope_bug',
    unknownIntentIds,
    wrongSurfaceIntentIds,
    blockedIntentIds,
  };
}

/** parity-1.4 — full feature → intent map for UI catalog rows only. */
export function buildFeatureIntentMap(
  catalog: readonly AiFeatureCatalogEntry[],
  registry: readonly CommandRegistryEntry[],
): FeatureIntentMapEntry[] {
  return catalog
    .filter(isUiCatalogEntry)
    .map((entry) => buildFeatureIntentMapEntry(entry, registry))
    .sort((a, b) => a.featureId.localeCompare(b.featureId));
}

export function listFeatureIntentGaps(
  entries: readonly FeatureIntentMapEntry[],
): string[] {
  return entries.filter((entry) => entry.gap).map((entry) => entry.featureId);
}

export function listFeatureIntentScopeBugs(
  entries: readonly FeatureIntentMapEntry[],
): string[] {
  return entries.filter((entry) => entry.scopeBug).map((entry) => entry.featureId);
}

export function findUnknownCatalogIntentRefs(
  catalog: readonly AiFeatureCatalogEntry[],
  registry: readonly CommandRegistryEntry[],
): FeatureIntentUnknownRef[] {
  const registryIndex = buildRegistryIndex(registry);
  const refs: FeatureIntentUnknownRef[] = [];

  for (const entry of catalog.filter(isUiCatalogEntry)) {
    for (const intentId of entry.intentIds) {
      if (!registryIndex.has(intentId)) {
        refs.push({ featureId: entry.id, intentId });
      }
    }
  }

  return refs.sort((a, b) =>
    `${a.featureId}.${a.intentId}`.localeCompare(`${b.featureId}.${b.intentId}`),
  );
}

export function findWrongSurfaceCatalogIntentRefs(
  catalog: readonly AiFeatureCatalogEntry[],
  registry: readonly CommandRegistryEntry[],
): FeatureIntentUnknownRef[] {
  const registryIndex = buildRegistryIndex(registry);
  const refs: FeatureIntentUnknownRef[] = [];

  for (const entry of catalog.filter(isUiCatalogEntry)) {
    for (const intentId of entry.intentIds) {
      const registryEntry = registryIndex.get(intentId);
      if (registryEntry && !registryEntry.surfaces.includes(entry.surface)) {
        refs.push({ featureId: entry.id, intentId });
      }
    }
  }

  return refs;
}

/** parity-1.4 — classify scope bug for a role that can reach the UI feature. */
export function classifyFeatureIntentAtTier(
  entry: AiFeatureCatalogEntry,
  tier: AccessTier,
  registry: readonly CommandRegistryEntry[],
): AiParityCoverageStatus {
  if (!roleMeetsCatalogMinTier(tier, entry.minTier)) return 'covered';
  return buildFeatureIntentMapEntry(entry, registry).status;
}

/** parity-1.4 gate — every mapped intent must exist in registry on the feature surface. */
export function assertFeatureIntentRegistryLinks(
  catalog: readonly AiFeatureCatalogEntry[],
  registry: readonly CommandRegistryEntry[],
): void {
  const unknown = findUnknownCatalogIntentRefs(catalog, registry);
  const wrongSurface = findWrongSurfaceCatalogIntentRefs(catalog, registry);

  if (unknown.length === 0 && wrongSurface.length === 0) return;

  const sample = [...unknown, ...wrongSurface]
    .slice(0, 6)
    .map((row) => `${row.featureId}:${row.intentId}`)
    .join('; ');
  throw new Error(
    `Feature intent registry links failed — unknown=${unknown.length} wrongSurface=${wrongSurface.length}: ${sample}`,
  );
}

export function buildFeatureIntentMapExport(
  catalog: readonly AiFeatureCatalogEntry[],
  registry: readonly CommandRegistryEntry[],
  now = new Date(),
): FeatureIntentMapExport {
  const entries = buildFeatureIntentMap(catalog, registry);

  return {
    generatedAt: now.toISOString(),
    uiFeatureCount: entries.length,
    entries,
    gapFeatureIds: listFeatureIntentGaps(entries),
    scopeBugFeatureIds: listFeatureIntentScopeBugs(entries),
    unknownIntentRefs: findUnknownCatalogIntentRefs(catalog, registry),
  };
}

export function formatFeatureIntentMapReport(exportData: FeatureIntentMapExport): string {
  const coveredCount = exportData.entries.filter((row) => row.status === 'covered').length;
  const lines = [
    'AI Feature Intent Map (parity-1.4)',
    `Generated: ${exportData.generatedAt}`,
    `UI features: ${exportData.uiFeatureCount}`,
    `Covered: ${coveredCount} gaps=${exportData.gapFeatureIds.length} scope_bugs=${exportData.scopeBugFeatureIds.length}`,
    `Unknown registry refs: ${exportData.unknownIntentRefs.length}`,
    '',
  ];

  if (exportData.gapFeatureIds.length > 0) {
    lines.push('Gaps (no intent mapped):');
    for (const id of exportData.gapFeatureIds.slice(0, 20)) {
      lines.push(`  - ${id}`);
    }
  }

  if (exportData.scopeBugFeatureIds.length > 0) {
    lines.push('');
    lines.push('Scope bugs (intent blocked or invalid at minTier):');
    for (const id of exportData.scopeBugFeatureIds.slice(0, 20)) {
      const row = exportData.entries.find((entry) => entry.featureId === id);
      lines.push(
        `  - ${id} blocked=[${row?.blockedIntentIds.join(', ') ?? ''}] unknown=[${row?.unknownIntentIds.join(', ') ?? ''}] wrongSurface=[${row?.wrongSurfaceIntentIds.join(', ') ?? ''}]`,
      );
    }
  }

  return lines.join('\n');
}
