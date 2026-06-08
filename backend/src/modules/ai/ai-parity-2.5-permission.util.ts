import {
  type AccessTier,
  isCustomerIntentAllowed,
  isDashboardIntentAllowed,
  isProviderIntentAllowed,
  isPublicIntentAllowed,
} from './access-control.matrix.js';
import {
  getAllowedIntents,
  isIntentAllowed,
  type AiSurface,
} from './ai-capability.matrix.js';
import {
  CUSTOMER_INTENTS,
  DASHBOARD_INTENTS,
  PROVIDER_INTENTS,
  PUBLIC_INTENTS,
} from './ai-command-registry.build.js';
import type {
  CommandRegistryEntry,
  CommandSurface,
} from './ai-command-registry.types.js';
import {
  PERMISSION_META_INTENTS,
  type IntentPermissionCase,
  type PermissionExpectation,
} from './ai-parity-2.5-permission.fixtures.js';

export {
  expectedRuntimeDeniedAction,
  PERMISSION_META_INTENTS,
  PERMISSION_PROBE_SCENARIOS,
  type IntentPermissionCase,
  type PermissionCaseKind,
  type PermissionExpectation,
} from './ai-parity-2.5-permission.fixtures.js';

export const ALL_ACCESS_TIERS: readonly AccessTier[] = [
  'client',
  'staff',
  'manager',
  'owner',
];

export const ALL_COMMAND_SURFACES: readonly CommandSurface[] = [
  'dashboard',
  'provider',
  'customer',
  'public',
];

const OPS_ACCESS_TIERS: readonly AccessTier[] = ['staff', 'manager', 'owner'];

/** Customer gateway unions public intents for logged-in clients (ai-cmd-0.5). */
const CUSTOMER_SURFACE_INTENT_UNION = [
  ...new Set([...CUSTOMER_INTENTS, ...PUBLIC_INTENTS]),
] as const;

const SURFACE_INTENT_LISTS: Record<CommandSurface, readonly string[]> = {
  dashboard: DASHBOARD_INTENTS,
  provider: PROVIDER_INTENTS,
  customer: CUSTOMER_SURFACE_INTENT_UNION,
  public: PUBLIC_INTENTS,
};

function isMetaIntent(intentId: string): boolean {
  return (PERMISSION_META_INTENTS as readonly string[]).includes(intentId);
}

function isIntentExposedOnSurface(
  intentId: string,
  surface: CommandSurface,
  registeredSurfaces: readonly CommandSurface[],
): boolean {
  if (registeredSurfaces.includes(surface)) return true;
  // ai-cmd-0.5 — logged-in customer assistant reuses anonymous public intents.
  if (
    surface === 'customer' &&
    registeredSurfaces.includes('public') &&
    PUBLIC_INTENTS.includes(intentId)
  ) {
    return true;
  }
  return false;
}

/** Mirrors tiersForSurface in ai-command-registry.build.ts — single source for permission tests. */
export function resolveAllowedTiersOnSurface(
  intentId: string,
  surface: CommandSurface,
): AccessTier[] {
  if (isMetaIntent(intentId)) return [...ALL_ACCESS_TIERS];
  if (surface === 'dashboard') {
    return OPS_ACCESS_TIERS.filter((tier) =>
      isDashboardIntentAllowed(tier, intentId),
    );
  }
  if (surface === 'provider') {
    return OPS_ACCESS_TIERS.filter((tier) =>
      isProviderIntentAllowed(tier, intentId),
    );
  }
  if (surface === 'customer') {
    return ALL_ACCESS_TIERS.filter((tier) =>
      isCustomerIntentAllowed(tier, intentId),
    );
  }
  return ALL_ACCESS_TIERS.filter((tier) =>
    isPublicIntentAllowed(tier, intentId),
  );
}

function permissionCaseId(
  intentId: string,
  surface: CommandSurface,
  tier: AccessTier,
  kind: IntentPermissionCase['kind'],
): string {
  return `${kind}:${surface}:${tier}:${intentId}`;
}

