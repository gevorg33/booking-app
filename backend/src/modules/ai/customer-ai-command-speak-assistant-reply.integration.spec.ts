import { rescueSpeakAssistantReplyIntent } from './ai-speak-assistant-reply.util.js';
import { SPEAK_ASSISTANT_REPLY_PROMPTS } from './ai-speak-assistant-reply.fixtures.js';

describe('customer-ai-command speak_assistant_reply integration (ai-cmd-customer-4.19.2)', () => {
  it.each(
    SPEAK_ASSISTANT_REPLY_PROMPTS.filter((row) => row.surface === 'customer'),
  )('rescues speak_assistant_reply for $id', (row) => {
    expect(rescueSpeakAssistantReplyIntent(row.prompt, 'unknown')?.action).toBe(
      'speak_assistant_reply',
    );
  });
});
