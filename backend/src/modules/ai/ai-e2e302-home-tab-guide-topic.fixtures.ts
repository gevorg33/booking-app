/**
 * e2e-bug.302 — HY/RU Home-tab how-to must resolve provider-today-calendar
 * (not topic-miss EN clarify). EN Home tab must use the same topic.
 */

export type E2e302TopicCase = {
  id: string;
  prompt: string;
  expectTopicId: 'provider-today-calendar';
};

export const E2E302_HOME_TAB_TOPIC_CASES: readonly E2e302TopicCase[] = [
  {
    id: 'ai-e2e302-en-home-tab',
    prompt: 'How do I use the Home tab?',
    expectTopicId: 'provider-today-calendar',
  },
  {
    id: 'ai-e2e302-en-home-tab-step',
    prompt: 'How do I use the Home tab step by step?',
    expectTopicId: 'provider-today-calendar',
  },
  {
    id: 'ai-e2e302-hy-home-tab',
    prompt: 'Ինչպե՞ս օգտագործեմ Home tab-ը',
    expectTopicId: 'provider-today-calendar',
  },
  {
    id: 'ai-e2e302-hy-home-tab-plain',
    prompt: 'Ինչպես օգտագործեմ Home tab-ը',
    expectTopicId: 'provider-today-calendar',
  },
  {
    id: 'ai-e2e302-hy-today-tab',
    prompt: 'Ինչպե՞ս օգտագործեմ Today tab-ը',
    expectTopicId: 'provider-today-calendar',
  },
  {
    id: 'ai-e2e302-ru-home-tab',
    prompt: 'Как пользоваться вкладкой Home?',
    expectTopicId: 'provider-today-calendar',
  },
  {
    id: 'ai-e2e302-ru-today-tab',
    prompt: 'Как пользоваться вкладкой Today?',
    expectTopicId: 'provider-today-calendar',
  },
  {
    id: 'ai-e2e302-en-today-tab',
    prompt: 'How do I use the Today tab?',
    expectTopicId: 'provider-today-calendar',
  },
  {
    id: 'ai-e2e302-en-today-vs-calendar',
    prompt: 'What is Today vs calendar tab?',
    expectTopicId: 'provider-today-calendar',
  },
];

export const E2E302_CLARIFY_LOCALE_CASES = [
  {
    id: 'ai-e2e302-clarify-en',
    locale: 'en' as const,
    prompt: 'asdf qwerty zxcv',
    expectFragment: 'could not match that to a guide topic',
    forbid: 'Դեռ չկարողացա',
  },
  {
    id: 'ai-e2e302-clarify-hy-locale',
    locale: 'hy' as const,
    prompt: 'asdf qwerty zxcv',
    expectFragment: 'Դեռ չկարողացա',
    forbid: 'could not match that to a guide topic',
  },
  {
    id: 'ai-e2e302-clarify-ru-locale',
    locale: 'ru' as const,
    prompt: 'asdf qwerty zxcv',
    expectFragment: 'Пока не удалось',
    forbid: 'could not match that to a guide topic',
  },
  {
    id: 'ai-e2e302-clarify-hy-script',
    locale: undefined,
    prompt: 'ինչպես անել բլա բլա չգիտեմ թեմա',
    expectFragment: 'Դեռ չկարողացա',
    forbid: 'could not match that to a guide topic',
  },
] as const;

/** Controls — my_stats must not become Home-tab guide. */
export const E2E302_CONTROL_CASES = [
  {
    id: 'ai-e2e302-ctrl-hy-how-am-i',
    prompt: 'Ինչպե՞ս եմ այս ամիս',
    forbidTopic: 'provider-today-calendar',
  },
] as const;
