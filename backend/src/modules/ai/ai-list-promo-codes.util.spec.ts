import {
  isListPromoCodesPrompt,
  rescueListPromoCodesIntent,
} from './ai-list-promo-codes.util.js';

describe('ai-list-promo-codes.util (e2e-bug.137/142)', () => {
  it.each([
    'What promo codes are currently active',
    'List all my promo codes',
    'Show active discount codes',
  ])('detects list prompt: %s', (prompt) => {
    expect(isListPromoCodesPrompt(prompt)).toBe(true);
    expect(rescueListPromoCodesIntent(prompt, 'unknown')).toEqual({
      action: 'list_promo_codes',
      rescueReason: 'list_promo_codes',
    });
  });

  it('does not steal create/deactivate/help prompts', () => {
    expect(isListPromoCodesPrompt('Create a 15% off promo code SUMMER15')).toBe(
      false,
    );
    expect(isListPromoCodesPrompt('Deactivate promo code SUMMER15')).toBe(
      false,
    );
    expect(isListPromoCodesPrompt('How do promo codes work at checkout?')).toBe(
      false,
    );
  });
});
