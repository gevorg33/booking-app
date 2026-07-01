import { handleSpeakAssistantReplyLogic } from './ai-speak-assistant-reply.logic.js';
import { SPEAK_ASSISTANT_REPLY_HANDLER_FIXTURES } from './ai-speak-assistant-reply.fixtures.js';
import { SPEAK_REPLY_LABEL } from './ai-speak-assistant-reply.util.js';

describe('ai-speak-assistant-reply.logic', () => {
  it.each(SPEAK_ASSISTANT_REPLY_HANDLER_FIXTURES)(
    'handles $id',
    async ({ prompt, aspect, params, expectedSpeakText }) => {
      const result = await handleSpeakAssistantReplyLogic(
        'biz-1',
        params,
        prompt,
      );
      expect(result.action).toBe('speak_assistant_reply');
      if (expectedSpeakText) {
        expect(result.success).toBe(true);
        expect(result.details?.aspect).toBe(aspect);
        expect(result.details?.speakText).toBe(expectedSpeakText);
        expect(result.details?.clientAction).toBe('speakAssistantReply');
        expect(result.details?.speakReplyLabel).toBe(SPEAK_REPLY_LABEL);
        expect(result.details?.ttsRequested).toBe(true);
      } else {
        expect(result.success).toBe(false);
        expect(result.details?.noAssistantReply).toBe(true);
      }
    },
  );

  it('fails clarify when prompt does not match', async () => {
    const result = await handleSpeakAssistantReplyLogic(
      'biz-1',
      {},
      'Book a haircut tomorrow',
    );
    expect(result.success).toBe(false);
    expect(result.details?.clarify).toBe(true);
  });
});
