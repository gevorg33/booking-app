/**
 * AI-ROADMAP Phase 1 — permission checks derived from the spec.
 *
 * §4 guardrail 1 says the planner's shortlist is "filtered by surface +
 * permission before the planner sees it". Only the surface half existed: every
 * actor on a surface was shown every command that surface allows, and the only
 * thing between a `staff` member and a manager-only command was a check in the
 * legacy executor that the planner path does not run through.
 *
 * The worked example throughout is `appointment.update_bulk` (`update_bookings`,
 * T3, "mark these appointments no-show"), which the live platform permits to
 * `manager`+ on the dashboard but to `staff`+ on provider. The registry's flat
 * `tiers: ['manager','owner','staff']` cannot express that and therefore grants
 * dashboard access to `staff` — see e2e-bug.355.
 */
import {
  buildPlannerShortlist,
  isSpecAllowedForTier,
  specsForActor,
  specsForSurface,
} from './ai-command-spec.derive.js';
import { COMMAND_SPECS } from './ai-command-spec.registry.js';
import type { CommandSpec } from './ai-command-spec.types.js';
import { buildPlannerSystemPrompt } from './ai-command-plan.prompt.js';
import {
  describePlanClarification,
  validatePlan,
} from './ai-command-plan.validate.js';
import type { CommandPlan } from './ai-command-plan.types.js';

const CONTEXT = { today: '2026-08-05', timeZone: 'Asia/Yerevan' };

const spec = (id: string): CommandSpec =>
  COMMAND_SPECS.find((s) => s.id === id)!;

const planOf = (
  command: string,
  variables: Record<string, unknown>,
): CommandPlan => ({
  steps: [{ id: 's1', command, variables, confidence: 0.95, dependsOn: [] }],
  unresolved: [],
  topicChanged: false,
});

const markNoShow = planOf('appointment.update_bulk', { status: 'no_show' });

