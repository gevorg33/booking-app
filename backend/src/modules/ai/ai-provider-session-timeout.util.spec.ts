import { EXPLAIN_PROVIDER_SESSION_TIMEOUT_PROMPTS } from './ai-provider-session-timeout.fixtures.js';
import {
  isExplainProviderSessionTimeoutPrompt,
  rescueProviderSessionTimeoutIntent,
} from './ai-provider-session-timeout.util.js';

describe('ai-provider-session-timeout.util', () => {
  it.each(EXPLAIN_PROVIDER_SESSION_TIMEOUT_PROMPTS)(
    'detects explain_provider_session_timeout for $id',
    ({ prompt }) => {
      expect(isExplainProviderSessionTimeoutPrompt(prompt)).toBe(true);
      expect(rescueProviderSessionTimeoutIntent(prompt, 'unknown')).toEqual({
        action: 'explain_provider_session_timeout',
        rescueReason: 'explain_provider_session_timeout',
      });
    },
  );

  it('does not steal dashboard logout questions', () => {
    expect(
      isExplainProviderSessionTimeoutPrompt('When will I be logged out?'),
    ).toBe(false);
    expect(
      rescueProviderSessionTimeoutIntent(
        'When will I be logged out?',
        'unknown',
      ),
    ).toBeNull();
  });

  it('does not steal configure HIPAA timeout prompts', () => {
    expect(
      isExplainProviderSessionTimeoutPrompt('Set HIPAA timeout to 10 minutes'),
    ).toBe(false);
  });
});
