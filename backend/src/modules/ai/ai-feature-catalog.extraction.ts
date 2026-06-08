import type { AiFeatureCatalogEntry } from './ai-feature-catalog.types.js';
import {
  CUSTOMER_NAV_EXTRACTION_SEEDS,
  CUSTOMER_ROUTE_EXTRACTION_SEEDS,
  DASHBOARD_NAV_EXTRACTION_SEEDS,
  PUBLIC_ROUTE_EXTRACTION_SEEDS,
  AI_FEATURE_EXTRACTION_SEEDS,
} from './ai-feature-catalog.extraction-seeds.js';
import {
  buildExtractionCandidates,
  reconcileFeatureCatalogExtraction,
} from './ai-feature-catalog.extraction.util.js';

/**
 * parity-1.3 — semi-automated extraction exports.
 * Seeds mirror nav config, route tables, and permission guards in dashboard + both apps.
 */
export {
  AI_FEATURE_EXTRACTION_SEEDS,
  AI_FEATURE_EXTRACTION_SEED_COUNTS,
  CUSTOMER_NAV_EXTRACTION_SEEDS,
  CUSTOMER_PERMISSION_EXTRACTION_SEEDS,
  CUSTOMER_ROUTE_EXTRACTION_SEEDS,
  DASHBOARD_NAV_EXTRACTION_SEEDS,
  DASHBOARD_PAGE_EXTRACTION_SEEDS,
  DASHBOARD_PERMISSION_EXTRACTION_SEEDS,
  DASHBOARD_ROUTE_EXTRACTION_SEEDS,
  PROVIDER_NAV_EXTRACTION_SEEDS,
  PROVIDER_PAGE_EXTRACTION_SEEDS,
  PROVIDER_PERMISSION_EXTRACTION_SEEDS,
  PROVIDER_ROUTE_EXTRACTION_SEEDS,
  PUBLIC_ROUTE_EXTRACTION_SEEDS,
} from './ai-feature-catalog.extraction-seeds.js';

export type { AiFeatureExtractionSeed } from './ai-feature-catalog.extraction-seeds.js';

export {
  assertExtractionSeedCoverage,
  buildExtractionCandidate,
  buildExtractionCandidates,
  findCatalogEntryForSeed,
  formatFeatureExtractionReport,
  listReviewerBacklog,
  reconcileFeatureCatalogExtraction,
} from './ai-feature-catalog.extraction.util.js';

/** @deprecated parity-1.3 — use buildExtractionCandidates(AI_FEATURE_EXTRACTION_SEEDS). */
export const UI_EXTRACTION_CANDIDATES: readonly AiFeatureCatalogEntry[] =
  buildExtractionCandidates(AI_FEATURE_EXTRACTION_SEEDS);

/** @deprecated parity-1.3 — use section-specific seed arrays. */
export const DASHBOARD_NAV_EXTRACTION_CANDIDATES = buildExtractionCandidates(
  DASHBOARD_NAV_EXTRACTION_SEEDS,
);

/** @deprecated parity-1.3 — use reconcileFeatureCatalogExtraction. */
export function summarizeExtractionCoverage(
  catalog: readonly AiFeatureCatalogEntry[],
): ReturnType<typeof reconcileFeatureCatalogExtraction> {
  return reconcileFeatureCatalogExtraction(AI_FEATURE_EXTRACTION_SEEDS, catalog);
}
