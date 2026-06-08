import type { ProductRole } from './ai-role-capability-map.types.js';
import type { AiFeatureCatalogEntry } from './ai-feature-catalog.types.js';

export const PRODUCT_ROLES: readonly ProductRole[] = [
  'owner',
  'admin',
  'manager',
  'staff',
  'contributor',
  'client',
];

export const ROLE_TO_ACCESS_TIER_SCENARIOS = [
  { role: 'owner' as const, accessTier: 'owner' as const },
  { role: 'admin' as const, accessTier: 'owner' as const },
  { role: 'manager' as const, accessTier: 'manager' as const },
  { role: 'staff' as const, accessTier: 'staff' as const },
  { role: 'contributor' as const, accessTier: 'staff' as const },
  { role: 'client' as const, accessTier: 'client' as const },
];

export const ROLE_CAPABILITY_MATRIX_SCENARIOS = [
  {
    id: 'owner-sees-billing-nav',
    role: 'owner' as const,
    surface: 'dashboard' as const,
    featureId: 'dashboard.nav.billing',
    uiReachable: true,
  },
  {
    id: 'staff-blocked-billing-nav',
    role: 'staff' as const,
    surface: 'dashboard' as const,
    featureId: 'dashboard.nav.billing',
    uiReachable: false,
  },
  {
    id: 'admin-mirrors-owner-dashboard-count',
    roleA: 'admin' as const,
    roleB: 'owner' as const,
    surface: 'dashboard' as const,
  },
  {
    id: 'contributor-mirrors-staff-provider-count',
    roleA: 'contributor' as const,
    roleB: 'staff' as const,
    surface: 'provider' as const,
  },
  {
    id: 'staff-employees-under-grant-fixture',
    role: 'staff' as const,
    surface: 'dashboard' as const,
    featureId: 'fixture.staff.employees',
    intentId: 'list_employees',
    expectDenyBlock: true,
  },
  {
    id: 'provider-mark-paid-staff-scoped',
    role: 'staff' as const,
    surface: 'provider' as const,
    intentId: 'mark_paid',
    expectStaffScoped: true,
  },
  {
    id: 'provider-list-bookings-staff-scoped',
    role: 'staff' as const,
    surface: 'provider' as const,
    intentId: 'list_bookings',
    expectStaffScoped: true,
  },
] as const;

/** Clean catalog slice where UI minTier and AI deny lists agree (gate fixture). */
export const ROLE_CAPABILITY_RECONCILIATION_FIXTURE: readonly AiFeatureCatalogEntry[] = [
  {
    id: 'fixture.client.home',
    surface: 'customer',
    module: 'self-service-booking',
    actionKind: 'read',
    minTier: 'client',
    label: 'Customer home',
    intentIds: ['list_my_appointments'],
    uiPath: '/s/:slug',
    extractionSource: 'manual',
    confirmed: true,
  },
  {
    id: 'fixture.staff.provider.today',
    surface: 'provider',
    module: 'provider-mobile',
    actionKind: 'read',
    minTier: 'staff',
    label: 'Today',
    intentIds: ['mark_paid'],
    uiPath: '/tabs/today',
    extractionSource: 'manual',
    confirmed: true,
  },
];

/** Fixture row with intentional UI/AI mismatch for deny-list tests. */
export const ROLE_CAPABILITY_DENY_FIXTURE: readonly AiFeatureCatalogEntry[] = [
  {
    id: 'fixture.staff.employees',
    surface: 'dashboard',
    module: 'schedule-resources',
    actionKind: 'read',
    minTier: 'staff',
    label: 'Employees mismatch fixture',
    intentIds: ['list_employees'],
    uiPath: '/dashboard/employees',
    extractionSource: 'manual',
    confirmed: true,
  },
];
