import { AiIntentRescueService } from './ai-intent-rescue.service.js';
import {
  E2E280_REGRESSION_PROMPTS,
  E2E280_SHORT_FEEDBACK_PROMPTS,
} from './ai-e2e280-give-ai-feedback-unknown-rescue.fixtures.js';
import {
  isGiveAiFeedbackPrompt,
  parseGiveAiFeedbackFromPrompt,
  rescueGiveAiFeedbackIntent,
} from './ai-give-ai-feedback.util.js';

describe('e2e-bug.280 give_ai_feedback unknown-phase rescue', () => {
  const rescueService = new AiIntentRescueService();

  it.each(E2E280_SHORT_FEEDBACK_PROMPTS.map((row) => [row.id, row] as const))(
    '%s — util detects short cue',
    (_id, row) => {
      expect(isGiveAiFeedbackPrompt(row.prompt)).toBe(true);
      expect(rescueGiveAiFeedbackIntent(row.prompt, 'unknown')).toEqual({
        action: 'give_ai_feedback',
        rescueReason: 'give_ai_feedback',
      });
      const parsed = parseGiveAiFeedbackFromPrompt(row.prompt);
      expect(parsed).not.toBeNull();
      if (row.expectedRating) {
        expect(parsed?.rating).toBe(row.expectedRating);
      }
      if (row.expectedReason) {
        expect(parsed?.reason).toBe(row.expectedReason);
      }
    },
  );

  it.each(E2E280_SHORT_FEEDBACK_PROMPTS.map((row) => [row.id, row] as const))(
    '%s — unknown-phase pipeline rescue returns give_ai_feedback',
    (_id, row) => {
      const rescued = rescueService.rescue({
        prompt: row.prompt,
        action: 'unknown',
        params: {},
        surface: row.surface,
      });
      expect(rescued?.action).toBe('give_ai_feedback');
      expect(rescued?.rescued).toBe(true);
    },
  );

  it.each(E2E280_REGRESSION_PROMPTS.map((row) => [row.id, row] as const))(
    '%s — longer cues still rescue from unknown',
    (_id, row) => {
      const rescued = rescueService.rescue({
        prompt: row.prompt,
        action: 'unknown',
        params: {},
        surface: row.surface,
      });
      expect(rescued?.action).toBe('give_ai_feedback');
    },
  );

  it('does not steal booking prompts from unknown', () => {
    expect(
      rescueService.rescue({
        prompt: 'Book a haircut tomorrow',
        action: 'unknown',
        params: {},
        surface: 'public',
      })?.action,
    ).not.toBe('give_ai_feedback');
  });
});
