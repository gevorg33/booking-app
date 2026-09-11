import { PROVIDER_SHOW_PROFILE_PROMPT_SCENARIOS } from './ai-provider-show-profile.fixtures.js';
import {
  isShowProviderProfilePrompt,
  rescueShowProviderProfileIntent,
} from './ai-provider-show-profile.util.js';

describe('ai-provider-show-profile.util (ai-cmd-provider-6.10.1)', () => {
  it.each(PROVIDER_SHOW_PROFILE_PROMPT_SCENARIOS.map((s) => [s.id, s.prompt]))(
    'detects and rescues %s',
    (_id, prompt) => {
      expect(isShowProviderProfilePrompt(prompt)).toBe(true);
      expect(rescueShowProviderProfileIntent(prompt, 'unknown')).toEqual({
        action: 'show_provider_profile',
        rescueReason: 'show_provider_profile',
      });
    },
  );

  it('does not shadow explain_profile_settings or update_provider_profile phrasing', () => {
    expect(isShowProviderProfilePrompt('How do I change my title?')).toBe(
      false,
    );
    expect(
      isShowProviderProfilePrompt('Update my avatar to https://x.com/a.png'),
    ).toBe(false);
    expect(isShowProviderProfilePrompt('Set my title to Senior Stylist')).toBe(
      false,
    );
  });

  it('does not match unrelated prompts', () => {
    expect(isShowProviderProfilePrompt('Show my appointments today')).toBe(
      false,
    );
  });

  it('returns null when action already matches', () => {
    expect(
      rescueShowProviderProfileIntent(
        'Show my profile',
        'show_provider_profile',
      ),
    ).toBeNull();
  });
});
