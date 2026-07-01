import { RESULTS_THEN_REBOOK_COMPOUND_PROMPTS } from './ai-results-then-rebook-compound.fixtures.js';
import { RESULTS_THEN_REBOOK_MULTILINGUAL_SCENARIOS } from './ai-results-then-rebook-compound-multilingual.fixtures.js';
import {
  decomposeDeterministicForSurface,
  GOLDEN_COMPOUND_PATTERNS,
  isCompoundPrompt,
} from './intent-decomposition.util.js';
import { RESULTS_THEN_REBOOK_RECIPE_ID } from './ai-results-then-rebook-compound.util.js';
import { isExplainResultStatusPrompt } from './ai-consumer-clinic-test-results.util.js';
import { isRebookLastAppointmentPrompt } from './ai-rebook-last-appointment.util.js';

describe('AiResultsThenRebookCompound integration (ai-cmd-customer-4.21.5)', () => {
  it('registers customer_results_then_rebook golden pattern', () => {
    expect(
      GOLDEN_COMPOUND_PATTERNS.find(
        (row) => row.id === 'customer_results_then_rebook',
      )?.recipeId,
    ).toBe(RESULTS_THEN_REBOOK_RECIPE_ID);
  });

  it.each(RESULTS_THEN_REBOOK_COMPOUND_PROMPTS)(
    'decomposeDeterministicForSurface customer EN $id',
    ({ prompt, orderedActions, status }) => {
      expect(isCompoundPrompt(prompt)).toBe(true);
      const result = decomposeDeterministicForSurface('customer', prompt);
      expect(result?.recipeId).toBe(RESULTS_THEN_REBOOK_RECIPE_ID);
      expect(result?.source).toBe('golden');
      expect(result?.steps.map((step) => step.action)).toEqual([
        ...orderedActions,
      ]);
      if (status) {
        expect(result?.steps[0].params.status).toBe(status);
      }
    },
  );

  it.each(RESULTS_THEN_REBOOK_MULTILINGUAL_SCENARIOS)(
    'decomposeDeterministicForSurface i18n $id',
    ({ prompt, orderedActions }) => {
      const result = decomposeDeterministicForSurface('customer', prompt);
      expect(result?.recipeId).toBe(RESULTS_THEN_REBOOK_RECIPE_ID);
      expect(result?.steps.map((step) => step.action)).toEqual([
        ...orderedActions,
      ]);
    },
  );

  it('explain-only does not route to results_then_rebook', () => {
    const prompt = 'What does released mean for my lab results?';
    expect(isExplainResultStatusPrompt(prompt)).toBe(true);
    const result = decomposeDeterministicForSurface('customer', prompt);
    expect(result?.recipeId).not.toBe(RESULTS_THEN_REBOOK_RECIPE_ID);
  });

  it.each(RESULTS_THEN_REBOOK_COMPOUND_PROMPTS.slice(0, 2))(
    'wins over single rebook when results context present $id',
    ({ prompt }) => {
      expect(isRebookLastAppointmentPrompt(prompt)).toBe(false);
      const result = decomposeDeterministicForSurface('customer', prompt);
      expect(result?.recipeId).toBe(RESULTS_THEN_REBOOK_RECIPE_ID);
      expect(result?.steps).toHaveLength(2);
    },
  );

  it('rebook-only does not route to results_then_rebook', () => {
    const prompt = 'Rebook my last appointment';
    expect(isRebookLastAppointmentPrompt(prompt)).toBe(true);
    const result = decomposeDeterministicForSurface('customer', prompt);
    expect(result?.recipeId).not.toBe(RESULTS_THEN_REBOOK_RECIPE_ID);
  });
});
