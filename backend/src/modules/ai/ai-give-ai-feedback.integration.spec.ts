import { validateCommand } from './command-completion.validator.js';
import { handleGiveAiFeedbackLogic } from './ai-give-ai-feedback.logic.js';
import {
  GIVE_AI_FEEDBACK_PROMPTS,
  GIVE_AI_FEEDBACK_RESCUE_SCENARIOS,
} from './ai-give-ai-feedback.fixtures.js';
import { rescueGiveAiFeedbackIntent } from './ai-give-ai-feedback.util.js';
import { makeResolvedCommand } from './command-completion.test-fixture.js';

describe('ai give AI feedback integration (ai-cmd-customer-4.19.3)', () => {
  it.each(GIVE_AI_FEEDBACK_PROMPTS)('validates $id', ({ prompt }) => {
    const validation = validateCommand(
      makeResolvedCommand({
        action: 'give_ai_feedback',
        params: {},
        enrichedParams: {},
        entities: { employees: [], services: [] },
        reasoning: 'test',
        prompt,
      }),
    );
    expect(validation.issues).toEqual([]);
  });

  it.each(GIVE_AI_FEEDBACK_RESCUE_SCENARIOS)(
    'pipeline rescues $id',
    ({ prompt, misclassifiedAction, expectedAction }) => {
      expect(
        rescueGiveAiFeedbackIntent(prompt, misclassifiedAction)?.action,
      ).toBe(expectedAction);
    },
  );

  it('executes handler with reason submission', async () => {
    const result = await handleGiveAiFeedbackLogic(
      'biz-1',
      {
        conversationHistory: [
          { role: 'user', content: 'Book tomorrow' },
          { role: 'assistant', content: 'Booked for Monday.' },
        ],
        lastAction: 'create_booking',
      },
      'Wrong date picked',
    );
    expect(result.action).toBe('give_ai_feedback');
    expect(result.success).toBe(true);
    expect(result.details?.feedbackReason).toBe('wrong_date');
    expect(result.details?.clientAction).toBe('submitAssistantFeedback');
  });
});
