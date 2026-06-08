import {
  buildCapabilitiesView,
  capabilityMatrixForPrompt,
  getAllowedIntents,
  getEffectiveAllowedIntents,
  isIntentAllowed,
  isMutatingIntent,
  normalizeActorRole,
} from './ai-capability.matrix.js';
import {
  buildCommandRegistry,
  buildCompoundCommandRecipes,
  collectCompoundStepIds,
  CUSTOMER_INTENTS,
  DASHBOARD_INTENTS,
  PROVIDER_INTENTS,
  PUBLIC_INTENTS,
} from './ai-command-registry.build.js';
import {
  assertIntentPermissionParity,
  buildIntentPermissionCases,
} from './ai-parity-2.5-permission.util.js';

describe('ai-capability.matrix (Sprint 15)', () => {
  it('restricts staff from owner-only dashboard intents', () => {
    expect(isIntentAllowed('dashboard', 'staff', 'optimize_schedule')).toBe(
      false,
    );
    expect(isIntentAllowed('dashboard', 'owner', 'optimize_schedule')).toBe(
      true,
    );
  });

  it('allows meta actions without role checks', () => {
    expect(isIntentAllowed('dashboard', 'client', 'unknown')).toBe(true);
    expect(isIntentAllowed('provider', 'client', 'error')).toBe(true);
    expect(isIntentAllowed('provider', 'staff', 'security_blocked')).toBe(true);
  });

  it('checks provider surface intents', () => {
    expect(isIntentAllowed('provider', 'staff', 'payment_sweep')).toBe(false);
    expect(isIntentAllowed('provider', 'owner', 'list_bookings')).toBe(true);
  });

  it('defaults plan tier to solo when omitted', () => {
    const allowed = getEffectiveAllowedIntents('dashboard', 'owner');
    expect(allowed).not.toContain('optimize_schedule');
  });

  it('filters solo plan denied intents from effective list', () => {
    const allowed = getEffectiveAllowedIntents('dashboard', 'owner', 'solo');
    expect(allowed).toContain('create_booking');
    expect(allowed).not.toContain('optimize_schedule');
    expect(allowed).not.toContain('clear_schedule');
  });

  it('does not filter provider intents by plan tier', () => {
    const allowed = getEffectiveAllowedIntents('provider', 'owner', 'solo');
    expect(allowed).toContain('list_bookings');
    expect(allowed).toContain('reschedule_booking');
  });

  it('detects mutating intents per surface', () => {
    expect(isMutatingIntent('dashboard', 'create_booking')).toBe(true);
    expect(isMutatingIntent('dashboard', 'list_bookings')).toBe(false);
    expect(isMutatingIntent('dashboard', 'optimize_schedule')).toBe(true);
    expect(isMutatingIntent('provider', 'block_schedule')).toBe(true);
    expect(isMutatingIntent('provider', 'summarize_day')).toBe(false);
    expect(isMutatingIntent('provider', 'unknown_action')).toBe(false);
  });

  it('builds dashboard capabilities view with plan denied list', () => {
    const view = buildCapabilitiesView('dashboard', 'owner', 'solo');
    expect(view.surface).toBe('dashboard');
    expect(view.planTierId).toBe('solo');
    expect(view.planDeniedIntents.length).toBeGreaterThan(0);
    expect(view.allowedIntents).not.toContain('day_replan');
    expect(view.hints).toMatch(/Allowed AI actions \(dashboard\)/);
  });

  it('builds provider capabilities without plan denied list', () => {
    const view = buildCapabilitiesView('provider', 'staff', 'solo');
    expect(view.surface).toBe('provider');
    expect(view.planDeniedIntents).toEqual([]);
    expect(view.hints).toMatch(/Allowed AI actions \(provider\)/);
  });

  it('lists allowed intents for role', () => {
    const owner = getAllowedIntents('dashboard', 'owner');
    expect(owner).toContain('optimize_schedule');
    const staff = getAllowedIntents('dashboard', 'staff');
    expect(staff).not.toContain('optimize_schedule');
    expect(getAllowedIntents('public', 'client')).toEqual(PUBLIC_INTENTS);
    expect(getAllowedIntents('provider', 'owner')).toContain('list_bookings');
  });

  it('formats capability hints for classifier', () => {
    const hints = capabilityMatrixForPrompt('dashboard', 'manager');
    expect(hints).toMatch(/Manager/);
    expect(hints).toMatch(/optimize_schedule|list_bookings/);
  });

  it('normalizes membership roles to access tiers', () => {
    expect(normalizeActorRole('owner')).toBe('owner');
    expect(normalizeActorRole(undefined)).toBe('client');
  });

  it('applies plan filters only on dashboard effective intents', () => {
    expect(getEffectiveAllowedIntents('customer', 'client', 'solo')).toContain(
      'book_package',
    );
    expect(getEffectiveAllowedIntents('provider', 'owner', 'solo')).toContain(
      'list_bookings',
    );
  });

  it('exposes intent lists generated from the command registry', () => {
    expect(DASHBOARD_INTENTS.length).toBeGreaterThan(150);
    expect(PROVIDER_INTENTS.length).toBeGreaterThan(30);
    expect(CUSTOMER_INTENTS.length).toBeGreaterThan(40);
    expect(PUBLIC_INTENTS.length).toBeGreaterThan(10);
    expect(DASHBOARD_INTENTS).toContain('create_booking');
    expect(PROVIDER_INTENTS).toContain('list_package_appointments_today');
    expect(CUSTOMER_INTENTS).toContain('book_package');
    expect(PUBLIC_INTENTS).toContain('book_appointment');
    expect(CUSTOMER_INTENTS).not.toContain('create_booking');
  });

  it('scopes customer surface to client tier', () => {
    expect(isIntentAllowed('customer', 'client', 'book_package')).toBe(true);
    expect(isIntentAllowed('customer', 'staff', 'book_package')).toBe(false);
    expect(getAllowedIntents('customer', 'client')).toContain('book_package');
    expect(getAllowedIntents('customer', 'owner')).toEqual(['unknown']);
  });

  it('rejects anonymous public intents outside the public allow-list', () => {
    expect(isIntentAllowed('public', 'client', 'book_appointment')).toBe(true);
    expect(isIntentAllowed('public', 'client', 'book_package')).toBe(false);
    expect(capabilityMatrixForPrompt('public', 'client')).toMatch(
      /Public booking assistant/,
    );
    expect(capabilityMatrixForPrompt('public', 'client')).toContain(
      'book_appointment',
    );
  });

  it('detects customer mutating intents and builds customer capabilities view', () => {
    expect(isMutatingIntent('customer', 'book_package')).toBe(true);
    expect(isMutatingIntent('customer', 'list_my_appointments')).toBe(false);
    expect(isMutatingIntent('public', 'book_appointment')).toBe(false);
    const view = buildCapabilitiesView('customer', 'client', 'solo');
    expect(view.surface).toBe('customer');
    expect(view.allowedIntents).toContain('book_package');
    expect(capabilityMatrixForPrompt('customer', 'client')).toMatch(
      /Customer booking assistant/,
    );
  });

  it('allows customer meta actions and rejects dashboard intents on customer surface', () => {
    expect(isIntentAllowed('customer', 'client', 'unknown')).toBe(true);
    expect(isIntentAllowed('customer', 'client', 'error')).toBe(true);
    expect(isIntentAllowed('customer', 'client', 'security_blocked')).toBe(
      true,
    );
    expect(isIntentAllowed('customer', 'client', 'create_booking')).toBe(false);
    expect(isIntentAllowed('customer', 'client', 'not_a_real_intent')).toBe(
      false,
    );
  });

  it('allows anonymous public booking intents on customer gateway (ai-cmd-0.5)', () => {
    expect(isIntentAllowed('customer', 'client', 'list_providers')).toBe(true);
    expect(isIntentAllowed('customer', 'client', 'book_appointment')).toBe(
      true,
    );
    expect(getAllowedIntents('customer', 'client')).toEqual(
      expect.arrayContaining([
        'book_package',
        'list_providers',
        'check_availability',
      ]),
    );
  });

  it('rejects denied provider intents for client tier', () => {
    expect(isIntentAllowed('provider', 'client', 'list_bookings')).toBe(false);
    expect(
      isIntentAllowed('provider', 'owner', 'list_package_appointments_today'),
    ).toBe(true);
  });

  it('blocks elevated tiers on public surface (parity-2.5)', () => {
    expect(isIntentAllowed('public', 'staff', 'book_appointment')).toBe(false);
    expect(isIntentAllowed('public', 'owner', 'list_providers')).toBe(false);
    expect(getAllowedIntents('public', 'staff')).toEqual(['unknown']);
    expect(getAllowedIntents('public', 'owner')).toEqual(['unknown']);
  });

  describe('parity-2.5 capability matrix permission gate', () => {
    const registry = buildCommandRegistry(
      collectCompoundStepIds(buildCompoundCommandRecipes()),
    );
    const permissionCases = buildIntentPermissionCases(registry);

    it.each(
      permissionCases.filter((row) => row.kind === 'in_role').slice(0, 80),
    )('allows in-role $intentId on $surface/$tier', (row) => {
      expect(isIntentAllowed(row.surface, row.tier, row.intentId)).toBe(true);
    });

    it.each(
      permissionCases
        .filter((row) => row.kind === 'out_of_role')
        .slice(0, 80),
    )('denies out-of-role $intentId on $surface/$tier', (row) => {
      expect(isIntentAllowed(row.surface, row.tier, row.intentId)).toBe(false);
    });

    it.each(
      permissionCases
        .filter((row) => row.kind === 'surface_isolation')
        .slice(0, 80),
    )('isolates $intentId from $surface/$tier', (row) => {
      expect(isIntentAllowed(row.surface, row.tier, row.intentId)).toBe(false);
    });

    it('passes full registry permission parity gate', () => {
      const status = assertIntentPermissionParity(registry);
      expect(status.complete).toBe(true);
    });
  });
});
