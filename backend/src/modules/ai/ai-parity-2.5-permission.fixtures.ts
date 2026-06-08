import type { AccessTier } from './access-control.matrix.js';
import type { CommandSurface } from './ai-command-registry.types.js';
import type { AiSurface } from './ai-capability.matrix.js';

/** Meta classifier actions — always pass capability checks on every surface/tier. */
export const PERMISSION_META_INTENTS = [
  'unknown',
  'error',
  'security_blocked',
] as const;

export type PermissionExpectation = 'allow' | 'deny';

export type PermissionCaseKind =
  | 'in_role'
  | 'out_of_role'
  | 'surface_isolation'
  | 'meta';

export interface IntentPermissionCase {
  id: string;
  intentId: string;
  surface: CommandSurface;
  tier: AccessTier;
  expect: PermissionExpectation;
  kind: PermissionCaseKind;
}

/** Representative probes — every fixture id is exercised via it.each in the gate spec. */
export const PERMISSION_PROBE_SCENARIOS = [
  {
    id: 'owner-dashboard-optimize-schedule-allow',
    intentId: 'optimize_schedule',
    surface: 'dashboard' as const,
    tier: 'owner' as const,
    expect: 'allow' as const,
    kind: 'in_role' as const,
  },
  {
    id: 'staff-dashboard-optimize-schedule-deny',
    intentId: 'optimize_schedule',
    surface: 'dashboard' as const,
    tier: 'staff' as const,
    expect: 'deny' as const,
    kind: 'out_of_role' as const,
  },
  {
    id: 'client-dashboard-list-bookings-deny',
    intentId: 'list_bookings',
    surface: 'dashboard' as const,
    tier: 'client' as const,
    expect: 'deny' as const,
    kind: 'out_of_role' as const,
  },
  {
    id: 'staff-provider-list-bookings-allow',
    intentId: 'list_bookings',
    surface: 'provider' as const,
    tier: 'staff' as const,
    expect: 'allow' as const,
    kind: 'in_role' as const,
  },
  {
    id: 'client-provider-list-bookings-deny',
    intentId: 'list_bookings',
    surface: 'provider' as const,
    tier: 'client' as const,
    expect: 'deny' as const,
    kind: 'out_of_role' as const,
  },
  {
    id: 'client-customer-book-package-allow',
    intentId: 'book_package',
    surface: 'customer' as const,
    tier: 'client' as const,
    expect: 'allow' as const,
    kind: 'in_role' as const,
  },
  {
    id: 'staff-customer-book-package-deny',
    intentId: 'book_package',
    surface: 'customer' as const,
    tier: 'staff' as const,
    expect: 'deny' as const,
    kind: 'out_of_role' as const,
  },
  {
    id: 'client-public-book-appointment-allow',
    intentId: 'book_appointment',
    surface: 'public' as const,
    tier: 'client' as const,
    expect: 'allow' as const,
    kind: 'in_role' as const,
  },
  {
    id: 'staff-public-book-appointment-deny',
    intentId: 'book_appointment',
    surface: 'public' as const,
    tier: 'staff' as const,
    expect: 'deny' as const,
    kind: 'out_of_role' as const,
  },
  {
    id: 'dashboard-intent-leak-customer-create-booking',
    intentId: 'create_booking',
    surface: 'customer' as const,
    tier: 'client' as const,
    expect: 'deny' as const,
    kind: 'surface_isolation' as const,
  },
  {
    id: 'dashboard-intent-leak-public-create-booking',
    intentId: 'create_booking',
    surface: 'public' as const,
    tier: 'client' as const,
    expect: 'deny' as const,
    kind: 'surface_isolation' as const,
  },
  {
    id: 'customer-intent-leak-dashboard-book-package',
    intentId: 'book_package',
    surface: 'dashboard' as const,
    tier: 'owner' as const,
    expect: 'deny' as const,
    kind: 'surface_isolation' as const,
  },
  {
    id: 'public-intent-customer-gateway-book-appointment',
    intentId: 'book_appointment',
    surface: 'customer' as const,
    tier: 'client' as const,
    expect: 'allow' as const,
    kind: 'in_role' as const,
  },
  {
    id: 'meta-unknown-all-surfaces',
    intentId: 'unknown',
    surface: 'dashboard' as const,
    tier: 'client' as const,
    expect: 'allow' as const,
    kind: 'meta' as const,
  },
] as const;

/** Runtime denial action when capability matrix blocks an intent (parity-2.5). */
export function expectedRuntimeDeniedAction(
  surface: AiSurface,
  intentId: string,
): string {
  if (surface === 'customer') return 'security_blocked';
  return intentId;
}
