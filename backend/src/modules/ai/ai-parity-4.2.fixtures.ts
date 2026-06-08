import type { AiFeatureCatalogEntry } from './ai-feature-catalog.types.js';
import { AI_UI_FEATURE_CATALOG } from './ai-feature-catalog.fixtures.js';

/** Catalog row missing — simulates a new nav item added without updating ai-feature-catalog.ts. */
export const PARITY_42_MISSING_CATALOG_ID = 'dashboard.nav.billing';

export const PARITY_42_MISSING_CATALOG: readonly AiFeatureCatalogEntry[] =
  AI_UI_FEATURE_CATALOG.filter(
    (entry) => entry.id !== PARITY_42_MISSING_CATALOG_ID,
  );

/** Stale catalog metadata — row exists but minTier drifted from the extraction seed. */
export const PARITY_42_DRIFT_CATALOG_ID = 'dashboard.nav.schedule';

export const PARITY_42_DRIFT_CATALOG: readonly AiFeatureCatalogEntry[] =
  AI_UI_FEATURE_CATALOG.map((entry) =>
    entry.id === PARITY_42_DRIFT_CATALOG_ID
      ? { ...entry, minTier: 'staff' as const }
      : entry,
  );
