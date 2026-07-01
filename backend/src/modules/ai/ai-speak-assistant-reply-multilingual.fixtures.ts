export type SpeakAssistantReplyMultilingualScenario = {
  id: string;
  prompt: string;
  surface: 'customer' | 'public';
  locale: 'hy' | 'ru';
  expectedAction: 'speak_assistant_reply';
  rescueReason: 'speak_assistant_reply';
};

export const SPEAK_ASSISTANT_REPLY_MULTILINGUAL_CLASSIFIER_RULES = `
  - speak_assistant_reply: hy «կարդալ բարձր», «կրկին ասա»; ru «прочитай вслух», «повтори ответ». TTS for last assistant reply — NOT explain_voice_input (mic input help).`;

export const SPEAK_ASSISTANT_REPLY_MULTILINGUAL_SCENARIOS: readonly SpeakAssistantReplyMultilingualScenario[] =
  [
    {
      id: 'hy-read-aloud-customer',
      prompt: 'Կարդալ բարձր',
      surface: 'customer',
      locale: 'hy',
      expectedAction: 'speak_assistant_reply',
      rescueReason: 'speak_assistant_reply',
    },
    {
      id: 'hy-say-again-customer',
      prompt: 'Կրկին ասա',
      surface: 'customer',
      locale: 'hy',
      expectedAction: 'speak_assistant_reply',
      rescueReason: 'speak_assistant_reply',
    },
    {
      id: 'hy-listen-customer',
      prompt: 'Լսել պատասխանը',
      surface: 'customer',
      locale: 'hy',
      expectedAction: 'speak_assistant_reply',
      rescueReason: 'speak_assistant_reply',
    },
    {
      id: 'ru-read-aloud-public',
      prompt: 'Прочитай вслух',
      surface: 'public',
      locale: 'ru',
      expectedAction: 'speak_assistant_reply',
      rescueReason: 'speak_assistant_reply',
    },
    {
      id: 'ru-repeat-public',
      prompt: 'Повтори ответ',
      surface: 'public',
      locale: 'ru',
      expectedAction: 'speak_assistant_reply',
      rescueReason: 'speak_assistant_reply',
    },
    {
      id: 'ru-speak-answer-public',
      prompt: 'Озвучь ответ',
      surface: 'public',
      locale: 'ru',
      expectedAction: 'speak_assistant_reply',
      rescueReason: 'speak_assistant_reply',
    },
  ] as const;
