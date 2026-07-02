import { INTAKE_LAB_BOOK_PAY_COMPOUND_PROMPTS } from './ai-intake-lab-book-pay-compound.fixtures.js';
import { INTAKE_LAB_BOOK_PAY_MULTILINGUAL_SCENARIOS } from './ai-intake-lab-book-pay-compound-multilingual.fixtures.js';
import {
  decomposeDeterministicForSurface,
  GOLDEN_COMPOUND_PATTERNS,
  isCompoundPrompt,
} from './intent-decomposition.util.js';
import {
  INTAKE_LAB_BOOK_PAY_RECIPE_ID,
  PUBLIC_INTAKE_LAB_BOOK_PAY_RECIPE_ID,
} from './ai-intake-lab-book-pay-compound.util.js';
import { isCompleteIntakeAndBookCompoundPrompt } from './ai-complete-intake-and-book.util.js';

describe('ai-intake-lab-book-pay-compound integration (ai-cmd-customer-4.21.1)', () => {
  it('registers customer and public golden patterns', () => {
    expect(
      GOLDEN_COMPOUND_PATTERNS.find(
        (row) => row.id === 'customer_intake_lab_book_pay',
      )?.recipeId,
    ).toBe(INTAKE_LAB_BOOK_PAY_RECIPE_ID);
    expect(
      GOLDEN_COMPOUND_PATTERNS.find(
        (row) => row.id === 'public_intake_lab_book_pay',
      )?.recipeId,
    ).toBe(PUBLIC_INTAKE_LAB_BOOK_PAY_RECIPE_ID);
  });

  it.each(
    INTAKE_LAB_BOOK_PAY_COMPOUND_PROMPTS.filter(
      (row) => row.surface === 'customer',
    ),
  )(
    'decomposeDeterministicForSurface customer EN $id',
    ({ prompt, orderedActions }) => {
      expect(isCompoundPrompt(prompt)).toBe(true);
      const result = decomposeDeterministicForSurface('customer', prompt);
      expect(result?.recipeId).toBe(INTAKE_LAB_BOOK_PAY_RECIPE_ID);
      expect(result?.source).toBe('golden');
      expect(result?.steps.map((step) => step.action)).toEqual([
        ...orderedActions,
      ]);
      expect(result?.steps[0]?.params.preVisitIntakeRequired).toBe(true);
      expect(result?.steps[2]?.params.paymentMethod).toBe('online');
    },
  );

  it.each(
    INTAKE_LAB_BOOK_PAY_COMPOUND_PROMPTS.filter(
      (row) => row.surface === 'public',
    ),
  )(
    'decomposeDeterministicForSurface public EN $id',
    ({ prompt, orderedActions }) => {
      const result = decomposeDeterministicForSurface('public', prompt);
      expect(result?.recipeId).toBe(PUBLIC_INTAKE_LAB_BOOK_PAY_RECIPE_ID);
      expect(result?.steps.map((step) => step.action)).toEqual([
        ...orderedActions,
      ]);
    },
  );

  it.each(INTAKE_LAB_BOOK_PAY_MULTILINGUAL_SCENARIOS)(
    'decomposeDeterministicForSurface i18n $id',
    ({ prompt, surface, orderedActions }) => {
      const result = decomposeDeterministicForSurface(surface, prompt);
      const recipeId =
        surface === 'public'
          ? PUBLIC_INTAKE_LAB_BOOK_PAY_RECIPE_ID
          : INTAKE_LAB_BOOK_PAY_RECIPE_ID;
      expect(result?.recipeId).toBe(recipeId);
      expect(result?.steps.map((step) => step.action)).toEqual([
        ...orderedActions,
      ]);
    },
  );

  it('wins over complete_intake_and_book when payment is present', () => {
    const prompt = 'Fill intake and book blood draw, pay online';
    expect(isCompleteIntakeAndBookCompoundPrompt(prompt)).toBe(false);
    const result = decomposeDeterministicForSurface('customer', prompt);
    expect(result?.recipeId).toBe(INTAKE_LAB_BOOK_PAY_RECIPE_ID);
    expect(result?.steps).toHaveLength(3);
  });
});
