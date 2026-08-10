/**
 * AI-ROADMAP Phase 3 — golden plan assertions.
 *
 * `PLAN_FIXTURES` already declares what each multi-command message *should*
 * become. Until now those plans were only fed to the validator directly, which
 * proves the validator works but says nothing about the planner. This file
 * closes that: every fixture is driven through the real
 * `AiCommandPlannerService` — prompt assembly → model response → decode →
 * repair → validate → trace — and the plan that comes out the far end must
 * equal the golden plan exactly.
 *
 * The model itself is stubbed. That is deliberate, not a shortcut: an LLM call
 * makes a test non-deterministic, slow and billable, and none of the three
 * failure modes this suite exists to catch live in the model.
 *
 *   1. The shortlist omits a command the plan needs, so the model was never
 *      told it existed.
 *   2. Decoding silently drops, reorders or invents part of a valid plan.
 *   3. Validation approves something it must refuse — a surface violation, an
 *      unknown command, a missing required variable.
 *
 * Model *accuracy* is a different question, measured on real traffic by the
 * §19 shadow run, not here.
 */
import { AiCommandPlannerService } from './ai-command-planner.service.js';
import { PLAN_FIXTURES, type PlanFixture } from './ai-command-plan.fixtures.js';
import { buildPlannerMessages } from './ai-command-plan.prompt.js';
import { buildPlanTraceFields } from './ai-command-plan.trace.js';
import { COMMAND_SPECS } from './ai-command-spec.registry.js';
import { buildPlannerShortlist } from './ai-command-spec.derive.js';
import type { CommandPlan } from './ai-command-plan.types.js';

const CONTEXT = { today: '2026-08-03', timeZone: 'UTC' };

/** Exactly the JSON the output contract asks the model for. */
function asModelResponse(plan: CommandPlan): string {
  return JSON.stringify({
    steps: plan.steps.map((s) => ({
      id: s.id,
      command: s.command,
      variables: s.variables,
      confidence: s.confidence,
      dependsOn: s.dependsOn,
    })),
    unresolved: plan.unresolved,
    topicChanged: plan.topicChanged,
  });
}

function plannerReturning(content: string | null) {
  const calls: unknown[] = [];
  const openAi = {
    chatCompletion: async (ctx: unknown, params: unknown) => {
      calls.push({ ctx, params });
      return content === null
        ? { choices: [] }
        : { choices: [{ message: { content } }] };
    },
  };
  return {
    planner: new AiCommandPlannerService(openAi as never),
    calls,
  };
}

async function planFor(fixture: PlanFixture, response: string) {
  const { planner } = plannerReturning(response);
  return planner.plan({
    businessId: 'biz-1',
    surface: fixture.surface,
    tier: fixture.tier,
    message: fixture.message,
    context: CONTEXT,
  });
}

describe('golden plans — every fixture survives the full planner path', () => {
  it.each(PLAN_FIXTURES.map((f) => [f.id, f] as const))(
    '%s: decodes back to exactly the golden plan',
    async (_id, fixture) => {
      const outcome = await planFor(fixture, asModelResponse(fixture.plan));

      expect(outcome.status).not.toBe('unavailable');
      if (outcome.status === 'unavailable') return;

      // Nothing added, dropped, reordered or rewritten in transit.
      expect(outcome.plan).toEqual(fixture.plan);
      expect(outcome.repairs).toEqual([]);
    },
  );

  it.each(PLAN_FIXTURES.map((f) => [f.id, f] as const))(
    '%s: reaches the executable/clarify verdict the fixture declares',
    async (_id, fixture) => {
      const outcome = await planFor(fixture, asModelResponse(fixture.plan));
      if (outcome.status === 'unavailable') throw new Error('unexpected');

      expect(outcome.validation.executable).toBe(fixture.expectExecutable);
      expect(outcome.status).toBe(
        fixture.expectExecutable ? 'executable' : 'clarify',
      );
    },
  );

  it.each(
    PLAN_FIXTURES.filter((f) => f.expectExecutable).map(
      (f) => [f.id, f] as const,
    ),
  )(
    '%s: every command it needs is actually offered to the model',
    (_id, fixture) => {
      // The most invisible failure mode: a plan that is impossible because the
      // shortlist never mentioned the command. Executable fixtures only —
      // the surface-violation fixture is correct *because* its command is
      // absent from the dashboard shortlist.
      const offered = new Set(
        buildPlannerShortlist(COMMAND_SPECS, fixture.surface, fixture.tier).map(
          (e) => e.command,
        ),
      );
      for (const step of fixture.plan.steps) {
        expect(offered.has(step.command)).toBe(true);
      }
    },
  );

  it.each(PLAN_FIXTURES.map((f) => [f.id, f] as const))(
    '%s: the prompt carries the message and grounds relative dates',
    (_id, fixture) => {
      const messages = buildPlannerMessages(
        COMMAND_SPECS,
        fixture.surface,
        fixture.tier,
        CONTEXT,
        fixture.message,
      );
      expect(messages[messages.length - 1]).toEqual({
        role: 'user',
        content: fixture.message,
      });
      // "tomorrow at 3 PM" is only resolvable if the model is told the date.
      expect(messages[0].content).toContain('2026-08-03');
    },
  );
});

