import {
  ASSISTANT_FEEDBACK_REASON_OPTIONS,
  CUSTOMER_PUBLIC_GIVE_AI_FEEDBACK_CLASSIFIER_RULES,
  FEEDBACK_DOWN_LABEL,
  FEEDBACK_THANKS,
  FEEDBACK_UP_LABEL,
  buildGiveAiFeedbackSummary,
  isGiveAiFeedbackIntent,
  isGiveAiFeedbackPrompt,
  parseGiveAiFeedbackAspect,
  parseGiveAiFeedbackFromPrompt,
  parseGiveAiFeedbackReason,
  parseGiveAiFeedbackRating,
  rescueGiveAiFeedbackIntent,
  resolveGiveAiFeedbackClientAction,
} from './ai-give-ai-feedback.util.js';
import {
  GIVE_AI_FEEDBACK_PROMPTS,
  GIVE_AI_FEEDBACK_RESCUE_SCENARIOS,
} from './ai-give-ai-feedback.fixtures.js';
import { GIVE_AI_FEEDBACK_MULTILINGUAL_SCENARIOS } from './ai-give-ai-feedback-multilingual.fixtures.js';
import { isSpeakAssistantReplyPrompt } from './ai-speak-assistant-reply.util.js';

describe('ai-give-ai-feedback.util', () => {
  it('exports classifier rules and consumer copy labels', () => {
    expect(CUSTOMER_PUBLIC_GIVE_AI_FEEDBACK_CLASSIFIER_RULES).toContain(
      'give_ai_feedback',
    );
    expect(FEEDBACK_UP_LABEL).toBe('Helpful');
    expect(FEEDBACK_DOWN_LABEL).toBe('Not helpful');
    expect(ASSISTANT_FEEDBACK_REASON_OPTIONS).toHaveLength(5);
  });

  it.each(GIVE_AI_FEEDBACK_PROMPTS.map((row) => [row.id, row] as const))(
    'detects give AI feedback prompt for $id',
    (_id, row) => {
      expect(isGiveAiFeedbackPrompt(row.prompt)).toBe(true);
      const parsed = parseGiveAiFeedbackFromPrompt(row.prompt);
      expect(parsed).toEqual({
        aspect: row.aspect ?? expect.any(String),
        rating: row.rating ?? expect.any(String),
        ...(row.reason ? { reason: row.reason } : {}),
      });
      expect(rescueGiveAiFeedbackIntent(row.prompt, 'unknown')).toEqual({
        action: 'give_ai_feedback',
        rescueReason: 'give_ai_feedback',
      });
    },
  );

  it.each([
    ['Not helpful', 'down', 'negative'],
    ['not helpful', 'down', 'negative'],
    ['NOT HELPFUL', 'down', 'negative'],
    ['That was not helpful', 'down', 'negative'],
    ['Helpful', 'up', 'positive'],
    ['That was helpful', 'up', 'positive'],
  ] as const)(
    'e2e-bug.265: %s → rating=%s aspect=%s',
    (prompt, rating, aspect) => {
      expect(parseGiveAiFeedbackRating(prompt)).toBe(rating);
      expect(parseGiveAiFeedbackFromPrompt(prompt)).toEqual(
        expect.objectContaining({ rating, aspect }),
      );
    },
  );

  it.each(
    GIVE_AI_FEEDBACK_MULTILINGUAL_SCENARIOS.map(
      (row) => [row.id, row] as const,
    ),
  )('detects multilingual prompt for $id', (_id, row) => {
    expect(isGiveAiFeedbackPrompt(row.prompt)).toBe(true);
    expect(rescueGiveAiFeedbackIntent(row.prompt, 'unknown')?.action).toBe(
      'give_ai_feedback',
    );
  });

  it.each(
    GIVE_AI_FEEDBACK_RESCUE_SCENARIOS.map((row) => [row.id, row] as const),
  )('rescues $id from misclassified action', (_id, row) => {
    expect(
      rescueGiveAiFeedbackIntent(row.prompt, row.misclassifiedAction),
    ).toEqual({
      action: row.expectedAction,
      rescueReason: 'give_ai_feedback',
    });
  });

  it('steals from speak_assistant_reply (read aloud)', () => {
    expect(isSpeakAssistantReplyPrompt('Read that aloud')).toBe(true);
    expect(isGiveAiFeedbackPrompt('Read that aloud')).toBe(false);
  });

  it('parses rating, reason, and client action', () => {
    expect(parseGiveAiFeedbackReason('Wrong date picked')).toBe('wrong_date');
    expect(parseGiveAiFeedbackRating('That was helpful')).toBe('up');
    expect(
      parseGiveAiFeedbackAspect('That was wrong', {}, undefined, 'down'),
    ).toBe('negative');
    expect(resolveGiveAiFeedbackClientAction('up')).toBe(
      'submitAssistantFeedback',
    );
    expect(resolveGiveAiFeedbackClientAction('down', 'wrong_date')).toBe(
      'submitAssistantFeedback',
    );
    expect(resolveGiveAiFeedbackClientAction('down')).toBe(
      'openAssistantFeedback',
    );
    expect(buildGiveAiFeedbackSummary('up')).toBe(FEEDBACK_THANKS);
    expect(isGiveAiFeedbackIntent('give_ai_feedback')).toBe(true);
  });
});
