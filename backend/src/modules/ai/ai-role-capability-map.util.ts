import {
  DASHBOARD_DENIED_BY_TIER,
  PROVIDER_DENIED_BY_TIER,
  type AccessTier,
  resolveAccessTier,
  STAFF_SCOPED_INTENTS,
} from './access-control.matrix.js';
import type { CommandSurface } from './ai-command-registry.types.js';
import { getAllowedIntents, type AiSurface } from './ai-capability.matrix.js';
import type { AiFeatureCatalogEntry } from './ai-feature-catalog.types.js';
import {
  isIntentAllowedForTier,
  listUiAccessibleCatalogEntries,
  roleMeetsCatalogMinTier,
} from './ai-feature-parity.util.js';
import type {
  ProductRole,
  RoleCapabilityDenyBlock,
  RoleCapabilityMapExport,
  RoleCapabilityReconciliationIssue,
  RoleCapabilitySurfaceSlice,
} from './ai-role-capability-map.types.js';
import { PRODUCT_ROLES } from './ai-role-capability-map.fixtures.js';

export type {
  ProductRole,
  RoleCapabilityDenyBlock,
  RoleCapabilityMapExport,
  RoleCapabilityReconciliationIssue,
  RoleCapabilitySurfaceSlice,
} from './ai-role-capability-map.types.js';

export {
  PRODUCT_ROLES,
  ROLE_CAPABILITY_MATRIX_SCENARIOS,
  ROLE_TO_ACCESS_TIER_SCENARIOS,
} from './ai-role-capability-map.fixtures.js';

/** Surfaces each product role actually uses in the product UI. */
export const PRODUCT_ROLE_SURFACES: Record<ProductRole, readonly CommandSurface[]> = {
  owner: ['dashboard', 'provider'],
  admin: ['dashboard', 'provider'],
  manager: ['dashboard', 'provider'],
  staff: ['dashboard', 'provider'],
  contributor: ['dashboard', 'provider'],
  client: ['customer', 'public'],
};

/** Map product role labels to access-control tier (admin→owner, contributor→staff). */
export function resolveProductRoleAccessTier(role: ProductRole): AccessTier {
  switch (role) {
    case 'admin':
      return resolveAccessTier('admin');
    case 'contributor':
      return resolveAccessTier('contributor');
    case 'owner':
    case 'manager':
    case 'staff':
    case 'client':
      return resolveAccessTier(role);
    default:
      return 'client';
  }
}

export function resolveMembershipRoleForProductRole(role: ProductRole): string {
  return role;
}

function toAiSurface(surface: CommandSurface): AiSurface {
  return surface;
}

function classifyDenyBlock(
  surface: CommandSurface,
  accessTier: AccessTier,
  intentId: string,
): RoleCapabilityDenyBlock['reason'] | null {
  if (surface === 'dashboard' && DASHBOARD_DENIED_BY_TIER[accessTier].has(intentId)) {
    return 'dashboard_denied';
  }
  if (surface === 'provider' && PROVIDER_DENIED_BY_TIER[accessTier].has(intentId)) {
    return 'provider_denied';
  }
  if (
    (surface === 'customer' || surface === 'public') &&
    accessTier !== 'client'
  ) {
    return 'customer_tier';
  }
  return null;
}

/** parity-1.2 — intents denied by access-control.matrix for role/surface. */
export function listDenyBlocksForFeature(
  entry: AiFeatureCatalogEntry,
  accessTier: AccessTier,
): RoleCapabilityDenyBlock[] {
  const blocks: RoleCapabilityDenyBlock[] = [];
  for (const intentId of entry.intentIds) {
    const reason = classifyDenyBlock(entry.surface, accessTier, intentId);
    if (reason) {
      blocks.push({ featureId: entry.id, intentId, reason });
    }
  }
  return blocks;
}

/** parity-1.2 — staff-scoped intents referenced by a UI feature on provider surface. */
export function listStaffScopedIntentsForFeature(
  entry: AiFeatureCatalogEntry,
  accessTier: AccessTier,
): string[] {
  if (entry.surface !== 'provider' || accessTier !== 'staff') return [];
  return entry.intentIds.filter((intentId) => STAFF_SCOPED_INTENTS.has(intentId));
}

