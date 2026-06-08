import { buildCommandRegistry, buildCompoundCommandRecipes, collectCompoundStepIds } from './ai-command-registry.build.js';
import { buildAiFeatureCatalog } from './ai-feature-catalog.js';
import { AI_UI_FEATURE_CATALOG } from './ai-feature-catalog.fixtures.js';
import {
  FEATURE_INTENT_MAP_FIXTURE_CATALOG,
  FEATURE_INTENT_MAP_LIVE_SAMPLES,
  FEATURE_INTENT_MAP_SCENARIOS,
} from './ai-feature-intent-map.fixtures.js';
import {
  assertFeatureIntentRegistryLinks,
  buildFeatureIntentMap,
  buildFeatureIntentMapEntry,
  buildFeatureIntentMapExport,
  classifyFeatureIntentAtTier,
  findUnknownCatalogIntentRefs,
  formatFeatureIntentMapReport,
  listFeatureIntentGaps,
  listFeatureIntentScopeBugs,
} from './ai-feature-intent-map.util.js';

describe('ai-feature-intent-map (parity-1.4)', () => {
  const registry = buildCommandRegistry(
    collectCompoundStepIds(buildCompoundCommandRecipes()),
  );
  const catalog = buildAiFeatureCatalog(registry);

  it.each(
    FEATURE_INTENT_MAP_SCENARIOS.filter(
      (row): row is typeof row & { expectedStatus: 'gap' | 'scope_bug' | 'covered' } =>
        'expectedStatus' in row,
    ),
  )('fixture scenario $id', ({ featureId, expectedStatus, gap, scopeBug }) => {
    const entry = FEATURE_INTENT_MAP_FIXTURE_CATALOG.find((row) => row.id === featureId)!;
    const mapped = buildFeatureIntentMapEntry(entry, registry);
    expect(mapped.status).toBe(expectedStatus);
    expect(mapped.gap).toBe(gap);
    expect(mapped.scopeBug).toBe(scopeBug);
  });

  it('flags unknown registry intents as scope bugs and gate failures', () => {
    const unknown = findUnknownCatalogIntentRefs(FEATURE_INTENT_MAP_FIXTURE_CATALOG, registry);
    expect(unknown.some((row) => row.intentId === 'not_a_real_intent')).toBe(true);
    expect(() =>
      assertFeatureIntentRegistryLinks(FEATURE_INTENT_MAP_FIXTURE_CATALOG, registry),
    ).toThrow(/Feature intent registry links failed/);
  });

  it('maps every UI catalog row to registry intents', () => {
    const map = buildFeatureIntentMap(catalog, registry);
    expect(map.length).toBe(AI_UI_FEATURE_CATALOG.length);
    expect(map.every((row) => row.featureId.startsWith('dashboard.') || row.featureId.startsWith('provider.') || row.featureId.startsWith('customer.') || row.featureId.startsWith('public.'))).toBe(true);
  });

  it('classifies live catalog gaps and scope bugs at minTier', () => {
    const exportData = buildFeatureIntentMapExport(catalog, registry);
    expect(exportData.entries.find((row) => row.featureId === FEATURE_INTENT_MAP_LIVE_SAMPLES.billingCovered)?.status).toBe('covered');
    expect(exportData.entries.find((row) => row.featureId === FEATURE_INTENT_MAP_LIVE_SAMPLES.customerBook)?.status).toBe('covered');
    expect(exportData.entries.find((row) => row.featureId === FEATURE_INTENT_MAP_LIVE_SAMPLES.staffCustomersCovered)?.status).toBe('covered');
    expect(listFeatureIntentGaps(exportData.entries).length).toBe(0);
    expect(listFeatureIntentScopeBugs(exportData.entries).length).toBe(0);
    expect(exportData.unknownIntentRefs.length).toBe(0);
  });

  it('evaluates higher tiers using UI reachability rules', () => {
    const billing = catalog.find((row) => row.id === FEATURE_INTENT_MAP_LIVE_SAMPLES.billingCovered)!;
    expect(classifyFeatureIntentAtTier(billing, 'staff', registry)).toBe('covered');
    expect(classifyFeatureIntentAtTier(billing, 'owner', registry)).toBe('covered');
  });

  it('reports feature intent inventory for CLI output', () => {
    const exportData = buildFeatureIntentMapExport(catalog, registry);
    const report = formatFeatureIntentMapReport(exportData);
    expect(report).toContain('AI Feature Intent Map (parity-1.4)');
    expect(report).toContain('Covered:');

    if (process.env.INTENT_MAP_REPORT === '1') {
      console.log(report);
      console.log('');
      console.log(JSON.stringify(exportData, null, 2));
    }
  });
});
