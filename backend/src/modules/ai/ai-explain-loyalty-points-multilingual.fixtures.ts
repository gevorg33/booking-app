import type { AiEvalLocale } from './eval/ai-command-eval.types.js';

export type ExplainLoyaltyPointsMultilingualScenario = {
  id: string;
  locale: AiEvalLocale;
  prompt: string;
  surface: 'customer';
  expectedAction: 'explain_loyalty_points';
  rescueReason: 'explain_loyalty_points';
  focus?: 'earn' | 'worth' | 'program';
};

export const EXPLAIN_LOYALTY_POINTS_MULTILINGUAL_CLASSIFIER_RULES = `- Armenian/Russian loyalty program explain (customer mobile):
  - explain_loyalty_points: hy «ինչպես կարող եմ միավորներ ստանալ», «ինչ արժե միավորները»; ru «как заработать бонусные баллы», «сколько стоят мои баллы». Program rules — NOT loyalty_points_balance (balance only).`;

export const EXPLAIN_LOYALTY_POINTS_MULTILINGUAL_SCENARIOS: readonly ExplainLoyaltyPointsMultilingualScenario[] =
  [
    {
      id: 'how-earn-hy-customer',
      locale: 'hy',
      prompt: 'Ինչպես կարող եմ միավորներ ստանալ?',
      surface: 'customer',
      expectedAction: 'explain_loyalty_points',
      rescueReason: 'explain_loyalty_points',
      focus: 'earn',
    },
    {
      id: 'points-worth-hy-customer',
      locale: 'hy',
      prompt: 'Ինչ արժեն իմ բոնուս միավորները?',
      surface: 'customer',
      expectedAction: 'explain_loyalty_points',
      rescueReason: 'explain_loyalty_points',
      focus: 'worth',
    },
    {
      id: 'how-earn-ru-customer',
      locale: 'ru',
      prompt: 'Как заработать бонусные баллы?',
      surface: 'customer',
      expectedAction: 'explain_loyalty_points',
      rescueReason: 'explain_loyalty_points',
      focus: 'earn',
    },
    {
      id: 'points-worth-ru-customer',
      locale: 'ru',
      prompt: 'Сколько стоят мои бонусные баллы?',
      surface: 'customer',
      expectedAction: 'explain_loyalty_points',
      rescueReason: 'explain_loyalty_points',
      focus: 'worth',
    },
    {
      id: 'explain-program-hy-customer',
      locale: 'hy',
      prompt: 'Բացատրիր loyalty միավորների համակարգը',
      surface: 'customer',
      expectedAction: 'explain_loyalty_points',
      rescueReason: 'explain_loyalty_points',
      focus: 'program',
    },
    {
      id: 'explain-program-ru-customer',
      locale: 'ru',
      prompt: 'Объясни как работает программа лояльности',
      surface: 'customer',
      expectedAction: 'explain_loyalty_points',
      rescueReason: 'explain_loyalty_points',
      focus: 'program',
    },
  ];
