import {
  isCustomerIntentAllowed,
  type AccessTier,
} from './access-control.matrix.js';
import type { CommandRegistryEntry, CommandSurface } from './ai-command-registry.types.js';
import type {
  AiFeatureCatalogEntry,
  AiParityCoverageReport,
} from './ai-feature-catalog.types.js';
import {
  CUSTOMER_ACCOUNT_MUTATE_INTENTS,
  CUSTOMER_ACCOUNT_READ_INTENTS,
  DISCOVERY_INTENTS,
} from './ai-customer-crm.util.js';
import { CUSTOMER_PAYMENTS_INTENTS } from './ai-payments.util.js';
import { CUSTOMER_MARKETING_GROWTH_INTENTS } from './ai-marketing-growth.util.js';
import { SELF_SERVICE_BOOKING_INTENTS } from './ai-self-service-booking.util.js';
import {
  formatCoveragePercent,
  roleMeetsCatalogMinTier,
} from './ai-feature-parity.util.js';

/** parity-2.3 — explicit customer self-service catalog feature ids. */
export const PARITY_23_CUSTOMER_SELF_SERVICE_FEATURE_IDS = [
  'customer.nav.home',
  'customer.nav.account',
  'customer.route.manage',
  'customer.action.cancel_booking',
  'customer.action.reschedule_booking',
  'customer.action.manage_link',
  'customer.action.subscriptions',
  'customer.action.gift_cards',
  'customer.action.payment_checkout',
  'customer.action.discover_packages',
  'customer.action.notification_prefs',
  'customer.action.rewards',
] as const;

/** parity-2.3 — explicit public self-service catalog feature ids. */
export const PARITY_23_PUBLIC_SELF_SERVICE_FEATURE_IDS = [
  'public.flow.manage_booking',
  'public.flow.account',
  'public.flow.gift_cards',
  'public.flow.checkout',
  'public.flow.review',
  'public.account.profile',
  'public.account.subscriptions',
  'public.account.gift_cards',
  'public.account.loyalty',
  'public.action.discover_packages',
] as const;

export const PARITY_23_CLIENT_TIER: AccessTier = 'client';

export const PARITY_23_CUSTOMER_SELF_SERVICE_INTENTS = [
  ...new Set([
    ...SELF_SERVICE_BOOKING_INTENTS,
    ...CUSTOMER_ACCOUNT_READ_INTENTS,
    ...CUSTOMER_ACCOUNT_MUTATE_INTENTS,
    ...DISCOVERY_INTENTS,
    ...CUSTOMER_PAYMENTS_INTENTS,
    ...CUSTOMER_MARKETING_GROWTH_INTENTS.filter((id) => id === 'loyalty_points_balance'),
    'manage_notification_preferences',
  ]),
] as const;

export const PARITY_23_PUBLIC_SELF_SERVICE_INTENTS = [
  ...new Set([
    'booking_help',
    'book_appointment',
    'submit_review',
    'buy_gift_card',
    'buy_gift_card_physical',
    ...CUSTOMER_ACCOUNT_READ_INTENTS,
    ...DISCOVERY_INTENTS,
    'loyalty_points_balance',
  ]),
] as const;

export function listParity23CustomerCatalogEntries(
  catalog: readonly AiFeatureCatalogEntry[],
): AiFeatureCatalogEntry[] {
  return catalog.filter((entry) =>
    (PARITY_23_CUSTOMER_SELF_SERVICE_FEATURE_IDS as readonly string[]).includes(
      entry.id,
    ),
  );
}

export function listParity23PublicCatalogEntries(
  catalog: readonly AiFeatureCatalogEntry[],
): AiFeatureCatalogEntry[] {
  return catalog.filter((entry) =>
    (PARITY_23_PUBLIC_SELF_SERVICE_FEATURE_IDS as readonly string[]).includes(
      entry.id,
    ),
  );
}

export interface Parity23CustomerPublicStatus {
  complete: boolean;
  errors: string[];
  clientCustomerCoverage: number | null;
  clientPublicCoverage: number | null;
  registryChecks: number;
}

