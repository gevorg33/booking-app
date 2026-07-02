import {
  CUSTOMER_PUBLIC_FIX_CHECKOUT_VALIDATION_ERROR_CLASSIFIER_RULES,
  buildFixCheckoutValidationErrorNavigate,
  extractCheckoutValidationErrorAspectFromPrompt,
  isFixCheckoutValidationErrorPrompt,
  parseFixCheckoutValidationErrorFromPrompt,
  rescueFixCheckoutValidationErrorIntent,
} from './ai-fix-checkout-validation-error.util.js';
import { FIX_CHECKOUT_VALIDATION_ERROR_PROMPTS } from './ai-fix-checkout-validation-error.fixtures.js';
import { isExplainGuestCheckoutFieldsPrompt } from './ai-explain-guest-checkout-fields.util.js';
import { FIX_CHECKOUT_VALIDATION_ERROR_MULTILINGUAL_SCENARIOS } from './ai-fix-checkout-validation-error-multilingual.fixtures.js';
import { AI_COMMAND_EVAL_FIX_CHECKOUT_VALIDATION_ERROR_CASES } from './eval/ai-command-eval.cases.js';
import { evaluateDeterministicEvalCase } from './eval/ai-command-eval.runner.js';

describe('ai-fix-checkout-validation-error.util (ai-cmd-customer-4.2.7)', () => {
  it('exports classifier rules', () => {
    expect(
      CUSTOMER_PUBLIC_FIX_CHECKOUT_VALIDATION_ERROR_CLASSIFIER_RULES,
    ).toContain('fix_checkout_validation_error');
  });

  it.each(
    FIX_CHECKOUT_VALIDATION_ERROR_PROMPTS.map((row) => [row.id, row] as const),
  )('detects validation-error prompt $id', (_id, row) => {
    expect(isFixCheckoutValidationErrorPrompt(row.prompt)).toBe(true);
    expect(parseFixCheckoutValidationErrorFromPrompt(row.prompt)?.aspect).toBe(
      row.aspect,
    );
  });

  it.each(
    FIX_CHECKOUT_VALIDATION_ERROR_PROMPTS.map((row) => [row.id, row] as const),
  )('rescues validation-error prompt $id from unknown', (_id, row) => {
    expect(
      rescueFixCheckoutValidationErrorIntent(row.prompt, 'unknown')?.action,
    ).toBe(row.expectedAction);
  });

  it.each(
    FIX_CHECKOUT_VALIDATION_ERROR_MULTILINGUAL_SCENARIOS.map(
      (row) => [row.id, row] as const,
    ),
  )('detects multilingual validation-error prompt $id', (_id, row) => {
    expect(isFixCheckoutValidationErrorPrompt(row.prompt)).toBe(true);
  });

  it('does not steal proactive guest-field explain prompts', () => {
    expect(
      isFixCheckoutValidationErrorPrompt(
        'Why do you need my email at checkout?',
      ),
    ).toBe(false);
    expect(
      isExplainGuestCheckoutFieldsPrompt(
        'Why do you need my email at checkout?',
      ),
    ).toBe(true);
  });

  it('builds navigate with field hints', () => {
    expect(
      buildFixCheckoutValidationErrorNavigate('email', { serviceId: 's1' }),
    ).toEqual({
      path: 'checkout',
      query: { serviceId: 's1', focus: 'email' },
      fieldHints: { action: 'explain_guest_checkout_fields', aspect: 'email' },
    });
    expect(
      buildFixCheckoutValidationErrorNavigate('profile_merge', {}).fieldHints,
    ).toEqual({
      action: 'explain_guest_checkout_fields',
      aspect: 'contact_merge',
    });
  });

  it('extracts aspects from phrasing', () => {
    expect(
      extractCheckoutValidationErrorAspectFromPrompt(
        'Signed in but checkout still says enter contact details',
      ),
    ).toBe('profile_merge');
  });

  it('maps fixtures to passing eval golden cases', () => {
    expect(
      FIX_CHECKOUT_VALIDATION_ERROR_PROMPTS.filter(
        (row) => row.surface === 'customer',
      ).length,
    ).toBeGreaterThanOrEqual(10);
    expect(
      FIX_CHECKOUT_VALIDATION_ERROR_PROMPTS.filter(
        (row) => row.surface === 'public',
      ).length,
    ).toBeGreaterThanOrEqual(10);
    for (const evalCase of AI_COMMAND_EVAL_FIX_CHECKOUT_VALIDATION_ERROR_CASES) {
      expect(evaluateDeterministicEvalCase(evalCase).errors).toEqual([]);
    }
  });
});
