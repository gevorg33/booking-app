import {
  decomposeDeterministicForSurface,
} from './intent-decomposition.util.js';
import { COMPOUND_COMMAND_RECIPES } from './ai-command-registry.js';
import { listClinicLabDayCloseLocaleParityGaps } from './ai-clinic-lab-day-close-compound-locale-parity.util.js';
import { listClinicLabReviewLocaleParityGaps } from './ai-clinic-lab-review-compound-locale-parity.util.js';
import {
  AI_COMMAND_EVAL_CLINIC_EXT_COMPOUND_CASES,
  AI_COMMAND_EVAL_DETERMINISTIC_CASES,
  CLINIC_EXT_COMPOUND_RECIPE_IDS,
} from './eval/ai-command-eval.cases.js';
import { evaluateDeterministicEvalCase } from './eval/ai-command-eval.runner.js';
import type { AiCommandEvalCase } from './eval/ai-command-eval.types.js';

function assertClinicExtCompoundEvalCaseHasCompoundSteps(
  evalCase: AiCommandEvalCase,
): void {
  expect(evalCase.expect.compoundSteps?.length).toBeGreaterThanOrEqual(2);
  expect(evalCase.expect.compoundRecipeId).toBeDefined();
  expect(CLINIC_EXT_COMPOUND_RECIPE_IDS).toContain(
    evalCase.expect.compoundRecipeId,
  );
}

function clinicExtCompoundEvalCasesForRecipe(recipeId: string): AiCommandEvalCase[] {
  return AI_COMMAND_EVAL_CLINIC_EXT_COMPOUND_CASES.filter(
    (row) => row.expect.compoundRecipeId === recipeId,
  );
}

describe('ai-clinic-ext-compound eval compoundSteps (parity-3.2, ai-cmd-clinic-6-gap-6.2)', () => {
  it('has HY/RU siblings for every EN lab day close scenario', () => {
    expect(listClinicLabDayCloseLocaleParityGaps()).toEqual([]);
  });

  it('has HY/RU siblings for every EN lab review scenario', () => {
    expect(listClinicLabReviewLocaleParityGaps()).toEqual([]);
  });

  it('registers all clinic ext compound eval cases in deterministic suite', () => {
    const evalIds = new Set(
      AI_COMMAND_EVAL_DETERMINISTIC_CASES.map((row) => row.id),
    );
    for (const row of AI_COMMAND_EVAL_CLINIC_EXT_COMPOUND_CASES) {
      expect(evalIds.has(row.id)).toBe(true);
    }
  });

  it.each([...CLINIC_EXT_COMPOUND_RECIPE_IDS])(
    'recipe %s has eval cases with compoundSteps',
    (recipeId) => {
      const cases = clinicExtCompoundEvalCasesForRecipe(recipeId);
      expect(cases.length).toBeGreaterThanOrEqual(10);
      for (const evalCase of cases) {
        assertClinicExtCompoundEvalCaseHasCompoundSteps(evalCase);
      }
    },
  );

  it('passes deterministic eval runner for every clinic ext compound case', () => {
    const failures: string[] = [];
    for (const evalCase of AI_COMMAND_EVAL_CLINIC_EXT_COMPOUND_CASES) {
      const result = evaluateDeterministicEvalCase(evalCase);
      if (!result.passed) {
        failures.push(`${evalCase.id}: ${result.errors.join('; ')}`);
      }
    }
    expect(failures).toEqual([]);
  });

  it('registry clinic ext recipes decompose with compoundSteps', () => {
    for (const recipeId of CLINIC_EXT_COMPOUND_RECIPE_IDS) {
      const recipe = COMPOUND_COMMAND_RECIPES.find(
        (entry) => entry.id === recipeId,
      );
      expect(recipe).toBeDefined();
      expect(clinicExtCompoundEvalCasesForRecipe(recipeId).length).toBeGreaterThanOrEqual(
        10,
      );
      for (const examplePrompt of recipe!.examplePrompts) {
        const result = decomposeDeterministicForSurface(
          'dashboard',
          examplePrompt,
        );
        expect(result?.recipeId).toBe(recipeId);
        expect(result?.steps.length).toBeGreaterThanOrEqual(2);
      }
    }
  });
});
