export type SpeakAssistantReplyAspect = 'read_aloud' | 'repeat' | 'generic';

export type SpeakAssistantReplyPromptFixture = {
  id: string;
  prompt: string;
  surface: 'customer' | 'public';
  expectedAction: 'speak_assistant_reply';
  rescueReason: 'speak_assistant_reply';
  aspect?: SpeakAssistantReplyAspect;
};

export const CUSTOMER_PUBLIC_SPEAK_ASSISTANT_REPLY_CLASSIFIER_RULES = `- speak_assistant_reply: MUTATE — customer app or public booking web: read the last assistant answer aloud using text-to-speech (Listen / speakReply button). Triggers: "Read that aloud", "Speak the answer", "Say that again", "Listen to the answer", "Text to speech". Uses conversationHistory or lastAssistantReply from session when present. NOT explain_voice_input (microphone / speech-to-text help), NOT give_ai_feedback (wrong answer), NOT booking_help (general funnel).`;

export const SPEAK_ASSISTANT_REPLY_PROMPTS: readonly SpeakAssistantReplyPromptFixture[] =
  [
    {
      id: 'read-that-aloud-customer',
      prompt: 'Read that aloud',
      surface: 'customer',
      expectedAction: 'speak_assistant_reply',
      rescueReason: 'speak_assistant_reply',
      aspect: 'read_aloud',
    },
    {
      id: 'speak-the-answer-customer',
      prompt: 'Speak the answer',
      surface: 'customer',
      expectedAction: 'speak_assistant_reply',
      rescueReason: 'speak_assistant_reply',
      aspect: 'read_aloud',
    },
    {
      id: 'read-it-aloud-customer',
      prompt: 'Read it aloud',
      surface: 'customer',
      expectedAction: 'speak_assistant_reply',
      rescueReason: 'speak_assistant_reply',
      aspect: 'read_aloud',
    },
    {
      id: 'say-that-again-customer',
      prompt: 'Say that again',
      surface: 'customer',
      expectedAction: 'speak_assistant_reply',
      rescueReason: 'speak_assistant_reply',
      aspect: 'repeat',
    },
    {
      id: 'listen-to-answer-customer',
      prompt: 'Listen to the answer',
      surface: 'customer',
      expectedAction: 'speak_assistant_reply',
      rescueReason: 'speak_assistant_reply',
      aspect: 'read_aloud',
    },
    {
      id: 'read-reply-aloud-customer',
      prompt: 'Can you read the reply?',
      surface: 'customer',
      expectedAction: 'speak_assistant_reply',
      rescueReason: 'speak_assistant_reply',
      aspect: 'read_aloud',
    },
    {
      id: 'tts-customer',
      prompt: 'Text to speech for that',
      surface: 'customer',
      expectedAction: 'speak_assistant_reply',
      rescueReason: 'speak_assistant_reply',
      aspect: 'read_aloud',
    },
    {
      id: 'repeat-what-you-said-customer',
      prompt: 'Repeat what you said',
      surface: 'customer',
      expectedAction: 'speak_assistant_reply',
      rescueReason: 'speak_assistant_reply',
      aspect: 'repeat',
    },
    {
      id: 'read-last-message-customer',
      prompt: 'Read the last message aloud',
      surface: 'customer',
      expectedAction: 'speak_assistant_reply',
      rescueReason: 'speak_assistant_reply',
      aspect: 'read_aloud',
    },
    {
      id: 'speak-that-reply-customer',
      prompt: 'Speak that reply',
      surface: 'customer',
      expectedAction: 'speak_assistant_reply',
      rescueReason: 'speak_assistant_reply',
      aspect: 'read_aloud',
    },
    {
      id: 'tts-please-customer',
      prompt: 'TTS please',
      surface: 'customer',
      expectedAction: 'speak_assistant_reply',
      rescueReason: 'speak_assistant_reply',
      aspect: 'generic',
    },
    {
      id: 'read-answer-out-loud-customer',
      prompt: 'Read that answer out loud',
      surface: 'customer',
      expectedAction: 'speak_assistant_reply',
      rescueReason: 'speak_assistant_reply',
      aspect: 'read_aloud',
    },
    {
      id: 'read-that-aloud-public',
      prompt: 'Read that aloud',
      surface: 'public',
      expectedAction: 'speak_assistant_reply',
      rescueReason: 'speak_assistant_reply',
      aspect: 'read_aloud',
    },
    {
      id: 'speak-the-answer-public',
      prompt: 'Speak the answer',
      surface: 'public',
      expectedAction: 'speak_assistant_reply',
      rescueReason: 'speak_assistant_reply',
      aspect: 'read_aloud',
    },
    {
      id: 'read-it-aloud-public',
      prompt: 'Read it aloud',
      surface: 'public',
      expectedAction: 'speak_assistant_reply',
      rescueReason: 'speak_assistant_reply',
      aspect: 'read_aloud',
    },
    {
      id: 'say-that-again-public',
      prompt: 'Say that again',
      surface: 'public',
      expectedAction: 'speak_assistant_reply',
      rescueReason: 'speak_assistant_reply',
      aspect: 'repeat',
    },
    {
      id: 'listen-to-answer-public',
      prompt: 'Listen to the answer',
      surface: 'public',
      expectedAction: 'speak_assistant_reply',
      rescueReason: 'speak_assistant_reply',
      aspect: 'read_aloud',
    },
    {
      id: 'read-reply-aloud-public',
      prompt: 'Can you read the reply?',
      surface: 'public',
      expectedAction: 'speak_assistant_reply',
      rescueReason: 'speak_assistant_reply',
      aspect: 'read_aloud',
    },
    {
      id: 'tts-public',
      prompt: 'Text to speech for that',
      surface: 'public',
      expectedAction: 'speak_assistant_reply',
      rescueReason: 'speak_assistant_reply',
      aspect: 'read_aloud',
    },
    {
      id: 'repeat-what-you-said-public',
      prompt: 'Repeat what you said',
      surface: 'public',
      expectedAction: 'speak_assistant_reply',
      rescueReason: 'speak_assistant_reply',
      aspect: 'repeat',
    },
    {
      id: 'read-last-message-public',
      prompt: 'Read the last message aloud',
      surface: 'public',
      expectedAction: 'speak_assistant_reply',
      rescueReason: 'speak_assistant_reply',
      aspect: 'read_aloud',
    },
    {
      id: 'speak-that-reply-public',
      prompt: 'Speak that reply',
      surface: 'public',
      expectedAction: 'speak_assistant_reply',
      rescueReason: 'speak_assistant_reply',
      aspect: 'read_aloud',
    },
    {
      id: 'tts-please-public',
      prompt: 'TTS please',
      surface: 'public',
      expectedAction: 'speak_assistant_reply',
      rescueReason: 'speak_assistant_reply',
      aspect: 'generic',
    },
    {
      id: 'read-answer-out-loud-public',
      prompt: 'Read that answer out loud',
      surface: 'public',
      expectedAction: 'speak_assistant_reply',
      rescueReason: 'speak_assistant_reply',
      aspect: 'read_aloud',
    },
  ] as const;

