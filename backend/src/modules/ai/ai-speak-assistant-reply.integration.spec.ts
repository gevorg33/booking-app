import { validateCommand } from './command-completion.validator.js';
import { handleSpeakAssistantReplyLogic } from './ai-speak-assistant-reply.logic.js';
import {
  SPEAK_ASSISTANT_REPLY_PROMPTS,
  SPEAK_ASSISTANT_REPLY_RESCUE_SCENARIOS,
} from './ai-speak-assistant-reply.fixtures.js';
import { rescueSpeakAssistantReplyIntent } from './ai-speak-assistant-reply.util.js';
import { makeResolvedCommand } from './command-completion.test-fixture.js';

describe('ai speak assistant reply integration (ai-cmd-customer-4.19.2)', () => {
  it.each(SPEAK_ASSISTANT_REPLY_PROMPTS)('validates $id', ({ prompt }) => {
    const validation = validateCommand(makeResolvedCommand({
      action: 'speak_assistant_reply',
      params: {},
      enrichedParams: {},
      entities: { employees: [], services: [] },
      reasoning: 'test',
      prompt,
    }));
    expect(validation.issues).toEqual([]);
  });

  it.each(SPEAK_ASSISTANT_REPLY_RESCUE_SCENARIOS)(
    'pipeline rescues $id',
    ({ prompt, misclassifiedAction, expectedAction }) => {
      expect(
        rescueSpeakAssistantReplyIntent(prompt, misclassifiedAction)?.action,
      ).toBe(expectedAction);
    },
  );

  it('executes handler with TTS client action', async () => {
    const result = await handleSpeakAssistantReplyLogic(
      'biz-1',
      {
        conversationHistory: [
          { role: 'user', content: 'What is open tomorrow?' },
          { role: 'assistant', content: 'Two slots are open tomorrow.' },
        ],
      },
      'Read that aloud',
    );
    expect(result.action).toBe('speak_assistant_reply');
    expect(result.success).toBe(true);
    expect(result.details?.clientAction).toBe('speakAssistantReply');
    expect(result.details?.speakText).toBe('Two slots are open tomorrow.');
  });
});
