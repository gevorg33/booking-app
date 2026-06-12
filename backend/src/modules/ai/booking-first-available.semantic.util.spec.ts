import { SIMILAR_CHECK_AND_BOOK_PROMPTS } from './ai-check-and-book.fixtures.js';
import { MULTILINGUAL_FLEXIBLE_BOOKING_PROMPTS } from './ai-check-and-book-multilingual.fixtures.js';
import {
  BOOKING_FIRST_AVAILABLE_NEGATIVE_PROMPTS,
  BOOKING_FIRST_AVAILABLE_POSITIVE_PROMPTS,
  BOOKING_FIRST_AVAILABLE_SEMANTIC_PIPE_MARKER,
} from './booking-first-available.semantic.fixtures.js';
import {
  impliesBookingFirstAvailableFromSemantic,
  resolveBookingFirstAvailableSemanticHints,
} from './booking-first-available.semantic.util.js';
import { isFirstAvailableBookingPrompt } from './booking-first-available.semantic.util.js';

describe('booking-first-available semantic util (pipe-1.13.1 / acc-3.14)', () => {
  it('exports pipe marker', () => {
    expect(BOOKING_FIRST_AVAILABLE_SEMANTIC_PIPE_MARKER).toBe('pipe-1.13.1');
  });

  it.each(BOOKING_FIRST_AVAILABLE_POSITIVE_PROMPTS)(
    '$id detects first-available booking meaning on semantic anchors',
    ({ prompt, surface }) => {
      const hints = resolveBookingFirstAvailableSemanticHints(
        prompt,
        surface ?? 'dashboard',
      );
      expect(hints?.bookingFirstAvailable).toBe(true);
      expect(impliesBookingFirstAvailableFromSemantic(prompt)).toBe(true);
      expect(isFirstAvailableBookingPrompt(prompt)).toBe(true);
    },
  );

  it.each(BOOKING_FIRST_AVAILABLE_NEGATIVE_PROMPTS)(
    '$id does not detect first-available booking meaning',
    ({ prompt, surface }) => {
      expect(
        resolveBookingFirstAvailableSemanticHints(prompt, surface ?? 'dashboard'),
      ).toBeNull();
      expect(impliesBookingFirstAvailableFromSemantic(prompt)).toBe(false);
      expect(isFirstAvailableBookingPrompt(prompt)).toBe(false);
    },
  );

  it.each(SIMILAR_CHECK_AND_BOOK_PROMPTS)(
    'check-and-book compound prompt $id implies first-available booking',
    ({ prompt }) => {
      expect(impliesBookingFirstAvailableFromSemantic(prompt)).toBe(true);
      expect(isFirstAvailableBookingPrompt(prompt)).toBe(true);
    },
  );

  it.each(
    MULTILINGUAL_FLEXIBLE_BOOKING_PROMPTS.filter((entry) =>
      entry.id.includes('book-nearest'),
    ),
  )('multilingual flexible booking $id implies first-available', ({ prompt }) => {
    expect(impliesBookingFirstAvailableFromSemantic(prompt)).toBe(true);
    expect(isFirstAvailableBookingPrompt(prompt)).toBe(true);
  });
});