/** parity-1.2 — one role × surface slice of the capability map. */
export function buildRoleCapabilitySurfaceSlice(
  catalog: readonly AiFeatureCatalogEntry[],
  role: ProductRole,
  surface: CommandSurface,
): RoleCapabilitySurfaceSlice {
  const accessTier = resolveProductRoleAccessTier(role);
  const entries = listUiAccessibleCatalogEntries(catalog, surface, accessTier);
  const aiAllowedIntentIds = getAllowedIntents(toAiSurface(surface), accessTier);

  const denyListBlocked: RoleCapabilityDenyBlock[] = [];
  const staffScopedIntentIds = new Set<string>();

  for (const entry of entries) {
    denyListBlocked.push(...listDenyBlocksForFeature(entry, accessTier));
    for (const intentId of listStaffScopedIntentsForFeature(entry, accessTier)) {
      staffScopedIntentIds.add(intentId);
    }
  }

  return {
    role,
    accessTier,
    surface,
    uiFeatureIds: entries.map((entry) => entry.id),
    aiAllowedIntentIds,
    staffScopedIntentIds: [...staffScopedIntentIds].sort(),
    denyListBlocked,
  };
}

/** parity-1.2 — full capability map for all product roles. */
export function buildProductRoleCapabilityMap(
  catalog: readonly AiFeatureCatalogEntry[],
): Record<ProductRole, readonly RoleCapabilitySurfaceSlice[]> {
  const map = {} as Record<ProductRole, RoleCapabilitySurfaceSlice[]>;

  for (const role of PRODUCT_ROLES) {
    map[role] = PRODUCT_ROLE_SURFACES[role].map((surface) =>
      buildRoleCapabilitySurfaceSlice(catalog, role, surface),
    );
  }

  return map;
}

/** Legacy access-tier map (re-exported shape for parity-1 matrix). */
export function buildRoleCapabilityMap(
  catalog: readonly AiFeatureCatalogEntry[],
): Record<AccessTier, Record<CommandSurface, readonly string[]>> {
  const tiers: AccessTier[] = ['client', 'staff', 'manager', 'owner'];
  const surfaces: CommandSurface[] = ['dashboard', 'provider', 'customer', 'public'];
  const map = {} as Record<AccessTier, Record<CommandSurface, string[]>>;

  for (const tier of tiers) {
    map[tier] = { dashboard: [], provider: [], customer: [], public: [] };
    for (const surface of surfaces) {
      map[tier][surface] = listUiAccessibleCatalogEntries(catalog, surface, tier).map(
        (entry) => entry.id,
      );
    }
  }

  return map;
}

/** parity-1.2 — staff-scoped intent bindings on provider features (informational, not defects). */
export function listStaffScopedCapabilityBindings(
  catalog: readonly AiFeatureCatalogEntry[],
): RoleCapabilityReconciliationIssue[] {
  const bindings: RoleCapabilityReconciliationIssue[] = [];

  for (const role of ['staff', 'contributor'] as const) {
    const accessTier = resolveProductRoleAccessTier(role);
    for (const entry of listUiAccessibleCatalogEntries(catalog, 'provider', accessTier)) {
      for (const intentId of listStaffScopedIntentsForFeature(entry, accessTier)) {
        bindings.push({
          role,
          accessTier,
          surface: 'provider',
          featureId: entry.id,
          intentId,
          kind: 'staff_scope_required',
          detail: `Provider feature ${entry.id} uses staff-scoped intent ${intentId}`,
        });
      }
    }
  }

  return bindings;
}

/** parity-1.2 — UI reachable but mapped intent blocked by deny-list (Sprint 56 backlog when non-zero). */
export function findRoleCapabilityReconciliationIssues(
  catalog: readonly AiFeatureCatalogEntry[],
): RoleCapabilityReconciliationIssue[] {
  const issues: RoleCapabilityReconciliationIssue[] = [];

  for (const role of PRODUCT_ROLES) {
    const accessTier = resolveProductRoleAccessTier(role);

    for (const surface of PRODUCT_ROLE_SURFACES[role]) {
      const entries = listUiAccessibleCatalogEntries(catalog, surface, accessTier);

      for (const entry of entries) {
        for (const intentId of entry.intentIds) {
          const denyReason = classifyDenyBlock(surface, accessTier, intentId);
          if (denyReason) {
            issues.push({
              role,
              accessTier,
              surface,
              featureId: entry.id,
              intentId,
              kind: 'ui_ai_mismatch',
              detail: `UI feature ${entry.id} maps ${intentId} but ${denyReason} blocks ${accessTier} on ${surface}`,
            });
          } else if (!isIntentAllowedForTier(surface, accessTier, intentId)) {
            issues.push({
              role,
              accessTier,
              surface,
              featureId: entry.id,
              intentId,
              kind: 'ui_ai_mismatch',
              detail: `UI feature ${entry.id} maps ${intentId} but AI denies ${accessTier} on ${surface}`,
            });
          }
        }
      }
    }
  }

  return issues.sort((a, b) =>
    `${a.role}.${a.surface}.${a.featureId}`.localeCompare(
      `${b.role}.${b.surface}.${b.featureId}`,
    ),
  );
}

