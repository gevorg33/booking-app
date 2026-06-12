import {
  ANY_PROVIDER_BOOKING_NEGATIVE_PROMPTS,
  ANY_PROVIDER_BOOKING_POSITIVE_PROMPTS,
  ANY_PROVIDER_BOOKING_SEMANTIC_PIPE_MARKER,
} from './any-provider-booking.semantic.fixtures.js';
import {
  impliesAnyProviderBookingFromSemantic,
  isAnyProviderBookingPrompt,
  resolveAnyProviderBookingSemanticHints,
} from './any-provider-booking.semantic.util.js';

describe('any-provider-booking semantic util (acc-3.14)', () => {
  it('exports pipe marker', () => {
    expect(ANY_PROVIDER_BOOKING_SEMANTIC_PIPE_MARKER).toBe('acc-3.14');
  });

  it.each(ANY_PROVIDER_BOOKING_POSITIVE_PROMPTS)(
    '$id detects any-provider booking scope',
    ({ prompt, surface }) => {
      const resolvedSurface = surface ?? 'dashboard';
      expect(
        resolveAnyProviderBookingSemanticHints(prompt, resolvedSurface),
      ).toEqual({ allProviders: true });
      expect(impliesAnyProviderBookingFromSemantic(prompt)).toBe(true);
      expect(isAnyProviderBookingPrompt(prompt)).toBe(true);
    },
  );

  it.each(ANY_PROVIDER_BOOKING_NEGATIVE_PROMPTS)(
    '$id does not detect any-provider booking scope',
    ({ prompt, surface }) => {
      const resolvedSurface = surface ?? 'dashboard';
      expect(
        resolveAnyProviderBookingSemanticHints(prompt, resolvedSurface),
      ).toBeNull();
      expect(impliesAnyProviderBookingFromSemantic(prompt)).toBe(false);
      expect(isAnyProviderBookingPrompt(prompt)).toBe(false);
    },
  );
});
