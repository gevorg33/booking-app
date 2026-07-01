import {
  RESULTS_THEN_REBOOK_STEP_ACTIONS,
  type ResultsThenRebookCompoundFixture,
} from './ai-results-then-rebook-compound.fixtures.js';

export const RESULTS_THEN_REBOOK_MULTILINGUAL_CLASSIFIER_RULES = `- results_then_rebook HY/RU: hy «արդյունքները թողարկված են — ամրագրել հաջորդ այցը նախորդի պես»; ru «результаты готовы — записаться повторно как в прошлый раз». Compound explain result status → rebook last.`;

export const RESULTS_THEN_REBOOK_MULTILINGUAL_SCENARIOS: readonly (ResultsThenRebookCompoundFixture & {
  locale: 'hy' | 'ru';
})[] = [
  {
    id: 'hy-released-follow-up',
    prompt: 'Արդյունքները թողարկված են — ամրագրել follow-up նախորդի պես',
    surface: 'customer',
    locale: 'hy',
    orderedActions: RESULTS_THEN_REBOOK_STEP_ACTIONS,
    status: 'Released',
  },
  {
    id: 'hy-ready-rebook',
    prompt: 'Իմ լաբ արդյունքները պատրաստ են; վերամագրվել վերջին այցը',
    surface: 'customer',
    locale: 'hy',
    orderedActions: RESULTS_THEN_REBOOK_STEP_ACTIONS,
    status: 'Released',
  },
  {
    id: 'ru-released-follow-up',
    prompt:
      'Результаты выпущены — записаться на повторный визит как в прошлый раз',
    surface: 'customer',
    locale: 'ru',
    orderedActions: RESULTS_THEN_REBOOK_STEP_ACTIONS,
    status: 'Released',
  },
  {
    id: 'ru-ready-rebook',
    prompt: 'Мои лабораторные результаты готовы; повторить последнюю запись',
    surface: 'customer',
    locale: 'ru',
    orderedActions: RESULTS_THEN_REBOOK_STEP_ACTIONS,
    status: 'Released',
  },
];