export function buildIntentPermissionCases(
  registry: readonly CommandRegistryEntry[],
): IntentPermissionCase[] {
  const cases: IntentPermissionCase[] = [];

  for (const entry of registry) {
    for (const surface of ALL_COMMAND_SURFACES) {
      const onSurface = isIntentExposedOnSurface(
        entry.id,
        surface,
        entry.surfaces,
      );
      const allowedTiers = onSurface
        ? new Set(resolveAllowedTiersOnSurface(entry.id, surface))
        : new Set<AccessTier>();

      for (const tier of ALL_ACCESS_TIERS) {
        if (isMetaIntent(entry.id)) {
          cases.push({
            id: permissionCaseId(entry.id, surface, tier, 'meta'),
            intentId: entry.id,
            surface,
            tier,
            expect: 'allow',
            kind: 'meta',
          });
          continue;
        }

        if (!onSurface) {
          cases.push({
            id: permissionCaseId(entry.id, surface, tier, 'surface_isolation'),
            intentId: entry.id,
            surface,
            tier,
            expect: 'deny',
            kind: 'surface_isolation',
          });
          continue;
        }

        const expect: PermissionExpectation = allowedTiers.has(tier)
          ? 'allow'
          : 'deny';
        cases.push({
          id: permissionCaseId(
            entry.id,
            surface,
            tier,
            expect === 'allow' ? 'in_role' : 'out_of_role',
          ),
          intentId: entry.id,
          surface,
          tier,
          expect,
          kind: expect === 'allow' ? 'in_role' : 'out_of_role',
        });
      }
    }
  }

  return cases;
}

export interface IntentPermissionParityStatus {
  complete: boolean;
  errors: string[];
  casesChecked: number;
  registryEntries: number;
  surfaceLeaks: number;
  tierMismatches: number;
  registryTierMismatches: number;
}

function isIntentListedOnSurface(
  intentId: string,
  surface: CommandSurface,
  registeredSurfaces?: readonly CommandSurface[],
): boolean {
  if (
    surface === 'customer' &&
    registeredSurfaces?.includes('public') &&
    PUBLIC_INTENTS.includes(intentId)
  ) {
    return true;
  }
  return SURFACE_INTENT_LISTS[surface].includes(intentId);
}

export function findRegistryTierMismatches(
  registry: readonly CommandRegistryEntry[],
): string[] {
  const errors: string[] = [];
  for (const entry of registry) {
    const expected = new Set<AccessTier>();
    for (const surface of ALL_COMMAND_SURFACES) {
      if (!isIntentExposedOnSurface(entry.id, surface, entry.surfaces)) continue;
      for (const tier of resolveAllowedTiersOnSurface(entry.id, surface)) {
        expected.add(tier);
      }
    }
    const actual = new Set(entry.tiers);
    for (const tier of expected) {
      if (!actual.has(tier)) {
        errors.push(
          `${entry.id}: registry tiers missing ${tier} (expected from access-control matrix)`,
        );
      }
    }
    for (const tier of actual) {
      if (!expected.has(tier)) {
        errors.push(
          `${entry.id}: registry tiers include unexpected ${tier} (not allowed by access-control matrix)`,
        );
      }
    }
  }
  return errors;
}

export function findSurfaceListingLeaks(
  registry: readonly CommandRegistryEntry[],
): string[] {
  const errors: string[] = [];
  for (const entry of registry) {
    for (const surface of ALL_COMMAND_SURFACES) {
      const listed = isIntentListedOnSurface(
        entry.id,
        surface,
        entry.surfaces,
      );
      const registered = entry.surfaces.includes(surface);
      const customerPublicUnion =
        surface === 'customer' &&
        entry.surfaces.includes('public') &&
        PUBLIC_INTENTS.includes(entry.id);
      if (listed && !registered && !customerPublicUnion) {
        errors.push(
          `${entry.id}: listed on ${surface} intent list but not registered on surface`,
        );
      }
      if (!listed && registered && !isMetaIntent(entry.id)) {
        errors.push(
          `${entry.id}: registered on ${surface} but missing from surface intent list`,
        );
      }
    }
  }
  return errors;
}

export function findCrossSurfaceAllowedLeaks(
  registry: readonly CommandRegistryEntry[],
): string[] {
  const errors: string[] = [];
  for (const entry of registry) {
    if (isMetaIntent(entry.id)) continue;
    for (const surface of ALL_COMMAND_SURFACES) {
      if (isIntentExposedOnSurface(entry.id, surface, entry.surfaces)) continue;
      for (const tier of ALL_ACCESS_TIERS) {
        if (isIntentAllowed(surface, tier, entry.id)) {
          errors.push(
            `${entry.id}: leaks to ${surface}/${tier} via isIntentAllowed despite surface isolation`,
          );
        }
      }
    }
  }
  return errors;
}

