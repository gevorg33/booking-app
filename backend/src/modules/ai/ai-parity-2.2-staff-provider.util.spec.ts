import { buildCommandRegistry, buildCompoundCommandRecipes, collectCompoundStepIds } from './ai-command-registry.build.js';
import { buildAiFeatureCatalog } from './ai-feature-catalog.js';
import {
  assertParity22StaffProviderComplete,
  formatParity22StaffProviderReport,
  listParity22StaffScopeCatalogEntries,
  PARITY_22_STAFF_SCOPE_FEATURE_IDS,
} from './ai-parity-2.2-staff-provider.util.js';
import { buildAiParityCoverageReport } from './ai-feature-parity.util.js';
import { STAFF_SCOPED_INTENTS } from './access-control.matrix.js';

describe('ai-parity-2.2-staff-provider (parity-2.2)', () => {
  const registry = buildCommandRegistry(
    collectCompoundStepIds(buildCompoundCommandRecipes()),
  );
  const catalog = buildAiFeatureCatalog(registry);
  const report = buildAiParityCoverageReport(catalog);

  it('lists staff-scoped provider/dashboard features', () => {
    const entries = listParity22StaffScopeCatalogEntries(catalog);
    expect(entries.length).toBe(PARITY_22_STAFF_SCOPE_FEATURE_IDS.length);
    for (const feature of entries) {
      for (const intentId of feature.intentIds) {
        expect(STAFF_SCOPED_INTENTS.has(intentId)).toBe(true);
      }
    }
  });

  it('passes staff/provider coverage + staff-scoped registry gate', () => {
    const status = assertParity22StaffProviderComplete(catalog, registry, report);
    if (!status.complete) {
      console.log(formatParity22StaffProviderReport(status));
    }
    expect(status.complete).toBe(true);
    expect(status.staffDashboardCoverage).toBe(1);
    expect(status.staffProviderCoverage).toBe(1);
  });

  it('formats parity-2.2 staff/provider report', () => {
    const status = assertParity22StaffProviderComplete(catalog, registry, report);
    const text = formatParity22StaffProviderReport(status);
    expect(text).toContain('AI Feature Parity Staff/Provider (parity-2.2)');
    if (process.env.PARITY_22_REPORT === '1') {
      console.log(text);
    }
  });
});
