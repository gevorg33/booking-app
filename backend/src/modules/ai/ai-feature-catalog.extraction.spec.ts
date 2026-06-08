import { AI_UI_FEATURE_CATALOG } from './ai-feature-catalog.fixtures.js';
import {
  AI_FEATURE_EXTRACTION_REVIEWER_BACKLOG_SAMPLE,
  AI_FEATURE_EXTRACTION_SCENARIOS,
} from './ai-feature-catalog.extraction.fixtures.js';
import {
  AI_FEATURE_EXTRACTION_SEEDS,
  AI_FEATURE_EXTRACTION_SEED_COUNTS,
  DASHBOARD_NAV_EXTRACTION_SEEDS,
} from './ai-feature-catalog.extraction-seeds.js';
import {
  assertExtractionSeedCoverage,
  buildExtractionCandidate,
  buildExtractionCandidates,
  formatFeatureExtractionReport,
  listReviewerBacklog,
  reconcileFeatureCatalogExtraction,
} from './ai-feature-catalog.extraction.util.js';

describe('ai-feature-catalog extraction (parity-1.3)', () => {
  it('mirrors dashboard nav config with unique catalog ids', () => {
    const ids = DASHBOARD_NAV_EXTRACTION_SEEDS.map((row) => row.catalogId);
    expect(new Set(ids).size).toBe(ids.length);
    expect(DASHBOARD_NAV_EXTRACTION_SEEDS.length).toBeGreaterThanOrEqual(19);
  });

  it.each(AI_FEATURE_EXTRACTION_SCENARIOS)(
    'extraction scenario $id resolves to a catalog row',
    ({ catalogId, source, sourceRef }) => {
      const seed = AI_FEATURE_EXTRACTION_SEEDS.find((row) => row.catalogId === catalogId);
      expect(seed).toBeDefined();
      expect(seed?.source).toBe(source);
      expect(seed?.sourceRef).toBe(sourceRef);
      expect(AI_UI_FEATURE_CATALOG.some((entry) => entry.id === catalogId)).toBe(true);
    },
  );

  it('builds unconfirmed candidates from seeds for reviewer workflow', () => {
    const billingSeed = AI_FEATURE_EXTRACTION_SEEDS.find(
      (row) => row.catalogId === 'dashboard.nav.billing',
    )!;
    const candidate = buildExtractionCandidate(billingSeed);
    expect(candidate.confirmed).toBe(false);
    expect(candidate.extractionSource).toBe('nav');
    expect(candidate.intentIds).toEqual([]);

    const candidates = buildExtractionCandidates(AI_FEATURE_EXTRACTION_SEEDS);
    expect(candidates.length).toBeLessThanOrEqual(AI_FEATURE_EXTRACTION_SEEDS.length);
    expect(candidates.every((row) => row.confirmed === false)).toBe(true);
  });

  it('covers every extraction seed in the UI catalog', () => {
    expect(() =>
      assertExtractionSeedCoverage(AI_FEATURE_EXTRACTION_SEEDS, AI_UI_FEATURE_CATALOG),
    ).not.toThrow();
    const reconciliation = reconcileFeatureCatalogExtraction(
      AI_FEATURE_EXTRACTION_SEEDS,
      AI_UI_FEATURE_CATALOG,
    );
    expect(reconciliation.missingFromCatalog).toEqual([]);
    expect(reconciliation.matchedCount).toBe(AI_FEATURE_EXTRACTION_SEEDS.length);
  });

  it('tracks reviewer backlog separately from seed coverage', () => {
    const backlog = listReviewerBacklog(AI_UI_FEATURE_CATALOG);
    for (const id of AI_FEATURE_EXTRACTION_REVIEWER_BACKLOG_SAMPLE) {
      expect(backlog).toContain(id);
    }
    expect(backlog.length).toBeGreaterThan(0);
  });

  it('reports seed counts per surface', () => {
    expect(AI_FEATURE_EXTRACTION_SEED_COUNTS.dashboard).toBeGreaterThan(24);
    expect(AI_FEATURE_EXTRACTION_SEED_COUNTS.provider).toBeGreaterThan(10);
    expect(AI_FEATURE_EXTRACTION_SEED_COUNTS.customer).toBeGreaterThan(8);
    expect(AI_FEATURE_EXTRACTION_SEED_COUNTS.public).toBeGreaterThan(12);
  });

  it('reports extraction inventory for CLI output', () => {
    const reconciliation = reconcileFeatureCatalogExtraction(
      AI_FEATURE_EXTRACTION_SEEDS,
      AI_UI_FEATURE_CATALOG,
    );
    const reviewerBacklog = listReviewerBacklog(AI_UI_FEATURE_CATALOG);
    const report = formatFeatureExtractionReport({ reconciliation, reviewerBacklog });
    expect(report).toContain('AI Feature Extraction Report (parity-1.3)');
    expect(report).toContain(`Seeds: ${AI_FEATURE_EXTRACTION_SEEDS.length}`);

    if (process.env.EXTRACTION_REPORT === '1') {
      console.log(report);
      console.log('');
      console.log(JSON.stringify({ reconciliation, reviewerBacklog }, null, 2));
    }
  });
});
