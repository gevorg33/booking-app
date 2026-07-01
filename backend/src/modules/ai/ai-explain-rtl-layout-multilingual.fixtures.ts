export type ExplainRtlLayoutMultilingualScenario = {
  id: string;
  prompt: string;
  surface: 'customer' | 'public';
  locale: 'hy' | 'ru';
  expectedAction: 'explain_rtl_layout';
  rescueReason: 'explain_rtl_layout';
};

export const EXPLAIN_RTL_LAYOUT_MULTILINGUAL_CLASSIFIER_RULES = `
  - explain_rtl_layout: hy «ինչու է տեքստը աջից», «RTL ինչ է»; ru «почему текст справа», «что такое RTL». Reading direction / adoption-a11y.css — NOT give_ai_feedback.`;

export const EXPLAIN_RTL_LAYOUT_MULTILINGUAL_SCENARIOS: readonly ExplainRtlLayoutMultilingualScenario[] =
  [
    {
      id: 'hy-why-text-right-customer',
      prompt: 'Ինչու է տեքստը աջից',
      surface: 'customer',
      locale: 'hy',
      expectedAction: 'explain_rtl_layout',
      rescueReason: 'explain_rtl_layout',
    },
    {
      id: 'hy-what-is-rtl-customer',
      prompt: 'RTL ինչ է',
      surface: 'customer',
      locale: 'hy',
      expectedAction: 'explain_rtl_layout',
      rescueReason: 'explain_rtl_layout',
    },
    {
      id: 'hy-chat-flipped-customer',
      prompt: 'Ինչու են խոսակցության պղպռակները հակադարձ',
      surface: 'customer',
      locale: 'hy',
      expectedAction: 'explain_rtl_layout',
      rescueReason: 'explain_rtl_layout',
    },
    {
      id: 'ru-why-text-right-public',
      prompt: 'Почему текст справа?',
      surface: 'public',
      locale: 'ru',
      expectedAction: 'explain_rtl_layout',
      rescueReason: 'explain_rtl_layout',
    },
    {
      id: 'ru-what-is-rtl-public',
      prompt: 'Что такое RTL?',
      surface: 'public',
      locale: 'ru',
      expectedAction: 'explain_rtl_layout',
      rescueReason: 'explain_rtl_layout',
    },
    {
      id: 'ru-layout-backwards-public',
      prompt: 'Почему всё наоборот?',
      surface: 'public',
      locale: 'ru',
      expectedAction: 'explain_rtl_layout',
      rescueReason: 'explain_rtl_layout',
    },
  ] as const;
