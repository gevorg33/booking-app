import {
  isExplainProviderContextPrompt,
  rescueExplainProviderContextIntent,
} from './ai-explain-provider-context.util.js';

describe('isExplainProviderContextPrompt', () => {
  it.each([
    'What can I see right now?',
    'Am I in team view or my own view?',
    "What's my role here?",
  ])('matches %s', (prompt) => {
    expect(isExplainProviderContextPrompt(prompt)).toBe(true);
  });

  it('does not match unrelated prompts', () => {
    expect(isExplainProviderContextPrompt('Show my appointments today')).toBe(
      false,
    );
  });
});

describe('rescueExplainProviderContextIntent', () => {
  it('rescues an unknown action for a matching prompt', () => {
    const result = rescueExplainProviderContextIntent(
      'What can I see right now?',
      'unknown',
    );
    expect(result?.action).toBe('explain_provider_context');
  });

  it('returns null when the action already matches', () => {
    expect(
      rescueExplainProviderContextIntent(
        'What can I see right now?',
        'explain_provider_context',
      ),
    ).toBeNull();
  });

  it('returns null for a non-matching prompt', () => {
    expect(
      rescueExplainProviderContextIntent('Show my appointments', 'unknown'),
    ).toBeNull();
  });
});