export function listUiAiMismatchIssues(
  issues: readonly RoleCapabilityReconciliationIssue[],
): RoleCapabilityReconciliationIssue[] {
  return issues.filter((issue) => issue.kind === 'ui_ai_mismatch');
}

export function listStaffScopeRequiredIssues(
  issues: readonly RoleCapabilityReconciliationIssue[],
): RoleCapabilityReconciliationIssue[] {
  return issues.filter((issue) => issue.kind === 'staff_scope_required');
}

/** parity-1.2 — export for reports and CI gates. */
export function buildRoleCapabilityMapExport(
  catalog: readonly AiFeatureCatalogEntry[],
  now = new Date(),
): RoleCapabilityMapExport {
  return {
    generatedAt: now.toISOString(),
    roles: PRODUCT_ROLES,
    byRole: buildProductRoleCapabilityMap(catalog),
    reconciliationIssues: findRoleCapabilityReconciliationIssues(catalog),
    staffScopedBindings: listStaffScopedCapabilityBindings(catalog),
  };
}

export function formatRoleCapabilityMapReport(exportData: RoleCapabilityMapExport): string {
  const lines: string[] = [
    'AI Role Capability Map (parity-1.2)',
    `Generated: ${exportData.generatedAt}`,
    '',
  ];

  for (const role of exportData.roles) {
    lines.push(`${role}:`);
    for (const slice of exportData.byRole[role]) {
      lines.push(
        `  ${slice.surface.padEnd(9)} ui=${slice.uiFeatureIds.length} aiIntents=${slice.aiAllowedIntentIds.length} staffScoped=${slice.staffScopedIntentIds.length} denyBlocks=${slice.denyListBlocked.length}`,
      );
    }
    lines.push('');
  }

  const mismatches = listUiAiMismatchIssues(exportData.reconciliationIssues);
  lines.push(`UI/AI mismatches: ${mismatches.length}`);
  for (const issue of mismatches.slice(0, 15)) {
    lines.push(`  - [${issue.role}/${issue.surface}] ${issue.featureId} → ${issue.intentId}`);
  }

  const staffScope = exportData.staffScopedBindings;
  lines.push(`Staff-scoped intent bindings: ${staffScope.length}`);

  return lines.join('\n');
}

/** parity-1.2 gate — catalog intent maps must not under-grant vs UI minTier + deny lists. */
export function assertRoleCapabilityReconciliation(
  catalog: readonly AiFeatureCatalogEntry[],
): void {
  const mismatches = listUiAiMismatchIssues(findRoleCapabilityReconciliationIssues(catalog));
  if (mismatches.length === 0) return;

  const sample = mismatches
    .slice(0, 5)
    .map((issue) => `${issue.role}/${issue.surface} ${issue.featureId}:${issue.intentId}`)
    .join('; ');
  throw new Error(
    `Role capability reconciliation failed — ${mismatches.length} UI/AI mismatch(es): ${sample}`,
  );
}

export function isUiFeatureReachableForRole(
  catalog: readonly AiFeatureCatalogEntry[],
  role: ProductRole,
  surface: CommandSurface,
  featureId: string,
): boolean {
  const accessTier = resolveProductRoleAccessTier(role);
  return listUiAccessibleCatalogEntries(catalog, surface, accessTier).some(
    (entry) => entry.id === featureId,
  );
}

export function roleMeetsFeatureMinTier(
  role: ProductRole,
  entry: AiFeatureCatalogEntry,
): boolean {
  return roleMeetsCatalogMinTier(resolveProductRoleAccessTier(role), entry.minTier);
}
