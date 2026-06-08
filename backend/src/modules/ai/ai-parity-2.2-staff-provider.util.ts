import {
  isDashboardIntentAllowed,
  isProviderIntentAllowed,
  STAFF_SCOPED_INTENTS,
  type AccessTier,
} from './access-control.matrix.js';
import type { CommandRegistryEntry, CommandSurface } from './ai-command-registry.types.js';
import type {
  AiFeatureCatalogEntry,
  AiParityCoverageReport,
} from './ai-feature-catalog.types.js';
import {
  assertStaffScopedIntentRegistered,
  STAFF_SCOPE_INTENT_IDS,
} from './ai-provider-staff-scope.util.js';
import {
  formatCoveragePercent,
  roleMeetsCatalogMinTier,
} from './ai-feature-parity.util.js';

/** parity-2.2 — staff-scoped provider + dashboard feature ids. */
export const PARITY_22_STAFF_SCOPE_FEATURE_IDS = [
  'provider.action.list_assigned',
  'provider.action.check_in',
  'provider.action.update_notes',
  'provider.action.whos_next',
  'provider.action.lunch_break',
  'dashboard.action.assigned_bookings',
  'dashboard.action.view_own_schedule',
  'dashboard.action.check_in_assigned',
  'dashboard.action.update_assigned_notes',
  'dashboard.action.block_own_break',
] as const;

export const PARITY_22_STAFF_TIER: AccessTier = 'staff';

export function listParity22StaffScopeCatalogEntries(
  catalog: readonly AiFeatureCatalogEntry[],
): AiFeatureCatalogEntry[] {
  return catalog.filter((entry) =>
    (PARITY_22_STAFF_SCOPE_FEATURE_IDS as readonly string[]).includes(entry.id),
  );
}

export interface Parity22StaffProviderStatus {
  complete: boolean;
  errors: string[];
  staffDashboardCoverage: number | null;
  staffProviderCoverage: number | null;
  staffScopedRegistryChecks: number;
}

export function assertParity22StaffScopedRegistry(
  catalog: readonly AiFeatureCatalogEntry[],
  registry: readonly CommandRegistryEntry[],
): { complete: boolean; errors: string[]; checks: number } {
  const errors: string[] = [];
  let checks = 0;
  const registryById = new Map(registry.map((row) => [row.id, row]));
  const intentIds = [
    ...new Set(listParity22StaffScopeCatalogEntries(catalog).flatMap((e) => e.intentIds)),
  ];

  for (const intentId of intentIds) {
    checks += 1;
    if (!assertStaffScopedIntentRegistered(intentId)) {
      errors.push(`${intentId} must be listed in STAFF_SCOPED_INTENTS`);
    }
    const entry = registryById.get(intentId);
    if (!entry) {
      errors.push(`intent ${intentId} missing from command registry`);
      continue;
    }
    if (!entry.tiers.includes('staff')) {
      errors.push(`${intentId}: registry tiers missing staff`);
    }
    for (const surface of ['dashboard', 'provider'] as CommandSurface[]) {
      const catalogUsesSurface = listParity22StaffScopeCatalogEntries(catalog).some(
        (row) => row.surface === surface && row.intentIds.includes(intentId),
      );
      if (!catalogUsesSurface) continue;
      if (!entry.surfaces.includes(surface)) {
        errors.push(`${intentId}: registry missing surface ${surface}`);
      }
      const allowed =
        surface === 'dashboard'
          ? isDashboardIntentAllowed('staff', intentId)
          : isProviderIntentAllowed('staff', intentId);
      if (!allowed) {
        errors.push(`${intentId}: staff denied on ${surface} access matrix`);
      }
      const handler =
        surface === 'provider'
          ? (entry.surfaceHandlers?.provider ?? entry.handler)
          : entry.handler;
      if (!handler?.trim()) {
        errors.push(`${intentId}: missing handler for ${surface}`);
      }
    }
  }

  for (const intentId of STAFF_SCOPE_INTENT_IDS) {
    checks += 1;
    if (!STAFF_SCOPED_INTENTS.has(intentId)) {
      errors.push(`STAFF_SCOPE intent ${intentId} missing from STAFF_SCOPED_INTENTS`);
    }
  }

  return { complete: errors.length === 0, errors, checks };
}

export function assertParity22StaffProviderComplete(
  catalog: readonly AiFeatureCatalogEntry[],
  registry: readonly CommandRegistryEntry[],
  report: AiParityCoverageReport,
): Parity22StaffProviderStatus {
  const errors: string[] = [];

  for (const surface of ['dashboard', 'provider'] as CommandSurface[]) {
    const row = report.byRoleSurface.find(
      (summary) => summary.tier === 'staff' && summary.surface === surface,
    );
    const rate = row?.coveragePercent ?? null;
    if (rate == null || rate + 1e-9 < 1) {
      errors.push(
        `staff/${surface} coverage ${formatCoveragePercent(rate)} below 100%`,
      );
    }
    if ((row?.gapCount ?? 0) > 0) {
      errors.push(
        `staff/${surface} gaps: ${row!.gaps.slice(0, 5).join(', ')}`,
      );
    }
    if ((row?.scopeBugCount ?? 0) > 0) {
      errors.push(
        `staff/${surface} scope bugs: ${row!.scopeBugs.slice(0, 5).join(', ')}`,
      );
    }
  }

  for (const feature of listParity22StaffScopeCatalogEntries(catalog)) {
    if (!roleMeetsCatalogMinTier('staff', feature.minTier)) {
      errors.push(`${feature.id}: staff cannot reach minTier ${feature.minTier}`);
    }
    for (const intentId of feature.intentIds) {
      if (!STAFF_SCOPED_INTENTS.has(intentId)) {
        errors.push(
          `${feature.id}: intent ${intentId} must be staff-scoped (STAFF_SCOPED_INTENTS)`,
        );
      }
    }
  }

  const registryIntegrity = assertParity22StaffScopedRegistry(catalog, registry);
  errors.push(...registryIntegrity.errors);

  const staffDashboard = report.byRoleSurface.find(
    (row) => row.tier === 'staff' && row.surface === 'dashboard',
  );
  const staffProvider = report.byRoleSurface.find(
    (row) => row.tier === 'staff' && row.surface === 'provider',
  );

  return {
    complete: errors.length === 0,
    errors: [...new Set(errors)],
    staffDashboardCoverage: staffDashboard?.coveragePercent ?? null,
    staffProviderCoverage: staffProvider?.coveragePercent ?? null,
    staffScopedRegistryChecks: registryIntegrity.checks,
  };
}

export function formatParity22StaffProviderReport(
  status: Parity22StaffProviderStatus,
): string {
  const lines = [
    'AI Feature Parity Staff/Provider (parity-2.2)',
    `Status: ${status.complete ? 'PASS' : 'FAIL'}`,
    `Staff dashboard coverage: ${formatCoveragePercent(status.staffDashboardCoverage)}`,
    `Staff provider coverage: ${formatCoveragePercent(status.staffProviderCoverage)}`,
    `Staff-scoped registry checks: ${status.staffScopedRegistryChecks}`,
  ];
  if (status.errors.length > 0) {
    lines.push('', 'Issues:');
    for (const error of status.errors) lines.push(`  - ${error}`);
  }
  return lines.join('\n');
}
