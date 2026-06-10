import {
  buildCapabilitiesView,
  capabilityMatrixForPrompt,
  CUSTOMER_PUBLIC_DELEGATED_INTENTS,
  CUSTOMER_PUBLIC_RESCUE_ROUTING,
  getAllowedIntents,
  getCustomerNativeIntents,
  getEffectiveAllowedIntents,
  getPublicDelegatedCustomerIntents,
  isIntentAllowed,
  isMutatingIntent,
  normalizeActorRole,
  validateCustomerPublicDelegatedIntents,
} from './ai-capability.matrix.js';
import {
  CUSTOMER_INTENTS,
  DASHBOARD_INTENTS,
  PROVIDER_INTENTS,
  PUBLIC_INTENTS,
} from './ai-command-registry.build.js';
import { PUBLIC_ONLY_ASSISTANT_ACTIONS } from './customer-ai-command.util.js';

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
    expect(view.publicDelegatedIntents).toEqual([
      ...PUBLIC_ONLY_ASSISTANT_ACTIONS,
    ]);
    expect(view.customerNativeIntents).toContain('book_package');
    expect(view.customerNativeIntents).not.toContain('list_services');
    expect(view.rescueRoutingNotes).toBe(
      CUSTOMER_PUBLIC_RESCUE_ROUTING.sharedDiscovery.summary,
    );
    expect(capabilityMatrixForPrompt('customer', 'client')).toMatch(
      /Customer booking assistant/,
    );
    expect(capabilityMatrixForPrompt('customer', 'client')).toMatch(
      /delegated to PublicBookingAssistantService/,
    );
  });

  it('documents public delegation vs customer-native intents (ai-cmd-customer-0.1)', () => {
    expect(validateCustomerPublicDelegatedIntents()).toEqual([]);
    expect(CUSTOMER_PUBLIC_DELEGATED_INTENTS).toEqual([
      ...PUBLIC_ONLY_ASSISTANT_ACTIONS,
    ]);

    const delegated = getPublicDelegatedCustomerIntents('client');
    const native = getCustomerNativeIntents('client');
    const allowed = getAllowedIntents('customer', 'client');

    for (const action of PUBLIC_ONLY_ASSISTANT_ACTIONS) {
      expect(delegated).toContain(action);
      expect(native).not.toContain(action);
      expect(allowed).toContain(action);
    }

    expect(native).toContain('book_package');
    expect(native).not.toContain('list_services');
    expect(delegated).not.toContain('book_package');
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
});
