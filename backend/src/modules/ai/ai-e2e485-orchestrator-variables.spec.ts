/**
 * e2e-bug.485 — orchestrator-set flags are declared but never offered to the model.
 *
 * A compound recipe writes `tourGroupCheckout`, `resultsThenRebook` and five
 * siblings onto `params` to tell a step which multi-step flow it belongs to.
 * The handlers read them, so C2 is right to require them declared. But every
 * declared optional was rendered into the **planner prompt**
 * (`optional: tourGroupCheckout (boolean)`), so the model was invited to set,
 * from a user's prose, a flag whose only legitimate writer is an orchestrator —
 * a standalone command could take a compound branch because "group" appeared in
 * the sentence.
 *
 * `CommandVariableSpec.source` separates the two concerns the schema could not
 * previously tell apart: **declaration is about what the handler reads;
 * `source` is about who may write it.**
 *
 * The ticket filed this as a design question with three options. This is the
 * one it called "the smallest honest change" — an additive optional field, so
 * every existing spec keeps its meaning and the default stays "the user fills
 * this".
 */
import { COMMAND_SPECS } from './ai-command-spec.registry.js';
import { buildPlannerSystemPrompt } from './ai-command-plan.prompt.js';
import type { CommandSpec } from './ai-command-spec.types.js';

const ORCHESTRATOR_FLAGS = [
  'resultsThenRebook',
  'tourGroupCheckout',
  'completeIntakeAndBook',
  'guestLookup',
  'providerSameDayMulti',
  'subscriptionFirstVisit',
  'bookingFirstAvailable',
] as const;

const specs = COMMAND_SPECS as unknown as CommandSpec[];

const declarationsOf = (flag: string) =>
  specs.flatMap((s) =>
    Object.entries(s.variables ?? {})
      .filter(([name]) => name === flag)
      .map(([, v]) => ({ command: s.id, v: v as any })),
  );

describe('e2e-bug.485 — orchestrator flags', () => {
  it.each(ORCHESTRATOR_FLAGS)(
    'every declaration of %s is marked source: orchestrator',
    (flag) => {
      const declared = declarationsOf(flag);
      expect(declared.length).toBeGreaterThan(0);
      for (const d of declared) {
        expect(d.v.source).toBe('orchestrator');
        // Never required — an orchestrator flag the model must supply would be
        // unsatisfiable, since the model is no longer told it exists.
        expect(d.v.required).toBe(false);
      }
    },
  );

  it('none of them appears in the planner prompt on any surface', () => {
    // The actual defect: these were printed as `optional: <flag> (boolean)`.
    const context = { today: '2026-08-20', timeZone: 'UTC' } as any;
    const surfaces = ['dashboard', 'customer', 'public', 'provider'] as const;
    const tiers = ['owner', 'client', 'guest', 'M'] as const;

    for (const surface of surfaces) {
      for (const tier of tiers) {
        let prompt: string;
        try {
          prompt = buildPlannerSystemPrompt(
            specs,
            surface as any,
            tier as any,
            context,
          );
        } catch {
          continue; // surface/tier combination not valid; nothing to assert
        }
        for (const flag of ORCHESTRATOR_FLAGS) {
          expect(prompt).not.toContain(flag);
        }
      }
    }
  });

  it('ordinary optional variables are still offered', () => {
    // Guards the filter being too broad — if it dropped every optional, the
    // assertion above would pass for the wrong reason.
    const prompt = buildPlannerSystemPrompt(
      specs,
      'dashboard' as any,
      'owner' as any,
      { today: '2026-08-20', timeZone: 'UTC' } as any,
    );
    expect(prompt).toContain('optional:');
  });
});
