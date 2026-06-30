import {
  CUSTOMER_PUBLIC_EXPLAIN_GUEST_CHECKOUT_FIELDS_CLASSIFIER_RULES,
  isExplainGuestCheckoutFieldsPrompt,
  parseExplainGuestCheckoutFieldsFromPrompt,
  rescueExplainGuestCheckoutFieldsIntent,
} from './ai-explain-guest-checkout-fields.util.js';
import {
  EXPLAIN_GUEST_CHECKOUT_FIELDS_PROMPTS,
  GUEST_CHECKOUT_FIELDS_RESCUE_SCENARIOS,
} from './ai-explain-guest-checkout-fields.fixtures.js';
import { EXPLAIN_GUEST_CHECKOUT_FIELDS_MULTILINGUAL_SCENARIOS } from './ai-explain-guest-checkout-fields-multilingual.fixtures.js';

describe('ai-explain-guest-checkout-fields.util', () => {
  it('exports classifier rules for explain_guest_checkout_fields', () => {
    expect(CUSTOMER_PUBLIC_EXPLAIN_GUEST_CHECKOUT_FIELDS_CLASSIFIER_RULES).toContain(
      'explain_guest_checkout_fields',
    );
  });

  it.each(
    EXPLAIN_GUEST_CHECKOUT_FIELDS_PROMPTS.map((row) => [row.id, row] as const),
  )('detects guest checkout fields prompt for $id', (_id, row) => {
    expect(isExplainGuestCheckoutFieldsPrompt(row.prompt)).toBe(true);
    expect(parseExplainGuestCheckoutFieldsFromPrompt(row.prompt)?.aspect).toBe(
      row.aspect,
    );
    expect(rescueExplainGuestCheckoutFieldsIntent(row.prompt, 'unknown')).toEqual({
      action: 'explain_guest_checkout_fields',
      rescueReason: 'guest_checkout_fields',
    });
  });

  it.each(
    EXPLAIN_GUEST_CHECKOUT_FIELDS_MULTILINGUAL_SCENARIOS.map(
      (row) => [row.id, row] as const,
    ),
  )('detects multilingual guest checkout fields prompt for $id', (_id, row) => {
    expect(isExplainGuestCheckoutFieldsPrompt(row.prompt)).toBe(true);
    expect(rescueExplainGuestCheckoutFieldsIntent(row.prompt, 'unknown')?.action).toBe(
      'explain_guest_checkout_fields',
    );
  });

  it.each(
    GUEST_CHECKOUT_FIELDS_RESCUE_SCENARIOS.map((row) => [row.id, row] as const),
  )('rescues $id from misclassified action', (_id, row) => {
    expect(
      rescueExplainGuestCheckoutFieldsIntent(row.prompt, row.misclassifiedAction),
    ).toEqual({
      action: row.expectedAction,
      rescueReason: 'guest_checkout_fields',
    });
  });

  it('does not treat GDPR export/delete as guest checkout fields', () => {
    expect(isExplainGuestCheckoutFieldsPrompt('How can I export my personal data?')).toBe(
      false,
    );
    expect(isExplainGuestCheckoutFieldsPrompt('Delete my account data')).toBe(false);
  });

  it('does not treat clinic checkout fields as guest checkout fields', () => {
    expect(
      isExplainGuestCheckoutFieldsPrompt(
        'What should I put in the symptoms field on checkout?',
      ),
    ).toBe(false);
  });

  it('does not treat amount due prompts as guest checkout fields', () => {
    expect(isExplainGuestCheckoutFieldsPrompt('How much do I pay today?')).toBe(false);
  });

  it('does not treat generic booking funnel walkthrough as guest checkout fields', () => {
    expect(
      isExplainGuestCheckoutFieldsPrompt('Walk me through booking step by step'),
    ).toBe(false);
    expect(
      isExplainGuestCheckoutFieldsPrompt('What happens after I pick a time?'),
    ).toBe(false);
  });

  it('returns null rescue when already classified correctly', () => {
    expect(
      rescueExplainGuestCheckoutFieldsIntent(
        'Why do you need my email at checkout?',
        'explain_guest_checkout_fields',
      ),
    ).toBeNull();
  });
});