export function assertParity23RegistryIntegrity(
  catalog: readonly AiFeatureCatalogEntry[],
  registry: readonly CommandRegistryEntry[],
): { complete: boolean; errors: string[]; checks: number } {
  const errors: string[] = [];
  let checks = 0;
  const registryById = new Map(registry.map((row) => [row.id, row]));

  const assertSurfaceIntents = (
    entries: AiFeatureCatalogEntry[],
    surface: CommandSurface,
    allowedIntentPool: readonly string[],
  ) => {
    for (const feature of entries) {
      if (feature.surface !== surface) {
        errors.push(`${feature.id}: expected surface ${surface}`);
      }
      if (!roleMeetsCatalogMinTier(PARITY_23_CLIENT_TIER, feature.minTier)) {
        errors.push(
          `${feature.id}: client tier cannot reach minTier ${feature.minTier}`,
        );
      }
      for (const intentId of feature.intentIds) {
        checks += 1;
        if (!(allowedIntentPool as readonly string[]).includes(intentId)) {
          errors.push(
            `${feature.id}: intent ${intentId} outside parity-2.3 ${surface} pool`,
          );
        }
        const entry = registryById.get(intentId);
        if (!entry) {
          errors.push(`intent ${intentId} missing from command registry`);
          continue;
        }
        if (!entry.surfaces.includes(surface)) {
          errors.push(
            `${intentId}: registry surfaces [${entry.surfaces.join(', ')}] missing ${surface}`,
          );
        }
        if (!entry.tiers.includes('client')) {
          errors.push(`${intentId}: registry tiers missing client`);
        }
        if (!isCustomerIntentAllowed(PARITY_23_CLIENT_TIER, intentId)) {
          errors.push(`${intentId}: client denied on customer access matrix`);
        }
        const handler =
          surface === 'public'
            ? (entry.surfaceHandlers?.public ?? entry.handler)
            : (entry.surfaceHandlers?.customer ?? entry.handler);
        if (!handler?.trim()) {
          errors.push(`${intentId}: missing handler for ${surface}`);
        }
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
      }
    }
  };

  assertSurfaceIntents(
    listParity23CustomerCatalogEntries(catalog),
    'customer',
    PARITY_23_CUSTOMER_SELF_SERVICE_INTENTS,
  );
  assertSurfaceIntents(
    listParity23PublicCatalogEntries(catalog),
    'public',
    PARITY_23_PUBLIC_SELF_SERVICE_INTENTS,
  );

  return { complete: errors.length === 0, errors, checks };
}

export function assertParity23CustomerPublicComplete(
  catalog: readonly AiFeatureCatalogEntry[],
  registry: readonly CommandRegistryEntry[],
  report: AiParityCoverageReport,
): Parity23CustomerPublicStatus {
  const errors: string[] = [];

  for (const surface of ['customer', 'public'] as CommandSurface[]) {
    const row = report.byRoleSurface.find(
      (summary) =>
        summary.tier === PARITY_23_CLIENT_TIER && summary.surface === surface,
    );
    const rate = row?.coveragePercent ?? null;
    if (rate == null || rate + 1e-9 < 1) {
      errors.push(
        `client/${surface} coverage ${formatCoveragePercent(rate)} below 100%`,
      );
    }
    if ((row?.gapCount ?? 0) > 0) {
      errors.push(
        `client/${surface} gaps: ${row!.gaps.slice(0, 5).join(', ')}`,
      );
    }
    if ((row?.scopeBugCount ?? 0) > 0) {
      errors.push(
        `client/${surface} scope bugs: ${row!.scopeBugs.slice(0, 5).join(', ')}`,
      );
    }
  }

  const customerEntries = listParity23CustomerCatalogEntries(catalog);
  const publicEntries = listParity23PublicCatalogEntries(catalog);
  if (customerEntries.length !== PARITY_23_CUSTOMER_SELF_SERVICE_FEATURE_IDS.length) {
    errors.push(
      `expected ${PARITY_23_CUSTOMER_SELF_SERVICE_FEATURE_IDS.length} customer parity-2.3 features, found ${customerEntries.length}`,
    );
  }
  if (publicEntries.length !== PARITY_23_PUBLIC_SELF_SERVICE_FEATURE_IDS.length) {
    errors.push(
      `expected ${PARITY_23_PUBLIC_SELF_SERVICE_FEATURE_IDS.length} public parity-2.3 features, found ${publicEntries.length}`,
    );
  }

  const registryIntegrity = assertParity23RegistryIntegrity(catalog, registry);
  errors.push(...registryIntegrity.errors);

  const clientCustomer = report.byRoleSurface.find(
    (row) => row.tier === 'client' && row.surface === 'customer',
  );
  const clientPublic = report.byRoleSurface.find(
    (row) => row.tier === 'client' && row.surface === 'public',
  );

  return {
    complete: errors.length === 0,
    errors: [...new Set(errors)],
    clientCustomerCoverage: clientCustomer?.coveragePercent ?? null,
    clientPublicCoverage: clientPublic?.coveragePercent ?? null,
    registryChecks: registryIntegrity.checks,
  };
}

export function formatParity23CustomerPublicReport(
  status: Parity23CustomerPublicStatus,
): string {
  const lines = [
    'AI Feature Parity Customer/Public Self-Service (parity-2.3)',
    `Status: ${status.complete ? 'PASS' : 'FAIL'}`,
    `Client customer coverage: ${formatCoveragePercent(status.clientCustomerCoverage)}`,
    `Client public coverage: ${formatCoveragePercent(status.clientPublicCoverage)}`,
    `Registry integrity checks: ${status.registryChecks}`,
  ];
  if (status.errors.length > 0) {
    lines.push('', 'Issues:');
    for (const error of status.errors) lines.push(`  - ${error}`);
  }
  return lines.join('\n');
}
