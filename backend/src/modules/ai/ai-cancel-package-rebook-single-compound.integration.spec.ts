import { CANCEL_PACKAGE_REBOOK_SINGLE_COMPOUND_PROMPTS } from './ai-cancel-package-rebook-single-compound.fixtures.js';
import { CANCEL_PACKAGE_REBOOK_SINGLE_MULTILINGUAL_SCENARIOS } from './ai-cancel-package-rebook-single-compound-multilingual.fixtures.js';
import {
  decomposeDeterministicForSurface,
  GOLDEN_COMPOUND_PATTERNS,
  isCompoundPrompt,
} from './intent-decomposition.util.js';
import {
  CANCEL_PACKAGE_REBOOK_SINGLE_RECIPE_ID,
  isCancelPackageRebookSingleCompoundPrompt,
} from './ai-cancel-package-rebook-single-compound.util.js';

describe('ai-cancel-package-rebook-single-compound integration (ai-cmd-customer-4.21.7)', () => {
  it('registers customer_cancel_package_rebook_single golden pattern', () => {
    expect(
      GOLDEN_COMPOUND_PATTERNS.find(
        (row) => row.id === 'customer_cancel_package_rebook_single',
      )?.recipeId,
    ).toBe(CANCEL_PACKAGE_REBOOK_SINGLE_RECIPE_ID);
  });

  it.each(CANCEL_PACKAGE_REBOOK_SINGLE_COMPOUND_PROMPTS)(
    'decomposeDeterministicForSurface customer EN $id',
    ({ prompt, orderedActions, expectedParams }) => {
      expect(isCompoundPrompt(prompt)).toBe(true);
      const result = decomposeDeterministicForSurface('customer', prompt);
      expect(result?.recipeId).toBe(CANCEL_PACKAGE_REBOOK_SINGLE_RECIPE_ID);
      expect(result?.source).toBe('golden');
      expect(result?.steps.map((step) => step.action)).toEqual([
        ...orderedActions,
      ]);
      if (expectedParams?.visitIndex != null) {
        expect(result?.steps[0]?.params.visitIndex).toBe(
          expectedParams.visitIndex,
        );
      }
      if (expectedParams?.serviceName) {
        expect(result?.steps[1]?.params.serviceName).toBe(
          expectedParams.serviceName,
        );
      }
    },
  );

  it.each(CANCEL_PACKAGE_REBOOK_SINGLE_MULTILINGUAL_SCENARIOS)(
    'decomposeDeterministicForSurface multilingual $id',
    ({ prompt, orderedActions }) => {
      const result = decomposeDeterministicForSurface('customer', prompt);
      expect(result?.recipeId).toBe(CANCEL_PACKAGE_REBOOK_SINGLE_RECIPE_ID);
      expect(result?.steps.map((step) => step.action)).toEqual([
        ...orderedActions,
      ]);
    },
  );

  it.each(CANCEL_PACKAGE_REBOOK_SINGLE_COMPOUND_PROMPTS.slice(0, 2))(
    'isCompoundPrompt $id',
    ({ prompt }) => {
      expect(isCompoundPrompt(prompt)).toBe(true);
    },
  );
});
