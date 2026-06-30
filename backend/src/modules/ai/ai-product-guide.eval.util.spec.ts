import {
  AI_COMMAND_EVAL_PRODUCT_GUIDE_CASES,
  AI_COMMAND_EVAL_PRODUCT_GUIDE_DASHBOARD_LLM_CASES,
  AI_COMMAND_EVAL_PRODUCT_GUIDE_MULTILINGUAL_CASES,
  AI_COMMAND_EVAL_PRODUCT_GUIDE_RESCUE_CASES,
  AI_COMMAND_EVAL_PRODUCT_GUIDE_SIMILAR_CASES,
  aiUnavailableGuideScenarioToEvalCase,
  listProductGuideEvalSurfaces,
  productGuideMultilingualScenarioToEvalCase,
  similarAppGuidePromptToEvalCase,
} from './ai-product-guide.eval.util.js';
import { PRODUCT_GUIDE_CLASSIFIER_SCENARIOS } from './ai-product-guide.fixtures.js';
import { AI_UNAVAILABLE_GUIDE_SCENARIOS } from './ai-product-guide-ai-unavailable.fixtures.js';
import { shouldOfferAiUnavailableGuideFallback } from './ai-product-guide-ai-unavailable.util.js';
import { MULTILINGUAL_PRODUCT_GUIDE_EVAL_SCENARIOS } from './ai-product-guide-multilingual.eval.fixtures.js';
import { TOP_APP_GUIDE_FLOWS } from './similar-app-guide-prompts.generated.js';
import { evaluateDeterministicEvalCase } from './eval/ai-command-eval.runner.js';

describe('ai-product-guide.eval.util (ai-guide-1.6.4)', () => {
  it('maps every classifier scenario to a dashboard LLM eval case', () => {
    const ids = new Set(
      AI_COMMAND_EVAL_PRODUCT_GUIDE_DASHBOARD_LLM_CASES.map((row) => row.id),
    );
    for (const scenario of PRODUCT_GUIDE_CLASSIFIER_SCENARIOS) {
      expect(ids.has(`product-guide-classifier-${scenario.id}`)).toBe(true);
    }
  });

  it('covers all four surfaces in similar + multilingual eval cases', () => {
    const surfaces = new Set([
      ...AI_COMMAND_EVAL_PRODUCT_GUIDE_SIMILAR_CASES.map((row) => row.surface),
      ...AI_COMMAND_EVAL_PRODUCT_GUIDE_MULTILINGUAL_CASES.map((row) => row.surface),
    ]);
    expect([...surfaces].sort()).toEqual(listProductGuideEvalSurfaces().sort());
  });

  it('maps one EN v01 similar prompt per top flow', () => {
    expect(AI_COMMAND_EVAL_PRODUCT_GUIDE_SIMILAR_CASES).toHaveLength(
      TOP_APP_GUIDE_FLOWS.length,
    );
    for (const flow of TOP_APP_GUIDE_FLOWS) {
      expect(
        AI_COMMAND_EVAL_PRODUCT_GUIDE_SIMILAR_CASES.some(
          (row) =>
            row.surface === flow.surface &&
            row.id === `product-guide-similar-${flow.surface}-${flow.id}-v01`,
        ),
      ).toBe(true);
    }
  });

  it('maps every multilingual scenario to HY or RU eval case', () => {
    for (const scenario of MULTILINGUAL_PRODUCT_GUIDE_EVAL_SCENARIOS) {
      const evalCase = productGuideMultilingualScenarioToEvalCase(scenario);
      expect(evalCase.locale).toBe(scenario.locale);
      expect(evalCase.surface).toBe(scenario.surface);
      expect(evalCase.expect.useProductGuideRescue).toBe(true);
    }
  });

  it('passes deterministic product guide rescue, enrich, and similar cases', () => {
    const deterministic = [
      ...AI_COMMAND_EVAL_PRODUCT_GUIDE_RESCUE_CASES,
      ...AI_COMMAND_EVAL_PRODUCT_GUIDE_SIMILAR_CASES.filter((row) => !row.requiresLlm),
      ...AI_COMMAND_EVAL_PRODUCT_GUIDE_MULTILINGUAL_CASES,
    ];
    const failures = deterministic.filter(
      (row) => !evaluateDeterministicEvalCase(row).passed,
    );
    if (failures.length > 0) {
      const detail = failures
        .map((row) => `${row.id}: ${evaluateDeterministicEvalCase(row).errors.join('; ')}`)
        .join('\n');
      throw new Error(`Product guide eval failures:\n${detail}`);
    }
    expect(AI_COMMAND_EVAL_PRODUCT_GUIDE_CASES.length).toBeGreaterThanOrEqual(100);
  });

  it('tags LLM-only dashboard classifier/handler cases with requiresLlm', () => {
    for (const row of AI_COMMAND_EVAL_PRODUCT_GUIDE_DASHBOARD_LLM_CASES) {
      expect(row.requiresLlm).toBe(true);
      expect(row.surface).toBe('dashboard');
    }
  });

  it('similarAppGuidePromptToEvalCase preserves surface and topicId', () => {
    const row = AI_COMMAND_EVAL_PRODUCT_GUIDE_SIMILAR_CASES[0]!;
    const evalCase = similarAppGuidePromptToEvalCase({
      id: row.id.replace('product-guide-similar-', ''),
      surface: row.surface!,
      topicId: row.expect.paramsPartial?.topicId as string,
      prompt: row.prompt,
    });
    expect(evalCase.surface).toBe(row.surface);
    expect(evalCase.expect.paramsPartial?.topicId).toBeDefined();
  });

  it('maps every ai-unavailable scenario to a surface-tagged eval case (ai-guide-1.8.10)', () => {
    const ids = new Set(
      AI_COMMAND_EVAL_PRODUCT_GUIDE_CASES.map((row) => row.id),
    );
    for (const scenario of AI_UNAVAILABLE_GUIDE_SCENARIOS) {
      expect(ids.has(`ai-unavailable-guide-${scenario.id}`)).toBe(true);
      const evalCase = aiUnavailableGuideScenarioToEvalCase(scenario);
      expect(evalCase.surface).toBe(scenario.surface);
      expect(evalCase.expect.guideEvalRoute).toBe(scenario.route);
      expect(
        shouldOfferAiUnavailableGuideFallback(scenario.prompt, scenario.surface, {
          context: {
            route: scenario.route,
            assistantMode: scenario.assistantMode,
          },
        }),
      ).toBe(scenario.expectGuide);
    }
  });
});
