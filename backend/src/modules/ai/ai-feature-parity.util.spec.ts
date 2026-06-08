import { buildCommandRegistry, buildCompoundCommandRecipes, collectCompoundStepIds } from './ai-command-registry.build.js';
import {
  AI_FEATURE_CATALOG,
  buildAiFeatureCatalog,
  buildCatalogFromRegistry,
  mergeFeatureCatalog,
} from './ai-feature-catalog.js';
import { AI_UI_FEATURE_CATALOG } from './ai-feature-catalog.fixtures.js';
import {
  AI_PARITY_DIVERGENCE_FIXTURES,
  AI_PARITY_EXTRACTION_BACKLOG,
  AI_PARITY_LIVE_CATALOG_SIZE,
  AI_PARITY_MATRIX_SCENARIOS,
} from './ai-feature-parity.fixtures.js';
import {
  buildAiParityCoverageReport,
  buildFeatureCoverageCells,
  buildRoleCapabilityMap,
  findAllowDenyDivergences,
  formatCoveragePercent,
  listCoverageGaps,
  listUiAccessibleCatalogEntries,
  PARITY_ACCESS_TIERS,
  PARITY_SURFACES,
  PARITY_TIER_SURFACE_PAIRS,
  roleMeetsCatalogMinTier,
} from './ai-feature-parity.util.js';
import { formatAiParityReport } from './ai-feature-parity.report.js';

describe('ai-feature-parity', () => {
  const registry = buildCommandRegistry(
    collectCompoundStepIds(buildCompoundCommandRecipes()),
  );
  const catalog = buildAiFeatureCatalog(registry);

  it('builds a registry-backed catalog with extraction candidates', () => {
    expect(AI_FEATURE_CATALOG.length).toBeGreaterThanOrEqual(
      AI_PARITY_MATRIX_SCENARIOS[0].minCatalogSize,
    );
    expect(catalog.length).toBe(AI_FEATURE_CATALOG.length);
    expect(catalog.some((entry) => entry.id === 'dashboard.nav.billing')).toBe(true);
    expect(catalog.some((entry) => entry.id === 'dashboard.list_bookings')).toBe(true);
  });

  it('merges registry rows without clobbering UI ids', () => {
    const registryRows = buildCatalogFromRegistry(registry.slice(0, 5));
    const merged = mergeFeatureCatalog(AI_UI_FEATURE_CATALOG.slice(0, 3), registryRows);
    expect(merged.length).toBeGreaterThan(3);
  });

  it.each(AI_PARITY_MATRIX_SCENARIOS.filter((row) => row.featureId))(
    'matrix scenario $id',
    ({ featureId, expectedStatus, tier, surface }) => {
      const cells = buildFeatureCoverageCells(catalog, surface!, tier!);
      const cell = cells.find((row) => row.featureId === featureId);
      expect(cell?.status).toBe(expectedStatus);
    },
  );

  it('builds role capability maps for every tier and surface', () => {
    const map = buildRoleCapabilityMap(catalog);
    for (const tier of PARITY_ACCESS_TIERS) {
      for (const surface of PARITY_SURFACES) {
        expect(Array.isArray(map[tier][surface])).toBe(true);
      }
    }
    expect(map.owner.dashboard.length).toBeGreaterThan(map.client.dashboard.length);
  });

  it('flags under-grant when UI minTier is below denied AI tier', () => {
    const divergences = findAllowDenyDivergences(AI_PARITY_DIVERGENCE_FIXTURES.catalog);
    expect(
      divergences.some(
        (row) =>
          row.kind === 'under_grant' &&
          row.tier === AI_PARITY_DIVERGENCE_FIXTURES.underGrantTier &&
          row.intentId === AI_PARITY_DIVERGENCE_FIXTURES.intentId,
      ),
    ).toBe(true);
  });

  it('reports coverage summary with gaps and divergences', () => {
    const report = buildAiParityCoverageReport(catalog);
    expect(report.catalogEntryCount).toBe(AI_PARITY_LIVE_CATALOG_SIZE);
    expect(report.byRoleSurface.length).toBe(PARITY_TIER_SURFACE_PAIRS.length);
    expect(report.sprint56Backlog.length).toBeGreaterThan(0);
    expect(report.allowDenyParity.totalDivergences).toBeGreaterThan(0);
    expect(listCoverageGaps(report).length).toBe(0);
    expect(formatAiParityReport(report)).toContain('AI Feature Parity Coverage Report (parity-1.5)');
    expect(formatAiParityReport(report)).toContain('AI Allow/Deny Parity Report (parity-1.6)');
    expect(formatCoveragePercent(0.995)).toBe('99.5%');
  });

  it('tracks extraction backlog for unconfirmed nav candidates', () => {
    expect(AI_PARITY_EXTRACTION_BACKLOG).toContain('dashboard.route.calendar');
    const report = buildAiParityCoverageReport(catalog);
    expect(report.extractionBacklog).toEqual(
      expect.arrayContaining(AI_PARITY_EXTRACTION_BACKLOG),
    );
  });

  it('scopes UI access by min tier', () => {
    expect(roleMeetsCatalogMinTier('owner', 'manager')).toBe(true);
    expect(roleMeetsCatalogMinTier('staff', 'manager')).toBe(false);
    const ownerBilling = listUiAccessibleCatalogEntries(
      catalog,
      'dashboard',
      'owner',
    ).find((entry) => entry.id === 'dashboard.nav.billing');
    expect(ownerBilling).toBeDefined();
    expect(
      listUiAccessibleCatalogEntries(catalog, 'dashboard', 'staff').some(
        (entry) => entry.id === 'dashboard.nav.billing',
      ),
    ).toBe(false);
  });
});
