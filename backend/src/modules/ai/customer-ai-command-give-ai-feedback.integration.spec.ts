import { rescueGiveAiFeedbackIntent } from './ai-give-ai-feedback.util.js';
import { GIVE_AI_FEEDBACK_PROMPTS } from './ai-give-ai-feedback.fixtures.js';

describe('customer-ai-command give_ai_feedback integration (ai-cmd-customer-4.19.3)', () => {
  it.each(GIVE_AI_FEEDBACK_PROMPTS.filter((row) => row.surface === 'customer'))(
    'rescues give_ai_feedback for $id',
    (row) => {
      expect(rescueGiveAiFeedbackIntent(row.prompt, 'unknown')?.action).toBe(
        'give_ai_feedback',
      );
    },
  );
});
