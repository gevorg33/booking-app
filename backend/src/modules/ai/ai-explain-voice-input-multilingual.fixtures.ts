export type ExplainVoiceInputMultilingualScenario = {
  id: string;
  prompt: string;
  surface: 'customer' | 'public';
  locale: 'hy' | 'ru';
  expectedAction: 'explain_voice_input';
  rescueReason: 'explain_voice_input';
};

export const EXPLAIN_VOICE_INPUT_MULTILINGUAL_CLASSIFIER_RULES = `
  - explain_voice_input: hy «ինչպես օգտագործել ձայնը», «խոսափողը չի աշխատում»; ru «как пользоваться голосом», «микрофон не работает». Assistant mic / speech errors — NOT speak_assistant_reply.`;

export const EXPLAIN_VOICE_INPUT_MULTILINGUAL_SCENARIOS: readonly ExplainVoiceInputMultilingualScenario[] =
  [
    {
      id: 'hy-how-use-voice-customer',
      prompt: 'Ինչպես օգտագործել ձայնը',
      surface: 'customer',
      locale: 'hy',
      expectedAction: 'explain_voice_input',
      rescueReason: 'explain_voice_input',
    },
    {
      id: 'hy-mic-not-working-customer',
      prompt: 'Խոսափողը չի աշխատում',
      surface: 'customer',
      locale: 'hy',
      expectedAction: 'explain_voice_input',
      rescueReason: 'explain_voice_input',
    },
    {
      id: 'hy-mic-denied-customer',
      prompt: 'Խոսափողի թույլտվությունը մերժված է',
      surface: 'customer',
      locale: 'hy',
      expectedAction: 'explain_voice_input',
      rescueReason: 'explain_voice_input',
    },
    {
      id: 'ru-how-use-voice-public',
      prompt: 'Как пользоваться голосом?',
      surface: 'public',
      locale: 'ru',
      expectedAction: 'explain_voice_input',
      rescueReason: 'explain_voice_input',
    },
    {
      id: 'ru-mic-not-working-public',
      prompt: 'Микрофон не работает',
      surface: 'public',
      locale: 'ru',
      expectedAction: 'explain_voice_input',
      rescueReason: 'explain_voice_input',
    },
    {
      id: 'ru-no-speech-public',
      prompt: 'Речь не распознана',
      surface: 'public',
      locale: 'ru',
      expectedAction: 'explain_voice_input',
      rescueReason: 'explain_voice_input',
    },
  ] as const;
