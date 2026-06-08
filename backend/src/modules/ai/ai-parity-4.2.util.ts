import type {
  AiFeatureCatalogEntry,
  AiFeatureExtractionReconciliation,
} from './ai-feature-catalog.types.js';
import type { AiFeatureExtractionSeed } from './ai-feature-catalog.extraction-seeds.js';
import { AI_FEATURE_EXTRACTION_SEEDS } from './ai-feature-catalog.extraction-seeds.js';
import { AI_UI_FEATURE_CATALOG } from './ai-feature-catalog.fixtures.js';
import {
  findCatalogEntryForSeed,
  reconcileFeatureCatalogExtraction,
} from './ai-feature-catalog.extraction.util.js';

export type CatalogSeedDriftField = 'surface' | 'minTier' | 'uiPath';

export interface CatalogSeedDrift {
  catalogId: string;
  field: CatalogSeedDriftField;
  seedValue: string;
  catalogValue: string;
  sourceRef: string;
}

export interface CatalogFreshnessStatus {
  complete: boolean;
  errors: string[];
  reconciliation: AiFeatureExtractionReconciliation;
  drift: CatalogSeedDrift[];
}

function compareSeedField(
  seed: AiFeatureExtractionSeed,
  entry: AiFeatureCatalogEntry,
  field: CatalogSeedDriftField,
): CatalogSeedDrift | undefined {
  const seedValue = seed[field];
  const catalogValue = entry[field];
  if (seedValue == null || catalogValue == null) return undefined;
  if (String(seedValue) === String(catalogValue)) return undefined;
  return {
    catalogId: seed.catalogId,
    field,
    seedValue: String(seedValue),
    catalogValue: String(catalogValue),
    sourceRef: seed.sourceRef,
  };
}

/** parity-4.2 — detect stale catalog rows whose metadata no longer matches extraction seeds. */
export function findCatalogSeedDrift(
  seeds: readonly AiFeatureExtractionSeed[],
  catalog: readonly AiFeatureCatalogEntry[],
): CatalogSeedDrift[] {
  const drift: CatalogSeedDrift[] = [];

  for (const seed of seeds) {
    const entry = findCatalogEntryForSeed(catalog, seed);
    if (!entry) continue;

    for (const field of ['surface', 'minTier', 'uiPath'] as const) {
      const row = compareSeedField(seed, entry, field);
      if (row) drift.push(row);
    }
  }

  return drift.sort((a, b) =>
    `${a.catalogId}.${a.field}`.localeCompare(`${b.catalogId}.${b.field}`),
  );
}

export function buildCatalogFreshnessStatus(
  seeds: readonly AiFeatureExtractionSeed[],
  catalog: readonly AiFeatureCatalogEntry[],
): CatalogFreshnessStatus {
  const reconciliation = reconcileFeatureCatalogExtraction(seeds, catalog);
  const drift = findCatalogSeedDrift(seeds, catalog);
  const errors: string[] = [];

  if (reconciliation.missingFromCatalog.length > 0) {
    errors.push(
      `${reconciliation.missingFromCatalog.length} extraction seed(s) missing from ai-feature-catalog.ts: ${reconciliation.missingFromCatalog.slice(0, 8).join(', ')}`,
    );
  }

  for (const row of drift) {
    errors.push(
      `${row.catalogId} ${row.field} drift — seed=${row.seedValue} catalog=${row.catalogValue} (${row.sourceRef})`,
    );
  }

  return {
    complete: errors.length === 0,
    errors,
    reconciliation,
    drift,
  };
}

/** parity-4.2 — fails CI when nav/route/permission seeds lack a matching catalog row or metadata drifted. */
export function assertParity42CiGate(
  seeds: readonly AiFeatureExtractionSeed[] = AI_FEATURE_EXTRACTION_SEEDS,
  catalog: readonly AiFeatureCatalogEntry[] = AI_UI_FEATURE_CATALOG,
): CatalogFreshnessStatus {
  const status = buildCatalogFreshnessStatus(seeds, catalog);
  if (status.complete) return status;

  throw new Error(
    [
      'AI catalog freshness gate failed (parity-4.2) — merge blocked.',
      'Add or update rows in ai-feature-catalog.ts (AI_UI_FEATURE_CATALOG) when nav/routes/permissions change.',
      ...status.errors.map((line) => `  - ${line}`),
    ].join('\n'),
  );
}

export function formatCatalogFreshnessReport(status: CatalogFreshnessStatus): string {
  const lines = [
    'AI Catalog Freshness Gate (parity-4.2)',
    `Status: ${status.complete ? 'PASS' : 'FAIL'}`,
    `Extraction seeds: ${status.reconciliation.seedCount}`,
    `Matched catalog rows: ${status.reconciliation.matchedCount}`,
    `Missing from catalog: ${status.reconciliation.missingFromCatalog.length}`,
    `Metadata drift: ${status.drift.length}`,
    '',
    'Seed sources: nav, route, permission guards across dashboard / provider / customer / public surfaces.',
  ];

  if (status.reconciliation.missingFromCatalog.length > 0) {
    lines.push('', 'Missing catalog ids:');
    for (const id of status.reconciliation.missingFromCatalog.slice(0, 20)) {
      lines.push(`  - ${id}`);
    }
  }

  if (status.drift.length > 0) {
    lines.push('', 'Metadata drift:');
    for (const row of status.drift.slice(0, 20)) {
      lines.push(
        `  - ${row.catalogId} ${row.field}: seed=${row.seedValue} catalog=${row.catalogValue}`,
      );
    }
  }

  if (status.errors.length > 0) {
    lines.push('', 'Failures:');
    for (const error of status.errors) lines.push(`  - ${error}`);
  }

  return lines.join('\n');
}
