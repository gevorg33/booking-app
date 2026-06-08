import type { AiFeatureCatalogEntry } from './ai-feature-catalog.types.js';

export const FEATURE_INTENT_MAP_SCENARIOS = [
  {
    id: 'gap-no-intents',
    featureId: 'fixture.gap.action',
    expectedStatus: 'gap' as const,
    gap: true,
    scopeBug: false,
  },
  {
    id: 'scope-bug-blocked-intent',
    featureId: 'fixture.scope.action',
    expectedStatus: 'scope_bug' as const,
    gap: false,
    scopeBug: true,
    blockedIntentId: 'list_employees',
  },
  {
    id: 'covered-valid-intent',
    featureId: 'fixture.covered.action',
    expectedStatus: 'covered' as const,
    gap: false,
    scopeBug: false,
    intentId: 'list_bookings',
  },
  {
    id: 'unknown-registry-intent',
    featureId: 'fixture.unknown.action',
    intentId: 'not_a_real_intent',
  },
  {
    id: 'wrong-surface-intent',
    featureId: 'fixture.wrong_surface.action',
    intentId: 'book_appointment',
  },
] as const;

export const FEATURE_INTENT_MAP_FIXTURE_CATALOG: readonly AiFeatureCatalogEntry[] = [
  {
    id: 'fixture.gap.action',
    surface: 'dashboard',
    module: 'ai-command',
    actionKind: 'read',
    minTier: 'staff',
    label: 'Gap fixture',
    intentIds: [],
    extractionSource: 'manual',
    confirmed: true,
  },
  {
    id: 'fixture.scope.action',
    surface: 'dashboard',
    module: 'schedule-resources',
    actionKind: 'read',
    minTier: 'staff',
    label: 'Scope bug fixture',
    intentIds: ['list_employees'],
    extractionSource: 'manual',
    confirmed: true,
  },
  {
    id: 'fixture.covered.action',
    surface: 'dashboard',
    module: 'booking',
    actionKind: 'read',
    minTier: 'staff',
    label: 'Covered fixture',
    intentIds: ['list_bookings'],
    extractionSource: 'manual',
    confirmed: true,
  },
  {
    id: 'fixture.unknown.action',
    surface: 'dashboard',
    module: 'ai-command',
    actionKind: 'read',
    minTier: 'staff',
    label: 'Unknown intent fixture',
    intentIds: ['not_a_real_intent'],
    extractionSource: 'manual',
    confirmed: true,
  },
  {
    id: 'fixture.wrong_surface.action',
    surface: 'dashboard',
    module: 'public-booking',
    actionKind: 'mutate',
    minTier: 'staff',
    label: 'Wrong surface fixture',
    intentIds: ['book_appointment'],
    extractionSource: 'manual',
    confirmed: true,
  },
];

export const FEATURE_INTENT_MAP_LIVE_SAMPLES = {
  billingCovered: 'dashboard.nav.billing',
  customerBook: 'customer.nav.book',
  staffCustomersCovered: 'dashboard.nav.customers',
} as const;
