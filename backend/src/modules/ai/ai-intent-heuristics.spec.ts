// e2e-bug.527 — every test below is named 're-exports X', but three of the four
// symbols were imported straight from the split modules, so the block exercised
// those modules and never the shim it is named for. Importing all of them
// through './ai-intent-heuristics.js' is what makes the assertions mean what
// their titles say.
import {
  extractTimeSlotFromPrompt,
  enrichBookingTimeHintsFromPrompt,
  resolveBookingMetric,
  isFirstAvailableBookingPrompt,
  isTeamWideProviderAvailabilityQuery,
} from './ai-intent-heuristics.js';

/** pipe-1.13.3 — deprecated shim still re-exports split modules. */
describe('ai-intent-heuristics deprecated shim (pipe-1.13.3)', () => {
  it('re-exports structural extractors', () => {
    expect(extractTimeSlotFromPrompt('book at 14:30')).toBe('14:30');
  });

  it('re-exports booking param hints', () => {
    const params: Record<string, unknown> = {};
    enrichBookingTimeHintsFromPrompt(
      'check_providers_for_service',
      params,
      'who is free tomorrow for massage',
    );
    expect(params.allProviders).toBe(true);
  });

  it('re-exports metric resolvers', () => {
    // e2e-bug.527 — 'summarize today' resolves to null, and that is the
    // resolver working as built: the semantic path only answers explicit
    // count/total wording, and everything else ('revenue today', 'no shows this
    // week') is likewise null because the metric normally arrives in
    // params.bookingMetric from the classifier. Assert a prompt the resolver
    // genuinely owns, so this proves the re-export rather than a behaviour the
    // function never promised.
    expect(resolveBookingMetric({}, 'how many bookings today')).toBe('count');
    expect(resolveBookingMetric({ bookingMetric: 'revenue' }, 'anything')).toBe(
      'revenue',
    );
  });

  it('re-exports semantic detectors', () => {
    expect(
      isFirstAvailableBookingPrompt('book the soonest slot for massage'),
    ).toBe(true);
    expect(
      isTeamWideProviderAvailabilityQuery(
        'who is free tomorrow evening for lashes',
      ),
    ).toBe(true);
  });
});
