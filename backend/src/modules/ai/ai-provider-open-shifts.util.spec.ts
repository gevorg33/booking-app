import {
  PROVIDER_OPEN_SHIFTS_FILL_PROMPT_SCENARIOS,
  SIMILAR_PROVIDER_OPEN_SHIFTS_PROMPTS,
} from '../provider-mobile/provider-open-shifts.fixtures.js';
import {
  PROVIDER_OPEN_SHIFTS_INTENTS,
  rescueProviderOpenShiftsIntent,
} from './ai-provider-open-shifts.util.js';

describe('ai-provider-open-shifts.util (prov-exp-7.3)', () => {
  it('exports provider open-shifts intents', () => {
    expect(PROVIDER_OPEN_SHIFTS_INTENTS).toContain('suggest_waitlist_for_gap');
  });

  it.each(PROVIDER_OPEN_SHIFTS_FILL_PROMPT_SCENARIOS.filter((s) => s.expectedMatch))(
    'rescues fill-gap prompt $id',
    (scenario) => {
      expect(rescueProviderOpenShiftsIntent(scenario.prompt, 'unknown')).toEqual({
        action: 'suggest_waitlist_for_gap',
        rescueReason: 'fill_gap_waitlist',
      });
    },
  );

  it.each(SIMILAR_PROVIDER_OPEN_SHIFTS_PROMPTS)(
    'maps fixture prompt $id to suggest_waitlist_for_gap',
    (scenario) => {
      expect(rescueProviderOpenShiftsIntent(scenario.prompt, 'unknown')?.action).toBe(
        scenario.expectedAction,
      );
    },
  );

  it('does not override classified action', () => {
    expect(
      rescueProviderOpenShiftsIntent('fill this gap', 'suggest_waitlist_for_gap'),
    ).toBeNull();
  });

  it('returns null for unrelated prompts', () => {
    expect(rescueProviderOpenShiftsIntent('show my appointments', 'unknown')).toBeNull();
  });
});
