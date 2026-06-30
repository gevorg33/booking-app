import { CONFIGURE_SERVICES_PAYMENT_MATRIX_COMPOUND_PROMPTS } from './ai-configure-services-payment-matrix-compound.fixtures.js';
import {
  decomposeDeterministicForSurface,
  GOLDEN_COMPOUND_PATTERNS,
} from './intent-decomposition.util.js';
import { CONFIGURE_SERVICES_PAYMENT_MATRIX_RECIPE_ID } from './ai-configure-services-payment-matrix-compound.util.js';

describe('AiConfigureServicesPaymentMatrixCompound integration (ai-cmd-ext-4.6)', () => {
  it('registers dashboard_configure_services_payment_matrix golden pattern', () => {
    const pattern = GOLDEN_COMPOUND_PATTERNS.find(
      (row) => row.id === 'dashboard_configure_services_payment_matrix',
    );
    expect(pattern?.recipeId).toBe(CONFIGURE_SERVICES_PAYMENT_MATRIX_RECIPE_ID);
  });

  it.each(CONFIGURE_SERVICES_PAYMENT_MATRIX_COMPOUND_PROMPTS)(
    'decomposeDeterministicForSurface $id',
    ({ prompt, orderedActions }) => {
      const result = decomposeDeterministicForSurface('dashboard', prompt);
      expect(result?.recipeId).toBe(CONFIGURE_SERVICES_PAYMENT_MATRIX_RECIPE_ID);
      expect(result?.source).toBe('golden');
      expect(result?.steps.map((step) => step.action)).toEqual([
        ...orderedActions,
      ]);
    },
  );
});
