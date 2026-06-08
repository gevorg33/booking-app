import type { PlanTierId } from '../billing/plan-limits.js';
import { tierAccessSummary, type AccessTier } from './access-control.matrix.js';
import {
  getEffectiveAllowedIntents,
  type AiSurface,
} from './ai-capability.matrix.js';
import type { CommandSurface } from './ai-command-registry.types.js';
import type { CommandResult } from './command-completion.types.js';
import { AI_FEATURE_CATALOG } from './ai-feature-catalog.js';
import type { AiFeatureCatalogEntry } from './ai-feature-catalog.types.js';
import {
  listUiAccessibleCatalogEntries,
  roleMeetsCatalogMinTier,
} from './ai-feature-parity.util.js';
import {
  LIST_CAPABILITIES_INTENT,
  ROLE_CAPABILITY_LISTING_PROBE_BOUNDS,
  ROLE_CAPABILITY_LISTING_SCENARIOS,
  type RoleCapabilityListingScenario,
} from './ai-role-capability-listing.fixtures.js';

export {
  CUSTOMER_LIST_CAPABILITIES_CLASSIFIER_RULES,
  DASHBOARD_LIST_CAPABILITIES_CLASSIFIER_RULES,
  LIST_CAPABILITIES_INTENT,
  PROVIDER_LIST_CAPABILITIES_CLASSIFIER_RULES,
  PUBLIC_LIST_CAPABILITIES_CLASSIFIER_RULES,
  ROLE_CAPABILITY_LISTING_PROBE_BOUNDS,
  ROLE_CAPABILITY_LISTING_SCENARIOS,
  type RoleCapabilityListingScenario,
} from './ai-role-capability-listing.fixtures.js';

const MODULE_LABELS: Record<string, string> = {
  schedule: 'Scheduling',
  booking: 'Bookings',
  'ai-command': 'AI operations',
  'provider-mobile': 'Provider mobile',
  'public-booking': 'Public booking',
  'customer-crm': 'Customer account',
  payments: 'Payments',
  marketing: 'Marketing',
  inventory: 'Inventory',
  clinic: 'Clinic',
  'clinic-test-results': 'Lab & results',
};

export interface RoleCapabilityFeatureRow {
  featureId: string;
  label: string;
  module: string;
  actionKind: 'read' | 'mutate';
  intentIds: readonly string[];
}

export interface RoleCapabilityListing {
  surface: CommandSurface;
  accessTier: AccessTier;
  planTierId: PlanTierId;
  allowedIntentCount: number;
  features: RoleCapabilityFeatureRow[];
  groupedByModule: Record<string, RoleCapabilityFeatureRow[]>;
}

export interface RoleCapabilityListingStatus {
  complete: boolean;
  errors: string[];
  probesChecked: number;
}

