import { buildCommandRegistry, buildCompoundCommandRecipes, collectCompoundStepIds } from './ai-command-registry.build.js';
import { buildAiFeatureCatalog } from './ai-feature-catalog.js';
import {
  assertParity21OwnerManagerComplete,
  collectParity21DashboardIntentIds,
  formatParity21OwnerManagerReport,
  listParity21OwnerManagerCatalogEntries,
  PARITY_21_OWNER_MANAGER_MODULES,
} from './ai-parity-2.1-owner-manager.util.js';
import { buildAiParityCoverageReport } from './ai-feature-parity.util.js';

describe('ai-parity-2.1-owner-manager (parity-2.1)', () => {
  const registry = buildCommandRegistry(
    collectCompoundStepIds(buildCompoundCommandRecipes()),
  );
  const catalog = buildAiFeatureCatalog(registry);
  const report = buildAiParityCoverageReport(catalog);

  it('lists owner/manager dashboard modules in scope', () => {
    const entries = listParity21OwnerManagerCatalogEntries(catalog);
    expect(entries.length).toBeGreaterThan(10);
    expect(
      entries.every((entry) => PARITY_21_OWNER_MANAGER_MODULES.has(entry.module)),
    ).toBe(true);
    expect(collectParity21DashboardIntentIds(catalog)).toContain('list_reviews');
    expect(collectParity21DashboardIntentIds(catalog)).toContain(
      'update_team_member_role',
    );
  });

  it('passes owner/manager dashboard coverage + registry integrity gate', () => {
    const status = assertParity21OwnerManagerComplete(catalog, registry, report);
    if (!status.complete) {
      console.log(formatParity21OwnerManagerReport(status));
    }
    expect(status.complete).toBe(true);
    expect(status.ownerDashboardCoverage).toBe(1);
    expect(status.managerDashboardCoverage).toBe(1);
    expect(status.registryChecks).toBeGreaterThan(20);
  });

  it('formats parity-2.1 owner/manager report', () => {
    const status = assertParity21OwnerManagerComplete(catalog, registry, report);
    const text = formatParity21OwnerManagerReport(status);
    expect(text).toContain('AI Feature Parity Owner/Manager Dashboard (parity-2.1)');
    if (process.env.PARITY_21_REPORT === '1') {
      console.log(text);
    }
  });
});
