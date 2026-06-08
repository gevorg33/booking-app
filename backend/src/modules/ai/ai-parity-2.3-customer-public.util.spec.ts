import { buildCommandRegistry, buildCompoundCommandRecipes, collectCompoundStepIds } from './ai-command-registry.build.js';
import { buildAiFeatureCatalog } from './ai-feature-catalog.js';
import {
  assertParity23CustomerPublicComplete,
  formatParity23CustomerPublicReport,
  listParity23CustomerCatalogEntries,
  listParity23PublicCatalogEntries,
  PARITY_23_CUSTOMER_SELF_SERVICE_FEATURE_IDS,
  PARITY_23_PUBLIC_SELF_SERVICE_FEATURE_IDS,
} from './ai-parity-2.3-customer-public.util.js';
import { buildAiParityCoverageReport } from './ai-feature-parity.util.js';

describe('ai-parity-2.3-customer-public (parity-2.3)', () => {
  const registry = buildCommandRegistry(
    collectCompoundStepIds(buildCompoundCommandRecipes()),
  );
  const catalog = buildAiFeatureCatalog(registry);
  const report = buildAiParityCoverageReport(catalog);

  it('lists customer/public self-service catalog features', () => {
    expect(listParity23CustomerCatalogEntries(catalog).length).toBe(
      PARITY_23_CUSTOMER_SELF_SERVICE_FEATURE_IDS.length,
    );
    expect(listParity23PublicCatalogEntries(catalog).length).toBe(
      PARITY_23_PUBLIC_SELF_SERVICE_FEATURE_IDS.length,
    );
  });

  it('passes client customer/public coverage + registry gate', () => {
    const status = assertParity23CustomerPublicComplete(catalog, registry, report);
    if (!status.complete) {
      console.log(formatParity23CustomerPublicReport(status));
    }
    expect(status.complete).toBe(true);
    expect(status.clientCustomerCoverage).toBe(1);
    expect(status.clientPublicCoverage).toBe(1);
  });

  it('formats parity-2.3 customer/public report', () => {
    const status = assertParity23CustomerPublicComplete(catalog, registry, report);
    const text = formatParity23CustomerPublicReport(status);
    expect(text).toContain(
      'AI Feature Parity Customer/Public Self-Service (parity-2.3)',
    );
    if (process.env.PARITY_23_REPORT === '1') {
      console.log(text);
    }
  });
});