/** parity-3.7 — detect "what can you do?" style discovery prompts. */
export function isRoleCapabilityListingPrompt(prompt: string): boolean {
  const text = prompt.trim();
  if (!text) return false;
  if (
    /\b(what can you do|what are you able to do|what can i ask(?: you)?|what commands|list (?:your )?capabilities|show (?:me )?(?:your )?capabilities|help me discover|what actions can i run|what features (?:does|are)|what services can i book|show me what you can do|what do you support)\b/i.test(
      text,
    )
  ) {
    return true;
  }
  if (
    /\b(what can you help|how can you help|what(?:'s| is) available for (?:me|my role))\b/i.test(
      text,
    )
  ) {
    return true;
  }
  return false;
}

/** parity-3.7 — skip classifier when user asks for capability discovery. */
export function tryRoleCapabilityListingEarlyReturn(input: {
  prompt: string;
  surface: CommandSurface;
  accessTier: AccessTier;
  planTierId?: PlanTierId;
  isClarifyFollowUp?: boolean;
}): CommandResult | null {
  if (input.isClarifyFollowUp) return null;
  if (!isRoleCapabilityListingPrompt(input.prompt)) return null;
  return buildRoleCapabilityListingResult({
    surface: input.surface,
    accessTier: input.accessTier,
    planTierId: input.planTierId,
  });
}

export function rescueListCapabilitiesIntent(
  prompt: string,
  action: string,
): { action: typeof LIST_CAPABILITIES_INTENT } | null {
  if (action === LIST_CAPABILITIES_INTENT) {
    return { action: LIST_CAPABILITIES_INTENT };
  }
  if (
    isRoleCapabilityListingPrompt(prompt) &&
    (action === 'unknown' || action === 'error')
  ) {
    return { action: LIST_CAPABILITIES_INTENT };
  }
  return null;
}

function toAiSurface(surface: CommandSurface): AiSurface {
  return surface;
}

function moduleLabel(module: string): string {
  return MODULE_LABELS[module] ?? module.replace(/-/g, ' ');
}

function isListingCatalogEntry(entry: AiFeatureCatalogEntry): boolean {
  if (entry.aiExempt) return false;
  if (entry.id.includes('.nav.') && entry.actionKind === 'read') return false;
  return entry.intentIds.length > 0;
}

/** parity-3.7 — features the role can reach on this surface per coverage matrix. */
export function buildRoleCapabilityListing(input: {
  surface: CommandSurface;
  accessTier: AccessTier;
  planTierId?: PlanTierId;
  catalog?: readonly AiFeatureCatalogEntry[];
}): RoleCapabilityListing {
  const planTierId = input.planTierId ?? 'solo';
  const catalog = input.catalog ?? AI_FEATURE_CATALOG;
  const allowed = new Set(
    getEffectiveAllowedIntents(
      toAiSurface(input.surface),
      input.accessTier,
      planTierId,
    ),
  );

  const features: RoleCapabilityFeatureRow[] = [];
  const seen = new Set<string>();

  for (const entry of listUiAccessibleCatalogEntries(
    catalog,
    input.surface,
    input.accessTier,
  )) {
    if (!isListingCatalogEntry(entry)) continue;
    if (!roleMeetsCatalogMinTier(input.accessTier, entry.minTier)) continue;
    const coveredIntents = entry.intentIds.filter((intentId) =>
      allowed.has(intentId),
    );
    if (coveredIntents.length === 0) continue;
    if (seen.has(entry.id)) continue;
    seen.add(entry.id);
    features.push({
      featureId: entry.id,
      label: entry.label,
      module: entry.module,
      actionKind: entry.actionKind,
      intentIds: coveredIntents,
    });
  }

  features.sort((a, b) => {
    const moduleCmp = a.module.localeCompare(b.module);
    if (moduleCmp !== 0) return moduleCmp;
    return a.label.localeCompare(b.label);
  });

  const groupedByModule: Record<string, RoleCapabilityFeatureRow[]> = {};
  for (const feature of features) {
    const key = moduleLabel(feature.module);
    groupedByModule[key] = groupedByModule[key] ?? [];
    groupedByModule[key].push(feature);
  }

  return {
    surface: input.surface,
    accessTier: input.accessTier,
    planTierId,
    allowedIntentCount: allowed.size,
    features,
    groupedByModule,
  };
}

export function formatRoleCapabilityListingSummary(
  listing: RoleCapabilityListing,
): string {
  const roleLabel = tierAccessSummary(listing.accessTier);
  const lines: string[] = [
    `Here's what I can help with as ${roleLabel} on ${listing.surface} (${listing.features.length} features, ${listing.allowedIntentCount} AI actions):`,
  ];

  for (const [module, rows] of Object.entries(listing.groupedByModule)) {
    lines.push('', `${module}:`);
    for (const row of rows) {
      const kind = row.actionKind === 'mutate' ? 'change' : 'view';
      lines.push(`• ${row.label} (${kind})`);
    }
  }

  lines.push(
    '',
    'Ask in plain language — e.g. "summarize today", "book Anna tomorrow", or "cancel Friday appointments".',
  );
  return lines.join('\n');
}

export function buildRoleCapabilityListingResult(input: {
  surface: CommandSurface;
  accessTier: AccessTier;
  planTierId?: PlanTierId;
  catalog?: readonly AiFeatureCatalogEntry[];
}): CommandResult {
  const listing = buildRoleCapabilityListing(input);
  return {
    success: true,
    action: LIST_CAPABILITIES_INTENT,
    summary: formatRoleCapabilityListingSummary(listing),
    details: {
      roleCapabilityListing: true,
      surface: listing.surface,
      accessTier: listing.accessTier,
      planTierId: listing.planTierId,
      allowedIntentCount: listing.allowedIntentCount,
      featureCount: listing.features.length,
      features: listing.features,
      groupedByModule: listing.groupedByModule,
      capabilityDiscovery: true,
    },
  };
}

export function assertRoleCapabilityListingProbes(): RoleCapabilityListingStatus {
  const errors: string[] = [];

  for (const scenario of ROLE_CAPABILITY_LISTING_SCENARIOS) {
    const detected = isRoleCapabilityListingPrompt(scenario.prompt);
    if (detected !== scenario.expectDetect) {
      errors.push(
        `${scenario.id}: expected detect=${scenario.expectDetect}, got ${detected}`,
      );
    }
  }

  const ownerListing = buildRoleCapabilityListing(
    ROLE_CAPABILITY_LISTING_PROBE_BOUNDS.ownerDashboard,
  );
  const staffListing = buildRoleCapabilityListing(
    ROLE_CAPABILITY_LISTING_PROBE_BOUNDS.staffDashboard,
  );
  if (ownerListing.features.length < staffListing.features.length) {
    errors.push('owner dashboard should list >= features than staff');
  }
  if (staffListing.allowedIntentCount >= ownerListing.allowedIntentCount) {
    errors.push('staff should have fewer allowed intents than owner');
  }

  const customerListing = buildRoleCapabilityListing(
    ROLE_CAPABILITY_LISTING_PROBE_BOUNDS.clientCustomer,
  );
  if (customerListing.surface !== 'customer') {
    errors.push('customer listing must be customer surface');
  }
  if (customerListing.features.length === 0) {
    errors.push('client customer should list discoverable features');
  }

  const rescue = rescueListCapabilitiesIntent('What can you do?', 'unknown');
  if (rescue?.action !== LIST_CAPABILITIES_INTENT) {
    errors.push('rescue should map discovery prompt to list_capabilities');
  }

  return {
    complete: errors.length === 0,
    errors,
    probesChecked: ROLE_CAPABILITY_LISTING_SCENARIOS.length + 5,
  };
}

export function formatRoleCapabilityListingReport(
  status: RoleCapabilityListingStatus,
): string {
  const lines = [
    'AI Role Capability Listing (parity-3.7)',
    `Status: ${status.complete ? 'PASS' : 'FAIL'}`,
    `Probes checked: ${status.probesChecked}`,
  ];
  if (status.errors.length > 0) {
    lines.push('', 'Failures:');
    for (const error of status.errors) {
      lines.push(`  - ${error}`);
    }
  }
  return lines.join('\n');
}
