import { AI_COMMAND_EVAL_COMPOUND_CASES } from './eval/ai-command-eval.cases.js';
import { evaluateDeterministicEvalCase } from './eval/ai-command-eval.runner.js';
import { IntentDecompositionService } from './intent-decomposition.service.js';
import { buildDecompositionSchemaView } from './intent-decomposition.schema.js';
import { COMPOUND_DECOMPOSITION_SCENARIOS } from './intent-decomposition.fixtures.js';
import { GOLDEN_COMPOUND_PROMPT_BY_ID } from './ai-rescue-pipeline.fixtures.js';
import {
  decomposeDeterministicForSurface,
  GOLDEN_COMPOUND_PATTERNS,
  GOLDEN_COMPOUND_PATTERN_IDS,
} from './intent-decomposition.util.js';
import { getCompoundRecipesForSurface } from './ai-command-registry.util.js';
import { COMPOUND_COMMAND_RECIPES } from './ai-command-registry.js';
import type { CompoundScenarioExpectation } from './intent-decomposition.fixtures.js';

function assertScenario(
  scenario: CompoundScenarioExpectation,
  steps: Array<{ action: string; params: Record<string, unknown> }>,
) {
  if (scenario.expectEmpty) {
    expect(steps).toEqual([]);
    return;
  }

  if (scenario.orderedActions) {
    expect(steps.map((step) => step.action)).toEqual(scenario.orderedActions);
  }
  if (scenario.minSteps) {
    expect(steps.length).toBeGreaterThanOrEqual(scenario.minSteps);
  }
  if (scenario.actions) {
    expect(steps.map((step) => step.action)).toEqual(
      expect.arrayContaining(scenario.actions),
    );
  }
  for (const check of scenario.paramChecks ?? []) {
    const step = steps[check.stepIndex];
    expect(step).toBeDefined();
    if (check.value !== undefined) {
      const actual = step.params[check.key];
      if (Array.isArray(check.value)) {
        expect(actual).toEqual(check.value);
      } else {
        expect(actual).toBe(check.value);
      }
    } else {
      expect(step.params[check.key]).toBeDefined();
    }
  }
}

