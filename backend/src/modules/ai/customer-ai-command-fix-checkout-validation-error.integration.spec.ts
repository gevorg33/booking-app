import { FIX_CHECKOUT_VALIDATION_ERROR_PROMPTS } from './ai-fix-checkout-validation-error.fixtures.js';
import { rescueFixCheckoutValidationErrorIntent } from './ai-fix-checkout-validation-error.util.js';

describe('customer-ai-command fix_checkout_validation_error integration (ai-cmd-customer-4.2.7)', () => {
  it.each(
    FIX_CHECKOUT_VALIDATION_ERROR_PROMPTS.map((row) => [row.id, row] as const),
  )('rescues fix_checkout_validation_error for $id', (_id, row) => {
    expect(
      rescueFixCheckoutValidationErrorIntent(row.prompt, 'unknown')?.action,
    ).toBe('fix_checkout_validation_error');
  });
});
