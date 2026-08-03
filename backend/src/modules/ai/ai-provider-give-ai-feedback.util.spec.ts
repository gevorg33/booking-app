import {
  PROVIDER_ASSISTANT_FEEDBACK_REASON_OPTIONS,
  PROVIDER_FEEDBACK_DOWN_LABEL,
  PROVIDER_FEEDBACK_THANKS,
  PROVIDER_FEEDBACK_UP_LABEL,
  buildGiveProviderAiFeedbackSummary,
  handleGiveProviderAiFeedback,
  isGiveProviderAiFeedbackPrompt,
  parseGiveProviderAiFeedbackFromPrompt,
  rescueGiveProviderAiFeedbackIntent,
  resolveGiveProviderAiFeedbackClientAction,
} from './ai-provider-give-ai-feedback.util.js';
import { PROVIDER_GIVE_AI_FEEDBACK_PROMPTS } from './ai-provider-give-ai-feedback.fixtures.js';
import { isIntentAllowedOnSurface } from './ai-command-registry.util.js';

describe('ai-provider-give-ai-feedback.util (e2e-bug.243 / ai-cmd-provider-5.24.3)', () => {
  it('registers give_provider_ai_feedback on provider surface', () => {
    expect(
      isIntentAllowedOnSurface('give_provider_ai_feedback', 'provider'),
    ).toBe(true);
  });

  it('exports copy labels', () => {
    expect(PROVIDER_FEEDBACK_UP_LABEL).toBe('Helpful');
    expect(PROVIDER_FEEDBACK_DOWN_LABEL).toBe('Not helpful');
    expect(PROVIDER_ASSISTANT_FEEDBACK_REASON_OPTIONS).toHaveLength(5);
  });

  it.each(
    PROVIDER_GIVE_AI_FEEDBACK_PROMPTS.map((row) => [row.id, row] as const),
  )('detects provider AI feedback prompt for $id', (_id, row) => {
    expect(isGiveProviderAiFeedbackPrompt(row.prompt)).toBe(true);
    expect(parseGiveProviderAiFeedbackFromPrompt(row.prompt)).toEqual({
      aspect: row.aspect ?? expect.any(String),
      rating: row.rating ?? expect.any(String),
      ...(row.reason ? { reason: row.reason } : {}),
    });
    expect(rescueGiveProviderAiFeedbackIntent(row.prompt, 'unknown')).toEqual(
      expect.objectContaining({
        action: 'give_provider_ai_feedback',
        rescueReason: 'give_provider_ai_feedback',
        params: expect.objectContaining({
          ...(row.rating ? { feedbackRating: row.rating } : {}),
          ...(row.reason ? { feedbackReason: row.reason } : {}),
        }),
      }),
    );
  });

  it('rates Not helpful as down, not up', () => {
    expect(parseGiveProviderAiFeedbackFromPrompt('Not helpful')).toEqual({
      aspect: 'negative',
      rating: 'down',
    });
  });

  it('does not rescue when the action is already give_provider_ai_feedback', () => {
    expect(
      rescueGiveProviderAiFeedbackIntent(
        'That was wrong',
        'give_provider_ai_feedback',
      ),
    ).toBeNull();
  });

  it('resolves the client action for up vs down-with-reason vs down-without-reason', () => {
    expect(resolveGiveProviderAiFeedbackClientAction('up')).toBe(
      'submitAssistantFeedback',
    );
    expect(
      resolveGiveProviderAiFeedbackClientAction('down', 'wrong_client'),
    ).toBe('submitAssistantFeedback');
    expect(resolveGiveProviderAiFeedbackClientAction('down')).toBe(
      'openAssistantFeedback',
    );
  });

  it('builds a summary asking for reason chips when down without a reason', () => {
    expect(buildGiveProviderAiFeedbackSummary('down', undefined, true)).toBe(
      `${PROVIDER_FEEDBACK_DOWN_LABEL} — choose a reason so we can improve the assistant.`,
    );
    expect(buildGiveProviderAiFeedbackSummary('up')).toBe(
      PROVIDER_FEEDBACK_THANKS,
    );
  });

  it('handleGiveProviderAiFeedback returns a clarify failure for unrelated prompts', () => {
    const result = handleGiveProviderAiFeedback({}, 'Check in Jane Doe');
    expect(result.success).toBe(false);
    expect(result.action).toBe('give_provider_ai_feedback');
    expect(result.details.clarify).toBe(true);
  });

  it('handleGiveProviderAiFeedback flags submitAssistantFeedback for wrong client', () => {
    const result = handleGiveProviderAiFeedback({}, 'Wrong client picked');
    expect(result.success).toBe(true);
    expect(result.details.feedbackReason).toBe('wrong_client');
    expect(result.details.clientAction).toBe('submitAssistantFeedback');
  });
});
