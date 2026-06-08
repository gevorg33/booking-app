import type { AccessTier } from './access-control.matrix.js';
import type { CommandSurface } from './ai-command-registry.types.js';
import type { AiFeatureCatalogEntry } from './ai-feature-catalog.types.js';

export const ALLOW_DENY_PARITY_FIXTURE_CATALOG: readonly AiFeatureCatalogEntry[] = [
  {
    id: 'fixture.under_grant.staff_employees',
    surface: 'dashboard',
    module: 'schedule-resources',
    actionKind: 'read',
    minTier: 'staff',
    label: 'Staff employees under-grant',
    intentIds: ['list_employees'],
    extractionSource: 'manual',
    confirmed: true,
  },
  {
    id: 'fixture.over_grant.manager_monetization',
    surface: 'dashboard',
    module: 'marketing-growth',
    actionKind: 'read',
    minTier: 'owner',
    label: 'Owner monetization over-grant probe',
    intentIds: ['list_templates'],
    extractionSource: 'manual',
    confirmed: true,
  },
  {
    id: 'fixture.aligned.staff_bookings',
    surface: 'dashboard',
    module: 'booking',
    actionKind: 'read',
    minTier: 'staff',
    label: 'Aligned staff bookings',
    intentIds: ['list_bookings'],
    extractionSource: 'manual',
    confirmed: true,
  },
];

export const ALLOW_DENY_PARITY_CLEAN_CATALOG: readonly AiFeatureCatalogEntry[] = [
  {
    id: 'fixture.clean.staff_bookings',
    surface: 'dashboard',
    module: 'booking',
    actionKind: 'read',
    minTier: 'staff',
    label: 'Clean staff bookings',
    intentIds: ['list_bookings'],
    extractionSource: 'manual',
    confirmed: true,
  },
  {
    id: 'fixture.clean.client_book',
    surface: 'customer',
    module: 'self-service-booking',
    actionKind: 'mutate',
    minTier: 'client',
    label: 'Clean client book',
    intentIds: ['book_package'],
    extractionSource: 'manual',
    confirmed: true,
  },
];

export const ALLOW_DENY_PARITY_SCENARIOS = [
  {
    id: 'under-grant-staff-list-employees',
    kind: 'under_grant' as const,
    featureId: 'fixture.under_grant.staff_employees',
    tier: 'staff' as const,
    surface: 'dashboard' as const,
    intentId: 'list_employees',
  },
  {
    id: 'over-grant-manager-list-templates',
    kind: 'over_grant' as const,
    featureId: 'fixture.over_grant.manager_monetization',
    tier: 'manager' as const,
    surface: 'dashboard' as const,
    intentId: 'list_templates',
  },
  {
    id: 'clean-catalog-zero-divergences',
    catalog: 'clean' as const,
    expectZero: true,
  },
] as const;

export const ALLOW_DENY_PARITY_LIVE_SAMPLES = {
  staffUnderGrantFeature: 'dashboard.nav.employees',
  staffUnderGrantIntent: 'list_employees',
} as const;
