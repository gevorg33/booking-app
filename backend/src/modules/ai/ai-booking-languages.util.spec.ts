import { EXPLAIN_BOOKING_LANGUAGES_PROMPTS } from './ai-booking-languages.fixtures.js';
import {
  isBookingLanguagesIntent,
  isExplainBookingLanguagesPrompt,
  rescueBookingLanguagesIntent,
} from './ai-booking-languages.util.js';
import {
  isExplainBusinessLanguagesPrompt,
  isConfigureBusinessLanguagesPrompt,
} from './ai-business-languages.util.js';
import { isExplainCheckoutCurrencyPrompt } from './ai-checkout-currency.util.js';

describe('ai-booking-languages.util (ai-cmd-lang-5)', () => {
  it.each(EXPLAIN_BOOKING_LANGUAGES_PROMPTS)(
    'detects explain booking languages prompt $id',
    ({ prompt }) => {
      expect(isExplainBookingLanguagesPrompt(prompt)).toBe(true);
      expect(isExplainBusinessLanguagesPrompt(prompt)).toBe(false);
      expect(isConfigureBusinessLanguagesPrompt(prompt)).toBe(false);
      expect(isExplainCheckoutCurrencyPrompt(prompt)).toBe(false);
    },
  );

  it('does not rescue when action is already explain_booking_languages', () => {
    expect(
      rescueBookingLanguagesIntent(
        'Why can I only see English and Armenian on the booking page?',
        'explain_booking_languages',
      ),
    ).toBeNull();
  });

  it('rescues misclassified booking language prompts', () => {
    expect(
      rescueBookingLanguagesIntent(
        'Why can I only see English and Armenian on the booking page?',
        'unknown',
      ),
    ).toEqual({
      action: 'explain_booking_languages',
      rescueReason: 'explain_booking_languages',
    });
  });

  it('does not steal dashboard language settings prompts', () => {
    expect(
      isExplainBookingLanguagesPrompt(
        'What languages are enabled for our salon?',
      ),
    ).toBe(false);
    expect(
      isExplainBookingLanguagesPrompt('Explain our language settings'),
    ).toBe(false);
  });

  it('recognizes booking languages intent id', () => {
    expect(isBookingLanguagesIntent('explain_booking_languages')).toBe(true);
    expect(isBookingLanguagesIntent('explain_business_languages')).toBe(false);
  });
});