describe('intent-decomposition integration (ai-cmd-0.3)', () => {
  const llm = { completeJson: jest.fn() };
  let service: IntentDecompositionService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new IntentDecompositionService(llm as any);
  });

  it('wires registry compound recipes to decomposition schema per surface', () => {
    for (const surface of [
      'dashboard',
      'provider',
      'customer',
      'public',
    ] as const) {
      const schema = buildDecompositionSchemaView(surface);
      const recipes = getCompoundRecipesForSurface(surface);
      expect(schema.recipeIds.sort()).toEqual(
        recipes.map((recipe) => recipe.id).sort(),
      );
      for (const recipe of recipes) {
        for (const intentId of recipe.allowedStepIntentIds) {
          expect(schema.allowedActions).toContain(intentId);
        }
      }
    }
  });

  it.each(COMPOUND_DECOMPOSITION_SCENARIOS)(
    'deterministic scenario $id decomposes on $surface',
    (scenario) => {
      const result = decomposeDeterministicForSurface(
        scenario.surface,
        scenario.prompt,
      );
      if (scenario.expectEmpty) {
        expect(result).toBeNull();
        return;
      }
      expect(result?.steps.length).toBeGreaterThanOrEqual(
        scenario.minSteps ?? 2,
      );
      assertScenario(scenario, result?.steps ?? []);
    },
  );

  it.each(
    COMPOUND_DECOMPOSITION_SCENARIOS.filter(
      (scenario) => scenario.noLlm && !scenario.expectEmpty,
    ),
  )(
    'runtime scenario $id resolves without LLM on $surface',
    async (scenario) => {
      const steps = await service.decompose(
        'biz-1',
        'actor-1',
        scenario.prompt,
        'UTC',
        scenario.surface,
      );
      assertScenario(scenario, steps);
      expect(llm.completeJson).not.toHaveBeenCalled();
    },
  );

  it('covers all golden compound pattern ids end-to-end', () => {
    expect(GOLDEN_COMPOUND_PATTERN_IDS).toEqual(
      GOLDEN_COMPOUND_PATTERNS.map((pattern) => pattern.id),
    );

    for (const pattern of GOLDEN_COMPOUND_PATTERNS) {
      const prompt = GOLDEN_COMPOUND_PROMPT_BY_ID[pattern.id];
      expect(prompt).toBeDefined();
      expect(pattern.matches(prompt)).toBe(true);
      const result = decomposeDeterministicForSurface(pattern.surface, prompt);
      expect(result?.source).toBe('golden');
      expect(result?.recipeId).toBe(pattern.recipeId);
      expect(result?.steps.length).toBeGreaterThanOrEqual(2);
    }
  });

  it('decomposes registry example prompts with deterministic handlers', () => {
    const deterministicRecipes = COMPOUND_COMMAND_RECIPES.filter(
      (recipe) => recipe.decomposeUtil && !recipe.llmDecompose,
    );
    expect(deterministicRecipes.length).toBeGreaterThan(5);

    for (const recipe of deterministicRecipes) {
      for (const examplePrompt of recipe.examplePrompts) {
        const surface = recipe.surfaces[0];
        const result = decomposeDeterministicForSurface(surface, examplePrompt);
        if (result) {
          expect(result.steps.length).toBeGreaterThanOrEqual(2);
          const schema = buildDecompositionSchemaView(surface);
          for (const step of result.steps) {
            expect(schema.allowedActions).toContain(step.action);
          }
        }
      }
    }
  });

  it('falls back to LLM for dashboard operational compounds without deterministic match', async () => {
    llm.completeJson.mockResolvedValue({
      intents: [
        {
          action: 'summarize_day',
          params: {},
          reasoning: 'Summarize operations',
        },
        {
          action: 'list_bookings',
          params: { customerName: 'Maria' },
          reasoning: 'List bookings',
        },
      ],
    });

    const steps = await service.decompose(
      'biz-1',
      'owner-1',
      'Summarize today and then list all bookings for Maria',
      'America/New_York',
      'dashboard',
    );
    expect(steps).toHaveLength(2);
    expect(llm.completeJson).toHaveBeenCalledTimes(1);
    expect(llm.completeJson.mock.calls[0][1]).toContain('bulk_smart_cancel');
    expect(llm.completeJson.mock.calls[0][1]).toContain('Current date:');
  });

  it('registers llm-backed dashboard operational compound in registry', () => {
    const recipe = COMPOUND_COMMAND_RECIPES.find(
      (entry) => entry.id === 'dashboard_operational_compound',
    );
    expect(recipe?.llmDecompose).toBe(true);
    expect(recipe?.decomposeUtil).toBe(
      'IntentDecompositionService.decomposePrompt',
    );
    expect(recipe?.examplePrompts.length).toBeGreaterThan(0);
  });

  it('decomposePrompt and decompose return identical runtime results', async () => {
    const prompt = 'Cancel package visit and notify waitlist for Friday';
    const viaDecompose = await service.decompose(
      'biz-1',
      undefined,
      prompt,
      'UTC',
      'dashboard',
    );
    const viaDecomposePrompt = await service.decomposePrompt(
      'biz-1',
      undefined,
      prompt,
      'UTC',
      'dashboard',
    );
    expect(viaDecomposePrompt).toEqual(viaDecompose);
  });

  it('keeps eval golden compound cases aligned with decomposition runtime', async () => {
    const positiveCases = AI_COMMAND_EVAL_COMPOUND_CASES.filter(
      (entry) => !entry.expect.compoundExpectEmpty,
    );
    expect(positiveCases.length).toBeGreaterThanOrEqual(15);

    for (const evalCase of positiveCases) {
      expect(evaluateDeterministicEvalCase(evalCase).passed).toBe(true);
      const steps = await service.decompose(
        'biz-1',
        'actor-1',
        evalCase.prompt,
        'UTC',
        evalCase.expect.compoundSurface ?? 'dashboard',
      );
      if (evalCase.expect.compoundSteps) {
        expect(steps.map((step) => step.action)).toEqual(
          evalCase.expect.compoundSteps,
        );
      } else {
        expect(steps.length).toBeGreaterThanOrEqual(
          evalCase.expect.compoundMinSteps ?? 2,
        );
      }
    }
    expect(llm.completeJson).not.toHaveBeenCalled();
  });

  it('returns empty runtime when compound markers are absent even if util decomposes', async () => {
    const prompt = 'List gift card orders and print packing slip';
    expect(
      decomposeDeterministicForSurface('dashboard', prompt)?.steps.length,
    ).toBeGreaterThanOrEqual(2);
    const runtime = await service.decompose(
      'biz-1',
      undefined,
      prompt,
      'UTC',
      'dashboard',
    );
    expect(runtime).toEqual([]);
    expect(llm.completeJson).not.toHaveBeenCalled();
  });

  it('decomposes semicolon and then split variants without LLM', async () => {
    const variants = [
      {
        prompt: 'List subscriptions for Anna; tag customer as VIP',
        actions: ['list_customer_subscriptions', 'tag_customer'],
      },
      {
        prompt: 'Summarize unpaid bookings then export accounting',
        actions: ['summarize_unpaid', 'export_accounting'],
      },
    ];
    for (const variant of variants) {
      const steps = await service.decompose(
        'biz-1',
        undefined,
        variant.prompt,
        'UTC',
        'dashboard',
      );
      expect(steps.map((step) => step.action)).toEqual(variant.actions);
    }
    expect(llm.completeJson).not.toHaveBeenCalled();
  });

  it('truncates deterministic steps to schema maxSteps at runtime', async () => {
    const longPrompt =
      'List subscriptions for Anna and tag customer as VIP and export customer data';
    const deterministic = decomposeDeterministicForSurface(
      'dashboard',
      longPrompt,
    );
    if (!deterministic || deterministic.steps.length < 3) return;

    const schema = buildDecompositionSchemaView('dashboard');
    const runtime = await service.decompose(
      'biz-1',
      undefined,
      longPrompt,
      'UTC',
      'dashboard',
    );
    expect(runtime.length).toBeLessThanOrEqual(schema.maxSteps);
  });
});
