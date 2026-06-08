import { buildCommandRegistry, buildCompoundCommandRecipes, collectCompoundStepIds } from './ai-command-registry.build.js';
import type { CommandSurface } from './ai-command-registry.types.js';
import { AI_FEATURE_CATALOG, buildAiFeatureCatalog } from './ai-feature-catalog.js';
import { AI_UI_FEATURE_CATALOG } from './ai-feature-catalog.fixtures.js';
import {
  PRODUCT_ROLES,
  ROLE_CAPABILITY_MATRIX_SCENARIOS,
  ROLE_CAPABILITY_RECONCILIATION_FIXTURE,
  ROLE_CAPABILITY_DENY_FIXTURE,
  ROLE_TO_ACCESS_TIER_SCENARIOS,
} from './ai-role-capability-map.fixtures.js';
import type { ProductRole } from './ai-role-capability-map.types.js';
import {
  assertRoleCapabilityReconciliation,
  buildProductRoleCapabilityMap,
  buildRoleCapabilityMapExport,
  findRoleCapabilityReconciliationIssues,
  formatRoleCapabilityMapReport,
  isUiFeatureReachableForRole,
  listDenyBlocksForFeature,
  listStaffScopedCapabilityBindings,
  listStaffScopedIntentsForFeature,
  listUiAiMismatchIssues,
  PRODUCT_ROLE_SURFACES,
  resolveProductRoleAccessTier,
} from './ai-role-capability-map.util.js';

describe('ai-role-capability-map', () => {
  const registry = buildCommandRegistry(
    collectCompoundStepIds(buildCompoundCommandRecipes()),
  );
  const catalog = buildAiFeatureCatalog(registry);

  it.each(ROLE_TO_ACCESS_TIER_SCENARIOS)(
    'maps product role $role to access tier $accessTier',
    ({ role, accessTier }) => {
      expect(resolveProductRoleAccessTier(role)).toBe(accessTier);
    },
  );

  it('builds capability slices for every product role and surface', () => {
    const map = buildProductRoleCapabilityMap(catalog);

    for (const role of PRODUCT_ROLES) {
      expect(map[role].length).toBe(PRODUCT_ROLE_SURFACES[role].length);
      for (const slice of map[role]) {
        expect(slice.role).toBe(role);
        expect(slice.accessTier).toBe(resolveProductRoleAccessTier(role));
        expect(Array.isArray(slice.uiFeatureIds)).toBe(true);
        expect(slice.aiAllowedIntentIds.length).toBeGreaterThan(0);
      }
    }
  });

  it.each(
    ROLE_CAPABILITY_MATRIX_SCENARIOS.filter(
      (row): row is typeof row & { featureId: string; uiReachable: boolean } =>
        'featureId' in row && 'uiReachable' in row,
    ),
  )('ui reachability scenario $id', ({ role, surface, featureId, uiReachable }) => {
    expect(isUiFeatureReachableForRole(catalog, role, surface, featureId)).toBe(
      uiReachable,
    );
  });

  it.each(
    ROLE_CAPABILITY_MATRIX_SCENARIOS.filter(
      (row): row is typeof row & { roleA: ProductRole; roleB: ProductRole; surface: CommandSurface } =>
        'roleA' in row,
    ),
  )('mirror scenario $id', ({ roleA, roleB, surface }) => {
    const map = buildProductRoleCapabilityMap(catalog);
    const sliceA = map[roleA].find((row) => row.surface === surface)!;
    const sliceB = map[roleB].find((row) => row.surface === surface)!;
    expect(sliceA.uiFeatureIds).toEqual(sliceB.uiFeatureIds);
  });

  it.each(
    ROLE_CAPABILITY_MATRIX_SCENARIOS.filter(
      (row): row is typeof row & { featureId: string; intentId: string; expectDenyBlock: boolean } =>
        'expectDenyBlock' in row,
    ),
  )('deny-list reconciliation scenario $id', ({ role, surface, featureId, intentId }) => {
    const accessTier = resolveProductRoleAccessTier(role);
    const catalogSlice = featureId.startsWith('fixture.')
      ? ROLE_CAPABILITY_DENY_FIXTURE
      : catalog;
    const entry = catalogSlice.find((row) => row.id === featureId)!;
    const blocks = listDenyBlocksForFeature(entry, accessTier);
    expect(blocks.some((block) => block.intentId === intentId)).toBe(true);
    const mismatches = listUiAiMismatchIssues(
      findRoleCapabilityReconciliationIssues(catalogSlice),
    );
    expect(
      mismatches.some(
        (issue) =>
          issue.role === role &&
          issue.surface === surface &&
          issue.featureId === featureId &&
          issue.intentId === intentId,
      ),
    ).toBe(true);
  });

  it.each(
    ROLE_CAPABILITY_MATRIX_SCENARIOS.filter(
      (row): row is typeof row & { intentId: string; expectStaffScoped: boolean } =>
        'expectStaffScoped' in row,
    ),
  )('staff-scoped binding scenario $id', ({ role, surface, intentId, expectStaffScoped }) => {
    const accessTier = resolveProductRoleAccessTier(role);
    const map = buildProductRoleCapabilityMap(catalog);
    const slice = map[role].find((row) => row.surface === surface)!;
    expect(slice.staffScopedIntentIds.includes(intentId)).toBe(expectStaffScoped);

    const providerEntry = catalog.find(
      (entry) =>
        entry.surface === 'provider' &&
        entry.intentIds.includes(intentId) &&
        entry.minTier === 'staff',
    )!;
    expect(
      listStaffScopedIntentsForFeature(providerEntry, accessTier).includes(intentId),
    ).toBe(expectStaffScoped);
  });

  it('tracks staff-scoped provider bindings separately from UI/AI mismatches', () => {
    const exportData = buildRoleCapabilityMapExport(catalog);
    expect(exportData.staffScopedBindings.length).toBeGreaterThan(0);
    expect(
      exportData.staffScopedBindings.every((row) => row.kind === 'staff_scope_required'),
    ).toBe(true);
    expect(
      exportData.reconciliationIssues.every((row) => row.kind === 'ui_ai_mismatch'),
    ).toBe(true);
    expect(listStaffScopedCapabilityBindings(catalog).length).toBe(
      exportData.staffScopedBindings.length,
    );
  });

  it('passes reconciliation on a clean fixture catalog', () => {
    expect(() =>
      assertRoleCapabilityReconciliation(ROLE_CAPABILITY_RECONCILIATION_FIXTURE),
    ).not.toThrow();
  });

  it('reports live catalog inventory without failing the gate', () => {
    const exportData = buildRoleCapabilityMapExport(catalog);
    expect(exportData.roles).toEqual(PRODUCT_ROLES);
    expect(formatRoleCapabilityMapReport(exportData)).toContain(
      'AI Role Capability Map (parity-1.2)',
    );
    expect(listUiAiMismatchIssues(exportData.reconciliationIssues).length).toBeGreaterThan(0);

    if (process.env.ROLE_CAPABILITY_REPORT === '1') {
      console.log(formatRoleCapabilityMapReport(exportData));
      console.log('');
      console.log(JSON.stringify(exportData, null, 2));
    }
  });

  it('uses the live feature catalog as the source of truth', () => {
    expect(catalog.length).toBe(AI_FEATURE_CATALOG.length);
    expect(catalog.length).toBeGreaterThan(AI_UI_FEATURE_CATALOG.length);
  });
});
