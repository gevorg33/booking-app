import {
  decidePlannerRoute,
  plannerExecuteDomains,
  PLANNER_EXECUTE_DOMAINS_KEY,
  RETIRED_DETECTOR_DOMAINS,
} from './ai-planner-route.util.js';
import { RESCUE_ACTION_LOCKED_DOMAINS } from './ai-rescue-steal-guard.js';
import type {
  CommandPlan,
  PlanValidationResult,
} from './ai-command-plan.types.js';
import type { CommandSpec } from './ai-command-spec.types.js';

const spec = (over: Partial<CommandSpec> = {}): CommandSpec => ({
  id: 'tour.list_calendar_week',
  aliases: ['list_tour_calendar_week'],
  domain: 'tour',
  surfaces: ['dashboard'],
  tiers: { dashboard: ['owner'] },
  risk: 'T0',
  description: 'd',
  variables: {},
  examples: [],
  confirm: 'never',
  handler: 'H',
  ...over,
});

const plan = (over: Partial<CommandPlan> = {}): CommandPlan => ({
  steps: [
    {
      id: 's1',
      command: 'tour.list_calendar_week',
      variables: { week: 'this' },
      confidence: 0.9,
      dependsOn: [],
    },
  ],
  unresolved: [],
  topicChanged: false,
  ...over,
});

const ok = (
  over: Partial<PlanValidationResult> = {},
): PlanValidationResult => ({
  executable: true,
  orderedStepIds: ['s1'],
  problems: [],
  requiresConfirmation: false,
  highestRisk: 'T0',
  ...over,
});

describe('plannerExecuteDomains', () => {
  it('returns the retired domains when unset — they are not configurable', () => {
    // §93 — once a slice's detectors no longer route, the planner is the only
    // thing that does. Making that depend on an env var would mean a missing
    // variable silently costs the slice its traffic.
    expect([...plannerExecuteDomains({})].sort()).toEqual(
      [...RETIRED_DETECTOR_DOMAINS].sort(),
    );
  });

  it('falls back to the retired domains for blank or whitespace', () => {
    for (const raw of ['', '  , ,']) {
      expect(
        [
          ...plannerExecuteDomains({ [PLANNER_EXECUTE_DOMAINS_KEY]: raw }),
        ].sort(),
      ).toEqual([...RETIRED_DETECTOR_DOMAINS].sort());
    }
  });

  it('the flag adds to the retired domains, never replaces them', () => {
    const d = plannerExecuteDomains({
      [PLANNER_EXECUTE_DOMAINS_KEY]: 'payment',
    });
    expect(d.has('payment')).toBe(true);
    for (const retired of RETIRED_DETECTOR_DOMAINS)
      expect(d.has(retired)).toBe(true);
  });

  it('every retired domain is locked against rescue changing the action', () => {
    // The two lists are one decision — a domain the planner routes but rescue
    // can still override is a slice that was never actually retired.
    for (const domain of RETIRED_DETECTOR_DOMAINS) {
      expect(RESCUE_ACTION_LOCKED_DOMAINS).toContain(domain);
    }
  });

  it('parses a comma list, trimming and lowercasing', () => {
    const d = plannerExecuteDomains({
      [PLANNER_EXECUTE_DOMAINS_KEY]: ' Payment , Catalog ',
    });
    expect(d.has('payment')).toBe(true);
    expect(d.has('catalog')).toBe(true);
  });
});