export const SPEAK_ASSISTANT_REPLY_HANDLER_FIXTURES = [
  {
    id: 'read-aloud-with-history',
    prompt: 'Read that aloud',
    aspect: 'read_aloud',
    params: {
      conversationHistory: [
        { role: 'user', content: 'What slots are open tomorrow?' },
        {
          role: 'assistant',
          content: 'Three slots are open tomorrow afternoon.',
        },
      ],
    },
    expectedSpeakText: 'Three slots are open tomorrow afternoon.',
  },
  {
    id: 'repeat-with-last-reply',
    prompt: 'Say that again',
    aspect: 'repeat',
    params: {
      lastAssistantReply: 'Your booking is confirmed for 3pm.',
    },
    expectedSpeakText: 'Your booking is confirmed for 3pm.',
  },
  {
    id: 'no-reply-yet',
    prompt: 'Speak the answer',
    aspect: 'read_aloud',
    params: {},
    expectedSpeakText: undefined,
  },
] as const;

export const SPEAK_ASSISTANT_REPLY_RESCUE_SCENARIOS = [
  {
    id: 'unknown-to-speak-reply',
    prompt: 'Read that aloud',
    misclassifiedAction: 'unknown',
    expectedAction: 'speak_assistant_reply',
  },
  {
    id: 'booking-help-steal-guard',
    prompt: 'Speak the answer',
    misclassifiedAction: 'booking_help',
    expectedAction: 'speak_assistant_reply',
  },
  {
    id: 'explain-app-feature-steal-guard',
    prompt: 'Read it aloud',
    misclassifiedAction: 'explain_app_feature',
    expectedAction: 'speak_assistant_reply',
  },
] as const;
