import { PROVIDER_WHO_IS_NEXT_PROMPT_SCENARIOS } from './ai-provider-who-is-next.fixtures.js';
import {
  isWhoIsNextPrompt,
  rescueWhoIsNextIntent,
} from './ai-provider-who-is-next.util.js';

describe('ai-provider-who-is-next.util', () => {
  it.each(PROVIDER_WHO_IS_NEXT_PROMPT_SCENARIOS.map((s) => [s.id, s.prompt]))(
    'detects who_is_next prompt %s',
    (_id, prompt) => {
      expect(isWhoIsNextPrompt(prompt)).toBe(true);
    },
  );

  it('does not misdetect the manager team-wide queue', () => {
    expect(
      isWhoIsNextPrompt("Who's next across the team in the next 2 hours?"),
    ).toBe(false);
    expect(isWhoIsNextPrompt('All providers next 2 hours')).toBe(false);
  });

  it('does not misdetect plain show_appointments prompts', () => {
    expect(isWhoIsNextPrompt('Show me my appointments today')).toBe(false);
    expect(isWhoIsNextPrompt('List my afternoon')).toBe(false);
  });

  it.each(PROVIDER_WHO_IS_NEXT_PROMPT_SCENARIOS.map((s) => [s.id, s.prompt]))(
    'rescues who_is_next → show_appointments from unknown for %s',
    (_id, prompt) => {
      const rescued = rescueWhoIsNextIntent(prompt, 'unknown');
      expect(rescued?.action).toBe('show_appointments');
      expect(rescued?.rescueReason).toBe('who_is_next');
    },
  );

  it('narrows the result to the single next slot', () => {
    const rescued = rescueWhoIsNextIntent("Who's my next client?", 'unknown');
    expect(rescued?.params.statusFilter).toBe('upcoming');
    expect(rescued?.params.nextOnly).toBe(true);
  });

  it('returns null for unrelated prompts', () => {
    expect(
      rescueWhoIsNextIntent('Show me my appointments today', 'unknown'),
    ).toBeNull();
  });
});