describe('decidePlannerRoute', () => {
  const enabled = new Set(['tour']);
  const specs = [spec()];

  it('routes a single-step executable plan in an enabled domain', () => {
    const d = decidePlannerRoute(plan(), ok(), specs, enabled);
    expect(d.routed).toBe(true);
    if (!d.routed) return;
    // The executor dispatches on the legacy name, not the spec id.
    expect(d.route.action).toBe('list_tour_calendar_week');
    expect(d.route.command).toBe('tour.list_calendar_week');
    expect(d.route.params).toEqual({ week: 'this' });
    expect(d.route.confidence).toBe(0.9);
  });

  it('copies the variables rather than aliasing the plan', () => {
    const p = plan();
    const d = decidePlannerRoute(p, ok(), specs, enabled);
    if (!d.routed) throw new Error('expected route');
    d.route.params.week = 'mutated';
    expect(p.steps[0].variables.week).toBe('this');
  });

  it('declines when no domain is enabled — the default', () => {
    const d = decidePlannerRoute(plan(), ok(), specs, new Set());
    expect(d).toEqual({ routed: false, reason: 'disabled' });
  });

  it('declines a domain that is not enabled', () => {
    const d = decidePlannerRoute(plan(), ok(), specs, new Set(['payment']));
    expect(d).toEqual({ routed: false, reason: 'domain_not_enabled' });
  });

  it('declines a non-executable plan rather than re-deciding validation', () => {
    const d = decidePlannerRoute(
      plan(),
      ok({ executable: false }),
      specs,
      enabled,
    );
    expect(d).toEqual({ routed: false, reason: 'not_executable' });
  });

  it('declines a multi-step plan — running only step one would be dishonest', () => {
    const p = plan();
    const d = decidePlannerRoute(
      { ...p, steps: [p.steps[0], { ...p.steps[0], id: 's2' }] },
      ok(),
      specs,
      enabled,
    );
    expect(d).toEqual({ routed: false, reason: 'not_single_step' });
  });

  it('declines an empty plan', () => {
    const d = decidePlannerRoute(
      { ...plan(), steps: [] },
      ok(),
      specs,
      enabled,
    );
    expect(d).toEqual({ routed: false, reason: 'not_single_step' });
  });

  it('routes a confirm-required plan and flags it — e2e-bug.404', () => {
    // This used to be a refusal, and §120 measured it rejecting 24 of 121
    // rescue-dependent prompts: every mutating command the planner could name.
    // The confirmation is now enforced at the execute gate instead, so the
    // route is allowed to exist.
    const d = decidePlannerRoute(
      plan(),
      ok({ requiresConfirmation: true }),
      specs,
      enabled,
    );
    expect(d.routed).toBe(true);
    expect(d.routed && d.route.requiresConfirmation).toBe(true);
  });

  it('reports requiresConfirmation false when the plan does not need one', () => {
    const d = decidePlannerRoute(plan(), ok(), specs, enabled);
    expect(d.routed && d.route.requiresConfirmation).toBe(false);
  });

  it('declines a command with no spec', () => {
    const d = decidePlannerRoute(plan(), ok(), [], enabled);
    expect(d).toEqual({ routed: false, reason: 'unknown_command' });
  });

  it('declines a spec with no legacy alias', () => {
    const d = decidePlannerRoute(
      plan(),
      ok(),
      [spec({ aliases: [] })],
      enabled,
    );
    expect(d).toEqual({ routed: false, reason: 'no_legacy_alias' });
  });

  it('matches the domain case-insensitively', () => {
    const d = decidePlannerRoute(
      plan(),
      ok(),
      [spec({ domain: 'Tour' })],
      enabled,
    );
    expect(d.routed).toBe(true);
  });

  it('every rejection names a reason, so a skip is never unexplained', () => {
    const cases: Array<
      [CommandPlan, PlanValidationResult, CommandSpec[], Set<string>]
    > = [
      [plan(), ok(), specs, new Set()],
      [plan(), ok({ executable: false }), specs, enabled],
      [{ ...plan(), steps: [] }, ok(), specs, enabled],
      // `requiresConfirmation: true` is deliberately absent — it stopped being a
      // rejection in e2e-bug.404 and now routes with the flag set.
      [plan(), ok(), [], enabled],
      [plan(), ok(), [spec({ aliases: [] })], enabled],
      [plan(), ok(), specs, new Set(['other'])],
    ];
    for (const [p, v, s, e] of cases) {
      const d = decidePlannerRoute(p, v, s, e);
      expect(d.routed).toBe(false);
      if (!d.routed) expect(typeof d.reason).toBe('string');
    }
  });
});
