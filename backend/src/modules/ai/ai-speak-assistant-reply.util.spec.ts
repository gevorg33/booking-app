import {
  CUSTOMER_PUBLIC_SPEAK_ASSISTANT_REPLY_CLASSIFIER_RULES,
  SPEAK_REPLY_LABEL,
  buildSpeakAssistantReplySummary,
  isSpeakAssistantReplyIntent,
  isSpeakAssistantReplyPrompt,
  parseConversationHistory,
  parseSpeakAssistantReplyFromPrompt,
  parseSpeakAssistantReplyAspect,
  rescueSpeakAssistantReplyIntent,
  resolveLastAssistantReply,
} from './ai-speak-assistant-reply.util.js';
import {
  SPEAK_ASSISTANT_REPLY_PROMPTS,
  SPEAK_ASSISTANT_REPLY_RESCUE_SCENARIOS,
} from './ai-speak-assistant-reply.fixtures.js';
import { SPEAK_ASSISTANT_REPLY_MULTILINGUAL_SCENARIOS } from './ai-speak-assistant-reply-multilingual.fixtures.js';
import { isExplainVoiceInputPrompt } from './ai-explain-voice-input.util.js';

describe('ai-speak-assistant-reply.util', () => {
  it('exports classifier rules and consumer copy labels', () => {
    expect(CUSTOMER_PUBLIC_SPEAK_ASSISTANT_REPLY_CLASSIFIER_RULES).toContain(
      'speak_assistant_reply',
    );
    expect(SPEAK_REPLY_LABEL).toBe('Listen');
  });

  it.each(SPEAK_ASSISTANT_REPLY_PROMPTS.map((row) => [row.id, row] as const))(
    'detects speak assistant reply prompt for $id',
    (_id, row) => {
      expect(isSpeakAssistantReplyPrompt(row.prompt)).toBe(true);
      expect(parseSpeakAssistantReplyFromPrompt(row.prompt)).toEqual({
        aspect: expect.any(String),
      });
      expect(rescueSpeakAssistantReplyIntent(row.prompt, 'unknown')).toEqual({
        action: 'speak_assistant_reply',
        rescueReason: 'speak_assistant_reply',
      });
    },
  );

  it.each(
    SPEAK_ASSISTANT_REPLY_MULTILINGUAL_SCENARIOS.map(
      (row) => [row.id, row] as const,
    ),
  )('detects multilingual prompt for $id', (_id, row) => {
    expect(isSpeakAssistantReplyPrompt(row.prompt)).toBe(true);
    expect(rescueSpeakAssistantReplyIntent(row.prompt, 'unknown')?.action).toBe(
      'speak_assistant_reply',
    );
  });

  it.each(
    SPEAK_ASSISTANT_REPLY_RESCUE_SCENARIOS.map((row) => [row.id, row] as const),
  )('rescues $id from misclassified action', (_id, row) => {
    expect(
      rescueSpeakAssistantReplyIntent(row.prompt, row.misclassifiedAction),
    ).toEqual({
      action: row.expectedAction,
      rescueReason: 'speak_assistant_reply',
    });
  });

  it('steals from explain_voice_input (mic help)', () => {
    expect(isExplainVoiceInputPrompt('How do I use voice?')).toBe(true);
    expect(isSpeakAssistantReplyPrompt('How do I use voice?')).toBe(false);
    expect(
      rescueSpeakAssistantReplyIntent('How do I use voice?', 'unknown'),
    ).toBeNull();
  });

  it('resolves last assistant reply from history and params', () => {
    expect(
      resolveLastAssistantReply({
        lastAssistantReply: 'Direct reply text.',
      }),
    ).toBe('Direct reply text.');

    expect(
      resolveLastAssistantReply({
        conversationHistory: [
          { role: 'user', content: 'Hello' },
          { role: 'assistant', content: 'First answer' },
          { role: 'user', content: 'Read that aloud' },
        ],
      }),
    ).toBe('First answer');

    expect(parseConversationHistory({ history: [] })).toEqual([]);
    expect(parseSpeakAssistantReplyAspect('Say that again')).toBe('repeat');
    expect(buildSpeakAssistantReplySummary('read_aloud', true)).toContain(
      SPEAK_REPLY_LABEL,
    );
    expect(isSpeakAssistantReplyIntent('speak_assistant_reply')).toBe(true);
    expect(isSpeakAssistantReplyIntent('speak_assistant_reply_wrong')).toBe(
      false,
    );
  });
});