export function findTierPermissionMismatches(
  registry: readonly CommandRegistryEntry[],
): string[] {
  const errors: string[] = [];
  for (const entry of registry) {
    if (isMetaIntent(entry.id)) continue;
    for (const surface of ALL_COMMAND_SURFACES) {
      if (!isIntentExposedOnSurface(entry.id, surface, entry.surfaces)) continue;
      const allowedTiers = new Set(
        resolveAllowedTiersOnSurface(entry.id, surface),
      );
      for (const tier of ALL_ACCESS_TIERS) {
        const actual = isIntentAllowed(surface, tier, entry.id);
        const expected = allowedTiers.has(tier);
        if (actual !== expected) {
          errors.push(
            `${entry.id}@${surface}/${tier}: isIntentAllowed=${actual} expected=${expected}`,
          );
        }
      }
    }
  }
  return errors;
}

export function findAllowedIntentSetLeaks(surface: AiSurface): string[] {
  const errors: string[] = [];
  const list = SURFACE_INTENT_LISTS[surface];
  for (const tier of ALL_ACCESS_TIERS) {
    const allowed = new Set(getAllowedIntents(surface, tier));
    for (const intentId of allowed) {
      if (!list.includes(intentId) && !isMetaIntent(intentId)) {
        errors.push(
          `${intentId}: getAllowedIntents(${surface}, ${tier}) exposes intent outside ${surface} list`,
        );
      }
      if (
        !isMetaIntent(intentId) &&
        !isIntentAllowed(surface, tier, intentId)
      ) {
        errors.push(
          `${intentId}: getAllowedIntents(${surface}, ${tier}) includes denied intent`,
        );
      }
    }
  }
  return errors;
}

/** parity-2.5 gate — every registry intent allows in-role tiers and denies out-of-role / cross-surface. */
export function assertIntentPermissionParity(
  registry: readonly CommandRegistryEntry[],
): IntentPermissionParityStatus {
  const errors: string[] = [];
  const cases = buildIntentPermissionCases(registry);

  for (const row of cases) {
    const actual = isIntentAllowed(row.surface, row.tier, row.intentId);
    const expected = row.expect === 'allow';
    if (actual !== expected) {
      errors.push(
        `${row.id}: isIntentAllowed=${actual} expected=${expected}`,
      );
    }
  }

  const registryTierMismatches = findRegistryTierMismatches(registry);
  const surfaceListingLeaks = findSurfaceListingLeaks(registry);
  const crossSurfaceLeaks = findCrossSurfaceAllowedLeaks(registry);
  const tierMismatches = findTierPermissionMismatches(registry);
  const allowedSetLeaks = ALL_COMMAND_SURFACES.flatMap((surface) =>
    findAllowedIntentSetLeaks(surface),
  );

  errors.push(
    ...registryTierMismatches,
    ...surfaceListingLeaks,
    ...crossSurfaceLeaks,
    ...tierMismatches,
    ...allowedSetLeaks,
  );

  return {
    complete: errors.length === 0,
    errors,
    casesChecked: cases.length,
    registryEntries: registry.length,
    surfaceLeaks: crossSurfaceLeaks.length + surfaceListingLeaks.length,
    tierMismatches: tierMismatches.length,
    registryTierMismatches: registryTierMismatches.length,
  };
}

export function formatIntentPermissionParityReport(
  status: IntentPermissionParityStatus,
): string {
  const lines = [
    'AI Intent Permission Parity (parity-2.5)',
    `Status: ${status.complete ? 'PASS' : 'FAIL'}`,
    `Registry entries: ${status.registryEntries}`,
    `Permission cases checked: ${status.casesChecked}`,
    `Surface leaks: ${status.surfaceLeaks}`,
    `Tier mismatches: ${status.tierMismatches}`,
    `Registry tier mismatches: ${status.registryTierMismatches}`,
  ];

  if (status.errors.length > 0) {
    lines.push('', 'Failures:');
    for (const error of status.errors.slice(0, 24)) {
      lines.push(`  - ${error}`);
    }
    if (status.errors.length > 24) {
      lines.push(`  ... and ${status.errors.length - 24} more`);
    }
  }

  return lines.join('\n');
}
