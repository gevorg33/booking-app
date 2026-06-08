import {
  isDashboardIntentAllowed,
  type AccessTier,
} from './access-control.matrix.js';
import type { CommandRegistryEntry } from './ai-command-registry.types.js';
import type {
  AiFeatureCatalogEntry,
  AiParityCoverageReport,
} from './ai-feature-catalog.types.js';
import {
  buildFeatureCoverageCells,
  formatCoveragePercent,
  roleMeetsCatalogMinTier,
  summarizeRoleSurfaceCoverage,
} from './ai-feature-parity.util.js';

/** parity-2.1 — owner/manager dashboard modules in scope. */
export const PARITY_21_OWNER_MANAGER_MODULES = new Set([
  'ai-command',
  'integrations',
  'billing',
  'schedule-resources',
  'retail-finance',
  'marketing-growth',
  'push-notifications',
]);

export const PARITY_21_OWNER_MANAGER_TIERS: readonly AccessTier[] = [
  'owner',
  'manager',
];

export function listParity21OwnerManagerCatalogEntries(
  catalog: readonly AiFeatureCatalogEntry[],
): AiFeatureCatalogEntry[] {
  return catalog.filter(
    (entry) =>
      entry.surface === 'dashboard' &&
      PARITY_21_OWNER_MANAGER_MODULES.has(entry.module) &&
      (entry.minTier === 'owner' || entry.minTier === 'manager') &&
      entry.extractionSource !== 'registry',
  );
}

export function collectParity21DashboardIntentIds(
  catalog: readonly AiFeatureCatalogEntry[],
): string[] {
  return [
    ...new Set(
      listParity21OwnerManagerCatalogEntries(catalog).flatMap(
        (entry) => entry.intentIds,
      ),
    ),
  ].sort();
}

export interface Parity21OwnerManagerStatus {
  complete: boolean;
  errors: string[];
  ownerDashboardCoverage: number | null;
  managerDashboardCoverage: number | null;
  moduleCoverage: Array<{
    tier: AccessTier;
    covered: number;
    total: number;
    gaps: string[];
  }>;
  registryChecks: number;
}

export function summarizeParity21ModuleCoverage(
  catalog: readonly AiFeatureCatalogEntry[],
  tier: AccessTier,
): { covered: number; total: number; gaps: string[] } {
  const entries = listParity21OwnerManagerCatalogEntries(catalog).filter(
    (entry) => roleMeetsCatalogMinTier(tier, entry.minTier),
  );
  const cells = buildFeatureCoverageCells(catalog, 'dashboard', tier).filter(
    (cell) =>
      PARITY_21_OWNER_MANAGER_MODULES.has(
        catalog.find((row) => row.id === cell.featureId)?.module ?? '',
      ) &&
      entries.some((entry) => entry.id === cell.featureId),
  );
  return {
    covered: cells.filter((cell) => cell.status === 'covered').length,
    total: cells.length,
    gaps: cells.filter((cell) => cell.status === 'gap').map((cell) => cell.featureId),
  };
}

export function assertParity21RegistryIntegrity(
  catalog: readonly AiFeatureCatalogEntry[],
  registry: readonly CommandRegistryEntry[],
): { complete: boolean; errors: string[]; checks: number } {
  const errors: string[] = [];
  const registryById = new Map(registry.map((row) => [row.id, row]));
  let checks = 0;

  for (const intentId of collectParity21DashboardIntentIds(catalog)) {
    checks += 1;
    const entry = registryById.get(intentId);
    if (!entry) {
      errors.push(`intent ${intentId} missing from command registry`);
      continue;
    }
    if (!entry.surfaces.includes('dashboard')) {
      errors.push(
        `${intentId}: registry surfaces [${entry.surfaces.join(', ')}] missing dashboard`,
      );
    }
    if (!entry.handler?.trim()) {
      errors.push(`${intentId}: missing registry handler`);
    }
    if (
      !entry.tiers.includes('owner') &&
      !entry.tiers.includes('manager')
    ) {
      errors.push(
        `${intentId}: registry tiers [${entry.tiers.join(', ')}] missing owner/manager`,
      );
    }
    for (const tier of PARITY_21_OWNER_MANAGER_TIERS) {
      if (
        isDashboardIntentAllowed(tier, intentId) &&
        !entry.tiers.includes(tier)
      ) {
        errors.push(
          `${intentId}: access matrix allows ${tier} but registry tiers omit it`,
        );
      }
    }
    if (entry.mutating && entry.executionMode === 'read_only') {
      errors.push(
        `${intentId}: mutating=true but executionMode=read_only`,
      );
    }
    if (!entry.mutating && entry.executionMode === 'simple_mutate') {
      errors.push(
        `${intentId}: mutating=false but executionMode=simple_mutate`,
      );
    }
  }

  for (const feature of listParity21OwnerManagerCatalogEntries(catalog)) {
    if (feature.intentIds.length !== 1) continue;
    const intentId = feature.intentIds[0]!;
    const entry = registryById.get(intentId);
    if (!entry) continue;
    checks += 1;
    if (feature.actionKind === 'mutate' && !entry.mutating) {
      errors.push(
        `${feature.id}: catalog mutate but ${intentId} registry mutating=false`,
      );
    }
    if (feature.actionKind === 'read' && entry.mutating) {
      errors.push(
        `${feature.id}: catalog read but ${intentId} registry mutating=true`,
      );
    }
    if (feature.actionKind === 'read' && entry.executionMode !== 'read_only') {
      errors.push(
        `${feature.id}: catalog read but ${intentId} executionMode=${entry.executionMode}`,
      );
    }
    if (
      feature.actionKind === 'mutate' &&
      entry.executionMode !== 'simple_mutate' &&
      entry.executionMode !== 'orchestration'
    ) {
      errors.push(
        `${feature.id}: catalog mutate but ${intentId} executionMode=${entry.executionMode}`,
      );
    }
  }

  return { complete: errors.length === 0, errors, checks };
}

