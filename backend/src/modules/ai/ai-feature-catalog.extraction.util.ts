import type {
  AiFeatureCatalogEntry,
  AiFeatureExtractionReconciliation,
} from './ai-feature-catalog.types.js';
import type { AiFeatureExtractionSeed } from './ai-feature-catalog.extraction-seeds.js';

export function findCatalogEntryForSeed(
  catalog: readonly AiFeatureCatalogEntry[],
  seed: AiFeatureExtractionSeed,
): AiFeatureCatalogEntry | undefined {
  return catalog.find((entry) => entry.id === seed.catalogId);
}

/** parity-1.3 — derive unconfirmed catalog candidate from an extraction seed. */
export function buildExtractionCandidate(
  seed: AiFeatureExtractionSeed,
): AiFeatureCatalogEntry {
  return {
    id: seed.catalogId,
    surface: seed.surface,
    module: seed.module,
    actionKind: seed.actionKind,
    minTier: seed.minTier,
    label: seed.label,
    intentIds: [],
    uiPath: seed.uiPath,
    navRef: seed.navRef,
    extractionSource: seed.source,
    confirmed: false,
  };
}

export function buildExtractionCandidates(
  seeds: readonly AiFeatureExtractionSeed[],
): AiFeatureCatalogEntry[] {
  const byId = new Map<string, AiFeatureCatalogEntry>();
  for (const seed of seeds) {
    byId.set(seed.catalogId, buildExtractionCandidate(seed));
  }
  return [...byId.values()].sort((a, b) => a.id.localeCompare(b.id));
}

export function listReviewerBacklog(
  catalog: readonly AiFeatureCatalogEntry[],
): string[] {
  return catalog.filter((entry) => !entry.confirmed).map((entry) => entry.id).sort();
}

/** parity-1.3 — compare extraction seeds against reviewer-confirmed catalog rows. */
export function reconcileFeatureCatalogExtraction(
  seeds: readonly AiFeatureExtractionSeed[],
  catalog: readonly AiFeatureCatalogEntry[],
): AiFeatureExtractionReconciliation {
  const manualCatalog = catalog.filter((entry) => entry.extractionSource !== 'registry');
  const catalogIds = new Set(manualCatalog.map((entry) => entry.id));
  const seedCatalogIds = new Set(seeds.map((seed) => seed.catalogId));

  const missingFromCatalog = seeds
    .filter((seed) => !catalogIds.has(seed.catalogId))
    .map((seed) => seed.catalogId);

  const matchedCount = seeds.filter((seed) => catalogIds.has(seed.catalogId)).length;

  const unconfirmedCatalogIds = manualCatalog
    .filter((entry) => seedCatalogIds.has(entry.id) && !entry.confirmed)
    .map((entry) => entry.id);

  const orphanCatalogIds = manualCatalog
    .filter((entry) => !seedCatalogIds.has(entry.id))
    .map((entry) => entry.id);

  return {
    seedCount: seeds.length,
    matchedCount,
    missingFromCatalog: [...new Set(missingFromCatalog)].sort(),
    unconfirmedCatalogIds: [...new Set(unconfirmedCatalogIds)].sort(),
    orphanCatalogIds: [...new Set(orphanCatalogIds)].sort(),
  };
}

/** parity-1.3 gate — every nav/route/permission seed must exist in the UI catalog. */
export function assertExtractionSeedCoverage(
  seeds: readonly AiFeatureExtractionSeed[],
  catalog: readonly AiFeatureCatalogEntry[],
): void {
  const reconciliation = reconcileFeatureCatalogExtraction(seeds, catalog);
  if (reconciliation.missingFromCatalog.length === 0) return;

  const sample = reconciliation.missingFromCatalog.slice(0, 8).join(', ');
  throw new Error(
    `Feature extraction coverage failed — ${reconciliation.missingFromCatalog.length} seed(s) missing from catalog: ${sample}`,
  );
}

export function formatFeatureExtractionReport(input: {
  reconciliation: AiFeatureExtractionReconciliation;
  reviewerBacklog: readonly string[];
}): string {
  const { reconciliation, reviewerBacklog } = input;
  const lines = [
    'AI Feature Extraction Report (parity-1.3)',
    `Seeds: ${reconciliation.seedCount} matched=${reconciliation.matchedCount}`,
    `Missing from catalog: ${reconciliation.missingFromCatalog.length}`,
    `Reviewer backlog (unconfirmed): ${reviewerBacklog.length}`,
    `Orphan catalog rows (no seed): ${reconciliation.orphanCatalogIds.length}`,
    '',
  ];

  if (reconciliation.missingFromCatalog.length > 0) {
    lines.push('Missing catalog ids:');
    for (const id of reconciliation.missingFromCatalog.slice(0, 20)) {
      lines.push(`  - ${id}`);
    }
  }

  if (reviewerBacklog.length > 0) {
    lines.push('');
    lines.push('Reviewer backlog:');
    for (const id of reviewerBacklog.slice(0, 20)) {
      lines.push(`  - ${id}`);
    }
  }

  if (reconciliation.orphanCatalogIds.length > 0) {
    lines.push('');
    lines.push('Orphan catalog ids (manual-only, no extraction seed):');
    for (const id of reconciliation.orphanCatalogIds.slice(0, 15)) {
      lines.push(`  - ${id}`);
    }
  }

  return lines.join('\n');
}