describe('golden plans — the headline example', () => {
  const headline = PLAN_FIXTURES.find(
    (f) => f.id === 'headline-three-commands-one-unsupported',
  )!;

  it('extracts all three commands rather than collapsing to one', async () => {
    // `compound_intent` fails 61.8% of the time in production, and 33 traces
    // show a multi-command request collapsed into a single command.
    const outcome = await planFor(headline, asModelResponse(headline.plan));
    if (outcome.status === 'unavailable') throw new Error('unexpected');

    expect(outcome.plan.steps).toHaveLength(3);
    expect(outcome.plan.steps.map((s) => s.command)).toEqual([
      'appointment.reschedule',
      'appointment.cancel_bulk',
      'patient.create',
    ]);
  });

  it('refuses to execute because the platform has no create-customer command', async () => {
    const outcome = await planFor(headline, asModelResponse(headline.plan));
    if (outcome.status === 'unavailable') throw new Error('unexpected');

    expect(outcome.status).toBe('clarify');
    const unknown = outcome.validation.problems.filter(
      (p) => p.code === 'unknown_command',
    );
    expect(unknown).toHaveLength(1);
    expect(unknown[0].stepId).toBe('s3');
  });

  it('names the unsupported step in the clarification instead of failing generically', async () => {
    const outcome = await planFor(headline, asModelResponse(headline.plan));
    if (outcome.status === 'unavailable') throw new Error('unexpected');
    if (outcome.status !== 'clarify') throw new Error('expected clarify');

    expect(outcome.question).toContain('patient.create');
  });

  it('is not executable, so no step runs — not even the two valid ones', async () => {
    const outcome = await planFor(headline, asModelResponse(headline.plan));
    if (outcome.status === 'unavailable') throw new Error('unexpected');

    // `executable` is the only execution permit. `orderedStepIds` is still
    // populated (the order is previewable and useful), which is exactly why
    // the Phase 5 executor must gate on `executable` and never on this list
    // being non-empty — pinned here so that contract cannot drift silently.
    expect(outcome.validation.executable).toBe(false);
    expect(outcome.validation.orderedStepIds).toEqual(['s1', 's2', 's3']);
    expect(outcome.status).toBe('clarify');
  });
});

describe('golden plans — dependency wiring', () => {
  const dependent = PLAN_FIXTURES.find(
    (f) => f.id === 'dependent-steps-with-output-reference',
  )!;

  it('preserves the $s1.field reference through decode', async () => {
    const outcome = await planFor(dependent, asModelResponse(dependent.plan));
    if (outcome.status === 'unavailable') throw new Error('unexpected');

    expect(outcome.plan.steps[1].variables.categoryName).toBe(
      '$s1.categoryName',
    );
    expect(outcome.plan.steps[1].dependsOn).toEqual(['s1']);
  });

  it('orders the dependency before its consumer', async () => {
    const outcome = await planFor(dependent, asModelResponse(dependent.plan));
    if (outcome.status === 'unavailable') throw new Error('unexpected');

    expect(outcome.validation.orderedStepIds).toEqual(['s1', 's2']);
  });
});

describe('golden plans — the planner refuses near-misses', () => {
  const supported = PLAN_FIXTURES.find(
    (f) => f.id === 'multi-command-all-supported',
  )!;

  function mutateFirstCommand(command: string): string {
    return asModelResponse({
      ...supported.plan,
      steps: supported.plan.steps.map((s, i) =>
        i === 0 ? { ...s, command } : s,
      ),
    });
  }

  it('rejects a command that does not exist instead of picking a near neighbour', async () => {
    const outcome = await planFor(
      supported,
      mutateFirstCommand('appointment.move'),
    );
    if (outcome.status === 'unavailable') throw new Error('unexpected');

    expect(outcome.status).toBe('clarify');
    expect(
      outcome.validation.problems.some((p) => p.code === 'unknown_command'),
    ).toBe(true);
    // Crucially: not silently rewritten to the real `appointment.reschedule`.
    expect(outcome.plan.steps[0].command).toBe('appointment.move');
  });

  it('rejects a customer-only command arriving on the dashboard', async () => {
    const outcome = await planFor(
      supported,
      mutateFirstCommand('appointment.cancel_mine'),
    );
    if (outcome.status === 'unavailable') throw new Error('unexpected');

    expect(
      outcome.validation.problems.some((p) => p.code === 'surface_violation'),
    ).toBe(true);
  });

  it('reports unavailable rather than inventing a plan when the model says nothing', async () => {
    const { planner } = plannerReturning(null);
    const outcome = await planner.plan({
      businessId: 'biz-1',
      surface: 'dashboard',
      tier: 'owner',
      message: supported.message,
      context: CONTEXT,
    });

    expect(outcome.status).toBe('unavailable');
  });
});

describe('golden plans — telemetry stays faithful to the plan', () => {
  it.each(PLAN_FIXTURES.map((f) => [f.id, f] as const))(
    '%s: trace fields match the plan that ran',
    async (_id, fixture) => {
      const outcome = await planFor(fixture, asModelResponse(fixture.plan));
      if (outcome.status === 'unavailable') throw new Error('unexpected');

      const fields = buildPlanTraceFields(outcome);
      expect(fields.planStepCount).toBe(fixture.plan.steps.length);
      expect(fields.planCommands).toEqual(
        fixture.plan.steps.map((s) => s.command),
      );
      expect(fields.planOutcome).toBe(outcome.status);
    },
  );
});
