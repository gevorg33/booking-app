import {
  buildCapabilitiesView,
  capabilityMatrixForPrompt,
  getAllowedIntents,
  getEffectiveAllowedIntents,
  isIntentAllowed,
  isMutatingIntent,
} from './ai-capability.matrix.js';

describe('ai-capability.matrix (Sprint 15)', () => {
  it('restricts staff from owner-only dashboard intents', () => {
    expect(isIntentAllowed('dashboard', 'staff', 'optimize_schedule')).toBe(false);
    expect(isIntentAllowed('dashboard', 'owner', 'optimize_schedule')).toBe(true);
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
  });

  it('formats capability hints for classifier', () => {
    const hints = capabilityMatrixForPrompt('dashboard', 'manager');
    expect(hints).toMatch(/Manager/);
    expect(hints).toMatch(/optimize_schedule|list_bookings/);
  });
});
