import {
  BOOK_ANOTHER_SERVICE_PROMPTS,
  BOOK_ANOTHER_SERVICE_RESCUE_SCENARIOS,
} from './ai-book-another-service.fixtures.js';
import {
  isBookAnotherServiceIntent,
  isBookAnotherServicePrompt,
  parseBookAnotherServiceFromPrompt,
  rescueBookAnotherServiceIntent,
} from './ai-book-another-service.util.js';
import { BOOK_ANOTHER_SERVICE_MULTILINGUAL_SCENARIOS } from './ai-book-another-service-multilingual.fixtures.js';

describe('ai-book-another-service.util (ai-cmd-customer-4.3.6)', () => {
  it.each(BOOK_ANOTHER_SERVICE_PROMPTS)(
    'detects $id',
    ({ prompt, sameDay }) => {
      expect(isBookAnotherServicePrompt(prompt)).toBe(true);
      expect(parseBookAnotherServiceFromPrompt(prompt)?.sameDay).toBe(
        sameDay ?? false,
      );
    },
  );

  it.each(BOOK_ANOTHER_SERVICE_MULTILINGUAL_SCENARIOS)(
    'detects multilingual prompt $id',
    ({ prompt, sameDay }) => {
      expect(isBookAnotherServicePrompt(prompt)).toBe(true);
      if (sameDay) {
        expect(parseBookAnotherServiceFromPrompt(prompt)?.sameDay).toBe(true);
      }
    },
  );

  it.each(BOOK_ANOTHER_SERVICE_RESCUE_SCENARIOS)(
    'rescues $id',
    ({ prompt, misclassifiedAction, expectedAction }) => {
      expect(
        rescueBookAnotherServiceIntent(prompt, misclassifiedAction),
      ).toEqual({
        action: expectedAction,
        rescueReason: 'book_another_service',
      });
    },
  );

  it('does not steal explain-consumer-checkout-success prompts', () => {
    expect(
      isBookAnotherServicePrompt(
        'What does Book another service do on the app success screen?',
      ),
    ).toBe(false);
  });

  it('does not steal specific slot booking prompts', () => {
    expect(
      isBookAnotherServicePrompt('Book another massage tomorrow at 3pm'),
    ).toBe(false);
  });

  it('does not steal rebook-last prompts', () => {
    expect(isBookAnotherServicePrompt('Book again — same as last time')).toBe(
      false,
    );
    expect(isBookAnotherServicePrompt('Վերամրագրել վերջին այցը')).toBe(false);
    expect(isBookAnotherServicePrompt('Забронировать как в прошлый раз')).toBe(
      false,
    );
  });

  it('recognizes intent id', () => {
    expect(isBookAnotherServiceIntent('book_another_service')).toBe(true);
    expect(isBookAnotherServiceIntent('book_appointment')).toBe(false);
  });
});
