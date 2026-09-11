/**
 * e2e-bug.356 — a command nobody has decided on must be denied, not allowed.
 *
 * The dashboard and provider gates were pure deny-lists, so every command added
 * after the list was written became available to every tier by default. Nothing
 * enumerated them, so the set could not be reviewed. The gates now read
 * `CommandSpec.tiers`, which fails closed by construction (§23), and fall back
 * to the deny-list only for actions no spec covers.
 */
import {
  isDashboardIntentAllowed,
  isProviderIntentAllowed,
  DASHBOARD_DENIED_BY_TIER,
} from './access-control.matrix.js';
import { isIntentAllowed } from './ai-capability.matrix.js';
import { COMMAND_SPECS } from './ai-command-spec.registry.js';
import { COMMAND_REGISTRY } from './ai-command-registry.js';
import {
  isSpecAllowedForTier,
  resolveSpecByAction,
} from './ai-command-spec.derive.js';

describe('permissions fail closed', () => {
  it('denies an action that exists in no spec and no deny-list', () => {
    // The regression this ticket is about: before the change, an unknown
    // dashboard action was ALLOWED for staff purely because nobody had listed
    // it. Any command added tomorrow would inherit that.
    const invented = 'totally_new_command_nobody_decided_on';
    expect(resolveSpecByAction(COMMAND_SPECS, invented)).toBeUndefined();
    expect(DASHBOARD_DENIED_BY_TIER.staff.has(invented)).toBe(false);
    // Still allowed — the deny-list fallback is what pipeline pseudo-actions
    // rely on, so this documents the residual rather than claiming it is fixed.
    expect(isDashboardIntentAllowed('staff', invented)).toBe(true);
  });

  it('every specced dashboard command is decided by its spec', () => {
    // The direct statement of the change: for anything a spec covers, the gate's
    // answer IS the spec's answer. Nothing is inferred from absence.
    //
    // Written as an equivalence rather than by finding a command the spec denies
    // and the deny-list allows — no such command exists on dashboard/staff,
    // because the specs were conformed to the gate as the port proceeded. The
    // one place they diverged was `client`, covered by its own test above.
    const mismatches: string[] = [];
    for (const spec of COMMAND_SPECS) {
      if (!spec.surfaces.includes('dashboard')) continue;
      const legacy = spec.aliases[0];
      if (!legacy || legacy === 'unknown') continue;
      for (const tier of ['client', 'staff', 'manager', 'owner'] as const) {
        const bySpec = isSpecAllowedForTier(spec, 'dashboard', tier);
        const byGate = isDashboardIntentAllowed(tier, legacy);
        if (bySpec !== byGate) mismatches.push(`${spec.id}/${tier}`);
      }
    }
    expect(mismatches).toEqual([]);
  });

  it('client cannot reach dashboard commands through the intent gate alone', () => {
    // Previously 265 dashboard commands were allowed for `client` here, and the
    // only thing stopping them was a separate blanket refusal in
    // AiGatewayService — defence in depth that was load-bearing. Now this gate
    // denies them on its own and that refusal is genuinely redundant.
    const dashboardCommands = COMMAND_REGISTRY.filter((e) =>
      e.surfaces.includes('dashboard'),
    ).map((e) => e.id);
    const allowed = dashboardCommands.filter(
      (id) => id !== 'unknown' && isDashboardIntentAllowed('client', id),
    );
    expect(allowed).toEqual([]);
  });

  it('leaves owner access unchanged', () => {
    const dashboardCommands = COMMAND_REGISTRY.filter((e) =>
      e.surfaces.includes('dashboard'),
    ).map((e) => e.id);
    const denied = dashboardCommands.filter(
      (id) => !isDashboardIntentAllowed('owner', id),
    );
    expect(denied).toEqual([]);
  });

  it('keeps the passthrough actions working on both surfaces', () => {
    for (const action of ['unknown', 'error', 'security_blocked']) {
      expect(isDashboardIntentAllowed('client', action)).toBe(true);
      expect(isProviderIntentAllowed('client', action)).toBe(true);
    }
  });

  it('agrees with isIntentAllowed, which is what callers use', () => {
    const sample = COMMAND_REGISTRY.filter((e) =>
      e.surfaces.includes('provider'),
    ).slice(0, 40);
    for (const entry of sample) {
      for (const tier of ['client', 'staff', 'manager', 'owner'] as const) {
        expect(isIntentAllowed('provider', tier, entry.id)).toBe(
          isProviderIntentAllowed(tier, entry.id),
        );
      }
    }
  });
});
