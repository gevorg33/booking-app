import { buildCommandRegistry, buildCompoundCommandRecipes, collectCompoundStepIds } from './ai-command-registry.build.js';
import { buildAiFeatureCatalog } from './ai-feature-catalog.js';
import {
  ALLOW_DENY_PARITY_CLEAN_CATALOG,
  ALLOW_DENY_PARITY_FIXTURE_CATALOG,
  ALLOW_DENY_PARITY_LIVE_SAMPLES,
  ALLOW_DENY_PARITY_SCENARIOS,
} from './ai-feature-allow-deny-parity.fixtures.js';
import {
  assertAllowDenyParityZero,
  buildAllowDenyParityExport,
  findAllowDenyDivergences,
  findCatalogAllowDenyDivergencesForPair,
  formatAllowDenyParityReport,
  listOverGrantDivergences,
  listUnderGrantDivergences,
  summarizeAllowDenyByRoleSurface,
} from './ai-feature-allow-deny-parity.util.js';
import { buildAiParityCoverageReport } from './ai-feature-parity.util.js';

describe('ai-feature-allow-deny-parity (parity-1.6)', () => {
  const registry = buildCommandRegistry(
    collectCompoundStepIds(buildCompoundCommandRecipes()),
  );
  const catalog = buildAiFeatureCatalog(registry);

  it.each(
    ALLOW_DENY_PARITY_SCENARIOS.filter(
      (row): row is typeof row & { kind: 'over_grant' | 'under_grant' } => 'kind' in row,
    ),
  )('fixture divergence scenario $id', ({ kind, featureId, tier, surface, intentId }) => {
    const divergences = findAllowDenyDivergences(ALLOW_DENY_PARITY_FIXTURE_CATALOG, {
      includeCapabilityOrphans: false,
    });
    expect(
      divergences.some(
        (row) =>
          row.kind === kind &&
          row.featureId === featureId &&
          row.tier === tier &&
          row.surface === surface &&
          row.intentId === intentId,
      ),
    ).toBe(true);
  });

  it('passes target-zero gate on aligned fixture catalog', () => {
    expect(() =>
      assertAllowDenyParityZero(ALLOW_DENY_PARITY_CLEAN_CATALOG, {
        includeCapabilityOrphans: false,
      }),
    ).not.toThrow();
  });

  it('flags under-grant when UI minTier allows staff but AI denies intent', () => {
    const divergences = findCatalogAllowDenyDivergencesForPair(
      ALLOW_DENY_PARITY_FIXTURE_CATALOG,
      'dashboard',
      'staff',
    );
    expect(
      listUnderGrantDivergences(divergences).some(
        (row) => row.intentId === 'list_employees',
      ),
    ).toBe(true);
  });

  it('flags over-grant when AI allows intent above UI minTier', () => {
    const divergences = findCatalogAllowDenyDivergencesForPair(
      ALLOW_DENY_PARITY_FIXTURE_CATALOG,
      'dashboard',
      'manager',
    );
    expect(
      listOverGrantDivergences(divergences).some(
        (row) => row.intentId === 'list_templates',
      ),
    ).toBe(true);
  });

  it('parity-4.1 — skips over-grant when another UI-accessible row maps the intent', () => {
    const divergences = findCatalogAllowDenyDivergencesForPair(
      catalog,
      'dashboard',
      'staff',
    );
    expect(
      divergences.some(
        (row) =>
          row.kind === 'over_grant' &&
          row.intentId === 'block_schedule' &&
          row.featureId === 'dashboard.nav.schedule',
      ),
    ).toBe(false);
    expect(
      divergences.some(
        (row) =>
          row.kind === 'under_grant' &&
          row.intentId === 'block_schedule' &&
          row.featureId === 'dashboard.action.block_own_break',
      ),
    ).toBe(false);
  });

  it('parity-4.1 — live catalog has zero catalog allow/deny divergences', () => {
    expect(() =>
      assertAllowDenyParityZero(catalog, { includeCapabilityOrphans: false }),
    ).not.toThrow();
    const exportData = buildAllowDenyParityExport(catalog, new Date(), {
      includeCapabilityOrphans: false,
    });
    expect(exportData.totalDivergences).toBe(0);
    expect(exportData.overGrantCount).toBe(0);
    expect(exportData.underGrantCount).toBe(0);
  });

  it('includes capability orphan over-grants when enabled', () => {
    const withOrphans = buildAllowDenyParityExport(catalog, new Date(), {
      includeCapabilityOrphans: true,
    });
    const withoutOrphans = buildAllowDenyParityExport(catalog, new Date(), {
      includeCapabilityOrphans: false,
    });
    expect(withOrphans.totalDivergences).toBeGreaterThan(withoutOrphans.totalDivergences);
    expect(withOrphans.divergences.some((row) => row.source === 'capability')).toBe(true);
  });

  it('embeds allow/deny parity in coverage report', () => {
    const report = buildAiParityCoverageReport(catalog);
    expect(report.allowDenyParity.totalDivergences).toBeGreaterThan(0);
    expect(report.allowDenyDivergences.length).toBeLessThanOrEqual(
      report.allowDenyParity.totalDivergences,
    );
  });

  it('formats allow/deny parity report for npm run report:ai-allow-deny', () => {
    const exportData = buildAllowDenyParityExport(catalog, new Date(), {
      includeCapabilityOrphans: true,
    });
    const text = formatAllowDenyParityReport(exportData);
    expect(text).toContain('AI Allow/Deny Parity Report (parity-1.6)');
    expect(text).toContain('Over-grant');

    if (process.env.ALLOW_DENY_REPORT === '1') {
      console.log(text);
      console.log('');
      console.log(JSON.stringify(exportData, null, 2));
    }
  });
});
