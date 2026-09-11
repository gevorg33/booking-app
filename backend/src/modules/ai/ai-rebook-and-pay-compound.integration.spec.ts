import { REBOOK_AND_PAY_CUSTOMER_PROMPTS } from './ai-rebook-and-pay-compound.fixtures.js';
import { REBOOK_AND_PAY_MULTILINGUAL_SCENARIOS } from './ai-rebook-and-pay-compound-multilingual.fixtures.js';
import {
  decomposeDeterministicForSurface,
  GOLDEN_COMPOUND_PATTERNS,
  isCompoundPrompt,
} from './intent-decomposition.util.js';
import { REBOOK_AND_PAY_RECIPE_ID } from './ai-rebook-and-pay-compound.util.js';

describe('AiRebookAndPayCompound integration (ai-cmd-customer-4.8.2)', () => {
  it('registers customer_rebook_and_pay golden pattern', () => {
    expect(
      GOLDEN_COMPOUND_PATTERNS.find(
        (row) => row.id === 'customer_rebook_and_pay',
      )?.recipeId,
    ).toBe(REBOOK_AND_PAY_RECIPE_ID);
  });

  it.each(REBOOK_AND_PAY_CUSTOMER_PROMPTS)(
    'decomposeDeterministicForSurface customer EN $id',
    ({ prompt, orderedActions, expectedParams }) => {
      expect(isCompoundPrompt(prompt)).toBe(true);
      const result = decomposeDeterministicForSurface('customer', prompt);
      expect(result?.recipeId).toBe(REBOOK_AND_PAY_RECIPE_ID);
      expect(result?.source).toBe('golden');
      expect(result?.steps.map((step) => step.action)).toEqual([
        ...orderedActions,
      ]);
      if (expectedParams?.serviceName) {
        expect(result?.steps[0].params.serviceName).toBe(
          expectedParams.serviceName,
        );
      }
    },
  );

  it.each(REBOOK_AND_PAY_MULTILINGUAL_SCENARIOS)(
    'decomposeDeterministicForSurface i18n $id',
    ({ prompt, orderedActions }) => {
      const result = decomposeDeterministicForSurface('customer', prompt);
      expect(result?.recipeId).toBe(REBOOK_AND_PAY_RECIPE_ID);
      expect(result?.steps.map((step) => step.action)).toEqual([
        ...orderedActions,
      ]);
    },
  );
});
