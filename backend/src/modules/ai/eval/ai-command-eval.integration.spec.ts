import { CommandComplexityRouterService } from '../command-complexity-router.service.js';
import { IntentDecompositionService } from '../intent-decomposition.service.js';
import { COMPOUND_DECOMPOSITION_SCENARIOS } from '../intent-decomposition.fixtures.js';
import { decomposeDeterministicForSurface } from '../intent-decomposition.util.js';
import {
  AI_COMMAND_EVAL_CASES,
  AI_COMMAND_EVAL_COMPOUND_CASES,
  AI_COMMAND_EVAL_DETERMINISTIC_CASES,
  compoundScenarioToEvalCase,
} from './ai-command-eval.cases.js';
import {
  evaluateDeterministicEvalCase,
  runDeterministicEvalSuite,
} from './ai-command-eval.runner.js';

describe('ai-command-eval integration (ai-cmd-0.4)', () => {
  const llm = { completeJson: jest.fn() };
  const decomposition = new IntentDecompositionService(llm as any);
  const router = new CommandComplexityRouterService(decomposition);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('aligns eval compound routing with decomposition service output', async () => {
    const scenario = COMPOUND_DECOMPOSITION_SCENARIOS.find(
      (entry) => entry.id === 'customer_golden_book_package_promo',
    )!;
    const evalCase = compoundScenarioToEvalCase(scenario);

    const route = router.routeDeterministic(evalCase.prompt);
    expect(route.tier).toBe('compound');
    expect(route.useDecomposition).toBe(true);

    const evalResult = evaluateDeterministicEvalCase(evalCase);
    expect(evalResult.passed).toBe(true);

    const runtimeSteps = await decomposition.decompose(
      'biz-1',
      'cust-1',
      evalCase.prompt,
      'UTC',
      scenario.surface,
    );
    expect(runtimeSteps.map((step) => step.action)).toEqual(
      evalCase.expect.compoundSteps,
    );
    expect(llm.completeJson).not.toHaveBeenCalled();
  });

  it('routes dashboard golden cancel+waitlist as compound without LLM', async () => {
    const prompt =
      'Cancel package visit for customer Anna and notify waitlist about the slot';
    expect(router.routeDeterministic(prompt).tier).toBe('compound');

    const steps = await decomposition.decompose(
      'biz-1',
      undefined,
      prompt,
      'UTC',
      'dashboard',
    );
    expect(steps.map((step) => step.action)).toEqual([
      'cancel_package_visit',
      'fill_slot_from_waitlist',
    ]);
    expect(llm.completeJson).not.toHaveBeenCalled();
  });

  it.each(
    COMPOUND_DECOMPOSITION_SCENARIOS.filter(
      (scenario) => !scenario.expectEmpty,
    ),
  )('eval + decomposition agree for scenario $id', async (scenario) => {
    const evalCase = compoundScenarioToEvalCase(scenario);
    const deterministic = decomposeDeterministicForSurface(
      scenario.surface,
      scenario.prompt,
    );
    const evalResult = evaluateDeterministicEvalCase(evalCase);

    expect(evalResult.passed).toBe(true);
    expect(deterministic?.steps.length ?? 0).toBeGreaterThanOrEqual(
      scenario.minSteps ?? 2,
    );

    if (scenario.noLlm) {
      const runtime = await decomposition.decompose(
        'biz-1',
        'actor-1',
        scenario.prompt,
        'UTC',
        scenario.surface,
      );
      expect(runtime.length).toBeGreaterThanOrEqual(scenario.minSteps ?? 2);
      expect(llm.completeJson).not.toHaveBeenCalled();
    }
  });

  it('eval suite passes for full deterministic golden catalog', () => {
    const summary = runDeterministicEvalSuite(
      AI_COMMAND_EVAL_DETERMINISTIC_CASES,
    );
    expect(summary.failed).toBe(0);
    expect(summary.passed).toBe(AI_COMMAND_EVAL_DETERMINISTIC_CASES.length);
  });

  it('covers multi-command split variants in eval compound cases', () => {
    const splitCases = AI_COMMAND_EVAL_COMPOUND_CASES.filter((entry) =>
      /semicolon|then_split/.test(entry.id),
    );
    expect(splitCases.length).toBeGreaterThanOrEqual(2);
    for (const evalCase of splitCases) {
      expect(evaluateDeterministicEvalCase(evalCase).passed).toBe(true);
    }
  });

  it('evaluates every hand-crafted per-intent compound case in AI_COMMAND_EVAL_CASES', () => {
    const handcrafted = AI_COMMAND_EVAL_CASES.filter((entry) =>
      entry.id.startsWith('compound-'),
    );
    expect(handcrafted.length).toBeGreaterThanOrEqual(8);
    for (const evalCase of handcrafted) {
      expect(evaluateDeterministicEvalCase(evalCase).passed).toBe(true);
    }
  });

  it('skips route tier for and-only prompts that still decompose deterministically', () => {
    const evalCase = compoundScenarioToEvalCase({
      id: 'and_only_no_route_tier',
      surface: 'dashboard',
      prompt: 'List gift card orders and print packing slip',
      minSteps: 2,
      actions: ['list_gift_card_orders', 'print_packing_slip'],
    });
    expect(evalCase.expect.routeTier).toBeUndefined();
    expect(evaluateDeterministicEvalCase(evalCase).passed).toBe(true);
  });

  it('returns empty runtime decomposition for public compound without deterministic handler', async () => {
    const prompt = 'List providers and check availability';
    expect(router.routeDeterministic(prompt).tier).toBe('compound');
    const steps = await decomposition.decompose(
      'biz-1',
      undefined,
      prompt,
      'UTC',
      'public',
    );
    expect(steps).toEqual([]);
    expect(llm.completeJson).not.toHaveBeenCalled();
  });
});
