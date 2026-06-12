import { extractTimeSlotFromPrompt } from './ai-structural-extractors.js';
import { enrichBookingTimeHintsFromPrompt } from './ai-booking-param-hints.util.js';
import { resolveBookingMetric } from './ai-metric-resolvers.util.js';
import {
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
    expect(resolveBookingMetric({}, 'summarize today')).toBe('count');
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
