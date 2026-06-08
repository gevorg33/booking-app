import { AI_FEATURE_EXTRACTION_SEEDS } from './ai-feature-catalog.extraction-seeds.js';
import { AI_UI_FEATURE_CATALOG } from './ai-feature-catalog.fixtures.js';
import {
  PARITY_42_DRIFT_CATALOG,
  PARITY_42_DRIFT_CATALOG_ID,
  PARITY_42_MISSING_CATALOG,
  PARITY_42_MISSING_CATALOG_ID,
} from './ai-parity-4.2.fixtures.js';
import {
  assertParity42CiGate,
  buildCatalogFreshnessStatus,
  findCatalogSeedDrift,
  formatCatalogFreshnessReport,
} from './ai-parity-4.2.util.js';

describe('ai-parity-4.2 (catalog freshness gate)', () => {
  it('assertParity42CiGate passes when every seed has a matching catalog row', () => {
    expect(() => assertParity42CiGate()).not.toThrow();
    const status = buildCatalogFreshnessStatus(
      AI_FEATURE_EXTRACTION_SEEDS,
      AI_UI_FEATURE_CATALOG,
    );
    expect(status.complete).toBe(true);
    expect(status.reconciliation.missingFromCatalog).toEqual([]);
    expect(status.drift).toEqual([]);
  });

  it('fails when a nav/route/permission seed is missing from ai-feature-catalog.ts', () => {
    expect(() =>
      assertParity42CiGate(AI_FEATURE_EXTRACTION_SEEDS, PARITY_42_MISSING_CATALOG),
    ).toThrow(/parity-4\.2/);
    const status = buildCatalogFreshnessStatus(
      AI_FEATURE_EXTRACTION_SEEDS,
      PARITY_42_MISSING_CATALOG,
    );
    expect(status.reconciliation.missingFromCatalog).toContain(
      PARITY_42_MISSING_CATALOG_ID,
    );
  });

  it('fails when catalog metadata drifts from the extraction seed', () => {
    const drift = findCatalogSeedDrift(
      AI_FEATURE_EXTRACTION_SEEDS,
      PARITY_42_DRIFT_CATALOG,
    );
    expect(
      drift.some(
        (row) =>
          row.catalogId === PARITY_42_DRIFT_CATALOG_ID && row.field === 'minTier',
      ),
    ).toBe(true);
    expect(() =>
      assertParity42CiGate(AI_FEATURE_EXTRACTION_SEEDS, PARITY_42_DRIFT_CATALOG),
    ).toThrow(/minTier drift/);
  });

  it('formats catalog freshness report for npm run report:ai-catalog-freshness', () => {
    const status = buildCatalogFreshnessStatus(
      AI_FEATURE_EXTRACTION_SEEDS,
      AI_UI_FEATURE_CATALOG,
    );
    const text = formatCatalogFreshnessReport(status);
    expect(text).toContain('AI Catalog Freshness Gate (parity-4.2)');
    expect(text).toContain('PASS');

    if (process.env.CATALOG_FRESHNESS_REPORT === '1') {
      console.log(text);
      console.log('');
      console.log(JSON.stringify(status, null, 2));
    }
  });
});
