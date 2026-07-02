export type GiveAiFeedbackMultilingualScenario = {
  id: string;
  prompt: string;
  surface: 'customer' | 'public';
  locale: 'hy' | 'ru';
  expectedAction: 'give_ai_feedback';
  rescueReason: 'give_ai_feedback';
};

export const GIVE_AI_FEEDBACK_MULTILINGUAL_CLASSIFIER_RULES = `
  - give_ai_feedback: hy «սխալ էր», «սխալ ամսաթիվ»; ru «это было неправильно», «неверная дата». Assistant thumbs down/up + reason chips — NOT speak_assistant_reply, NOT explain_voice_input.`;

export const GIVE_AI_FEEDBACK_MULTILINGUAL_SCENARIOS: readonly GiveAiFeedbackMultilingualScenario[] =
  [
    {
      id: 'hy-that-was-wrong-customer',
      prompt: 'Սխալ էր',
      surface: 'customer',
      locale: 'hy',
      expectedAction: 'give_ai_feedback',
      rescueReason: 'give_ai_feedback',
    },
    {
      id: 'hy-wrong-date-customer',
      prompt: 'Սխալ ամսաթիվ',
      surface: 'customer',
      locale: 'hy',
      expectedAction: 'give_ai_feedback',
      rescueReason: 'give_ai_feedback',
    },
    {
      id: 'hy-helpful-customer',
      prompt: 'Օգտակար էր',
      surface: 'customer',
      locale: 'hy',
      expectedAction: 'give_ai_feedback',
      rescueReason: 'give_ai_feedback',
    },
    {
      id: 'ru-that-was-wrong-public',
      prompt: 'Это было неправильно',
      surface: 'public',
      locale: 'ru',
      expectedAction: 'give_ai_feedback',
      rescueReason: 'give_ai_feedback',
    },
    {
      id: 'ru-wrong-date-public',
      prompt: 'Неверная дата',
      surface: 'public',
      locale: 'ru',
      expectedAction: 'give_ai_feedback',
      rescueReason: 'give_ai_feedback',
    },
    {
      id: 'ru-not-helpful-public',
      prompt: 'Не полезно',
      surface: 'public',
      locale: 'ru',
      expectedAction: 'give_ai_feedback',
      rescueReason: 'give_ai_feedback',
    },
  ] as const;