describe('AI-ROADMAP Phase 1 — permission gating', () => {
  describe('isSpecAllowedForTier', () => {
    const updateBulk = spec('appointment.update_bulk');

    it('permits the same command on one surface and refuses it on another', () => {
      // The case a flat tier list cannot represent.
      expect(isSpecAllowedForTier(updateBulk, 'dashboard', 'staff')).toBe(
        false,
      );
      expect(isSpecAllowedForTier(updateBulk, 'provider', 'staff')).toBe(true);
    });

    it('permits the tiers above the threshold', () => {
      expect(isSpecAllowedForTier(updateBulk, 'dashboard', 'manager')).toBe(
        true,
      );
      expect(isSpecAllowedForTier(updateBulk, 'dashboard', 'owner')).toBe(true);
    });

    it('refuses a tier on a surface the command does not declare at all', () => {
      expect(isSpecAllowedForTier(updateBulk, 'customer', 'owner')).toBe(false);
    });

    it('fails CLOSED when a spec declares no tiers for a surface', () => {
      // The direction matters. e2e-bug.342's `undefined?.includes(...)` → false
      // made commands unreachable; the same shape in a permission check would
      // make every un-migrated command available to everyone instead.
      const undeclared = {
        ...updateBulk,
        tiers: {},
      } as CommandSpec;
      expect(isSpecAllowedForTier(undeclared, 'dashboard', 'owner')).toBe(
        false,
      );
    });
  });

  describe('the shortlist the model is shown', () => {
    it('omits commands the actor may not run', () => {
      const staff = buildPlannerShortlist(
        COMMAND_SPECS,
        'dashboard',
        'staff',
      ).map((e) => e.command);
      const owner = buildPlannerShortlist(
        COMMAND_SPECS,
        'dashboard',
        'owner',
      ).map((e) => e.command);

      expect(owner).toContain('appointment.update_bulk');
      expect(staff).not.toContain('appointment.update_bulk');

      // ...and is otherwise the same list, so this is a permission rule and not
      // an accidental narrowing of what staff can do.
      //
      // Derived from the declared tiers rather than a hardcoded exception. It
      // was `owner.filter(c => c !== 'appointment.update_bulk')` while only 34
      // commands were specced; §57's payment slice added 8 more manager/owner
      // dashboard commands and the literal went stale. Deriving it means the
      // assertion keeps testing the rule — "staff sees exactly what staff may
      // run" — as the port grows, instead of needing an edit per slice.
      const ownerOnly = COMMAND_SPECS.filter(
        (spec) =>
          spec.surfaces.includes('dashboard') &&
          !(spec.tiers.dashboard ?? []).includes('staff'),
      ).map((spec) => spec.id);
      expect(ownerOnly.length).toBeGreaterThan(1);
      expect(staff).toEqual(owner.filter((c) => !ownerOnly.includes(c)));
    });

    it('never widens beyond the surface list', () => {
      const surfaceWide = specsForSurface(COMMAND_SPECS, 'dashboard').length;
      for (const tier of ['client', 'staff', 'manager', 'owner'] as const) {
        expect(
          specsForActor(COMMAND_SPECS, 'dashboard', tier).length,
        ).toBeLessThanOrEqual(surfaceWide);
      }
    });

    it('offers a dashboard client nothing at all', () => {
      // `AiGatewayService` refuses `client` on the dashboard outright; the specs
      // encode the same conclusion so the planner does not depend on a check
      // living in another file to be safe.
      expect(specsForActor(COMMAND_SPECS, 'dashboard', 'client')).toEqual([]);
    });
  });

  describe('the prompt', () => {
    it('does not mention a command the actor cannot run', () => {
      const staffPrompt = buildPlannerSystemPrompt(
        COMMAND_SPECS,
        'dashboard',
        'staff',
        CONTEXT,
      );
      const ownerPrompt = buildPlannerSystemPrompt(
        COMMAND_SPECS,
        'dashboard',
        'owner',
        CONTEXT,
      );
      expect(ownerPrompt).toContain('appointment.update_bulk');
      expect(staffPrompt).not.toContain('appointment.update_bulk');
    });
  });

  describe('validatePlan', () => {
    it('refuses a command the actor may not run', () => {
      const result = validatePlan(
        COMMAND_SPECS,
        markNoShow,
        'dashboard',
        'staff',
      );
      expect(result.executable).toBe(false);
      expect(result.problems.map((p) => p.code)).toContain(
        'permission_violation',
      );
    });

    it('accepts the identical plan from a permitted actor', () => {
      const result = validatePlan(
        COMMAND_SPECS,
        markNoShow,
        'dashboard',
        'manager',
      );
      expect(result.executable).toBe(true);
    });

    it('accepts the identical plan from the same tier on a surface that permits it', () => {
      const result = validatePlan(
        COMMAND_SPECS,
        markNoShow,
        'provider',
        'staff',
      );
      expect(result.executable).toBe(true);
    });

    it('rejects rather than substituting a command the actor could run', () => {
      // The steal rule applies to permissions too: downgrading a refused command
      // to a permitted neighbour would be the §20 failure with a nicer motive.
      const result = validatePlan(
        COMMAND_SPECS,
        markNoShow,
        'dashboard',
        'staff',
      );
      expect(result.problems.map((p) => p.command)).toEqual([
        'appointment.update_bulk',
      ]);
      expect(result.orderedStepIds).toEqual(['s1']);
      expect(result.executable).toBe(false);
    });

    it('blocks the whole plan, not just the offending step', () => {
      const mixed: CommandPlan = {
        steps: [
          {
            id: 's1',
            command: 'catalog.list_packages',
            variables: {},
            confidence: 0.95,
            dependsOn: [],
          },
          {
            id: 's2',
            command: 'appointment.update_bulk',
            variables: { status: 'no_show' },
            confidence: 0.95,
            dependsOn: [],
          },
        ],
        unresolved: [],
        topicChanged: false,
      };
      expect(
        validatePlan(COMMAND_SPECS, mixed, 'dashboard', 'staff').executable,
      ).toBe(false);
    });

    it('says the actor lacks access without listing who has it', () => {
      const result = validatePlan(
        COMMAND_SPECS,
        markNoShow,
        'dashboard',
        'staff',
      );
      const question = describePlanClarification(result, markNoShow);
      expect(question).toBe(
        "You don't have access to appointment.update_bulk.",
      );
      expect(question).not.toContain('manager');
      expect(question).not.toContain('owner');
    });

    it('reports permission separately from surface legality', () => {
      // A customer command on the dashboard is a surface violation whatever the
      // tier; conflating the two would make the clarify message wrong and the
      // telemetry unusable.
      const customerOnly = planOf('appointment.cancel_mine', {});
      const codes = validatePlan(
        COMMAND_SPECS,
        customerOnly,
        'dashboard',
        'owner',
      ).problems.map((p) => p.code);
      expect(codes).toContain('surface_violation');
      expect(codes).not.toContain('permission_violation');
    });
  });
});
