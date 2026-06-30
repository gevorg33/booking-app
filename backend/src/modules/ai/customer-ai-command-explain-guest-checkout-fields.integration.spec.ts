import { EXPLAIN_GUEST_CHECKOUT_FIELDS_PROMPTS } from './ai-explain-guest-checkout-fields.fixtures.js';
import { rescueExplainGuestCheckoutFieldsIntent } from './ai-explain-guest-checkout-fields.util.js';

describe('customer-ai-command explain_guest_checkout_fields integration (ai-cmd-customer-4.2.2)', () => {
  it.each(
    EXPLAIN_GUEST_CHECKOUT_FIELDS_PROMPTS.map((row) => [row.id, row] as const),
  )('rescues explain_guest_checkout_fields for $id', (_id, row) => {
    expect(
      rescueExplainGuestCheckoutFieldsIntent(row.prompt, 'unknown')?.action,
    ).toBe('explain_guest_checkout_fields');
  });
});