export function assertParity21OwnerManagerComplete(
  catalog: readonly AiFeatureCatalogEntry[],
  registry: readonly CommandRegistryEntry[],
  report: AiParityCoverageReport,
): Parity21OwnerManagerStatus {
  const errors: string[] = [];

  for (const tier of PARITY_21_OWNER_MANAGER_TIERS) {
    const row = report.byRoleSurface.find(
      (summary) => summary.tier === tier && summary.surface === 'dashboard',
    );
    const rate = row?.coveragePercent ?? null;
    if (rate == null || rate + 1e-9 < 1) {
      errors.push(
        `${tier}/dashboard coverage ${formatCoveragePercent(rate)} below 100%`,
      );
    }
    if ((row?.gapCount ?? 0) > 0) {
      errors.push(
        `${tier}/dashboard has ${row!.gapCount} gap(s): ${row!.gaps.slice(0, 5).join(', ')}`,
      );
    }
    if ((row?.scopeBugCount ?? 0) > 0) {
      errors.push(
        `${tier}/dashboard has ${row!.scopeBugCount} scope bug(s): ${row!.scopeBugs.slice(0, 5).join(', ')}`,
      );
    }
  }

  const moduleCoverage = PARITY_21_OWNER_MANAGER_TIERS.map((tier) => ({
    tier,
    ...summarizeParity21ModuleCoverage(catalog, tier),
  }));

  for (const row of moduleCoverage) {
    if (row.total > 0 && row.covered < row.total) {
      errors.push(
        `${row.tier} parity-2.1 modules ${row.covered}/${row.total} covered; gaps=${row.gaps.slice(0, 5).join(', ')}`,
      );
    }
  }

  const registryIntegrity = assertParity21RegistryIntegrity(catalog, registry);
  errors.push(...registryIntegrity.errors);

  const ownerRow = report.byRoleSurface.find(
    (row) => row.tier === 'owner' && row.surface === 'dashboard',
  );
  const managerRow = report.byRoleSurface.find(
    (row) => row.tier === 'manager' && row.surface === 'dashboard',
  );

  return {
    complete: errors.length === 0,
    errors: [...new Set(errors)],
    ownerDashboardCoverage: ownerRow?.coveragePercent ?? null,
    managerDashboardCoverage: managerRow?.coveragePercent ?? null,
    moduleCoverage,
    registryChecks: registryIntegrity.checks,
  };
}

export function formatParity21OwnerManagerReport(
  status: Parity21OwnerManagerStatus,
): string {
  const lines = [
    'AI Feature Parity Owner/Manager Dashboard (parity-2.1)',
    `Status: ${status.complete ? 'PASS' : 'FAIL'}`,
    `Owner dashboard coverage: ${formatCoveragePercent(status.ownerDashboardCoverage)}`,
    `Manager dashboard coverage: ${formatCoveragePercent(status.managerDashboardCoverage)}`,
    `Registry integrity checks: ${status.registryChecks}`,
    '',
    'Module-scoped coverage:',
  ];
  for (const row of status.moduleCoverage) {
    lines.push(
      `  ${row.tier.padEnd(7)} ${row.covered}/${row.total} covered`,
    );
  }
  if (status.errors.length > 0) {
    lines.push('', 'Issues:');
    for (const error of status.errors) lines.push(`  - ${error}`);
  }
  return lines.join('\n');
}

/** Test helper — module-scoped dashboard summary for one tier. */
export function buildParity21DashboardSummary(
  catalog: readonly AiFeatureCatalogEntry[],
  tier: AccessTier,
) {
  const cells = buildFeatureCoverageCells(catalog, 'dashboard', tier).filter(
    (cell) =>
      listParity21OwnerManagerCatalogEntries(catalog).some(
        (entry) => entry.id === cell.featureId,
      ),
  );
  return summarizeRoleSurfaceCoverage(cells, 'dashboard', tier);
}
