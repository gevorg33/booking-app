import {
  SUBSCRIPTION_FIRST_VISIT_STEP_ACTIONS,
  type SubscriptionFirstVisitCompoundFixture,
} from './ai-subscription-first-visit-compound.fixtures.js';

export const SUBSCRIPTION_FIRST_VISIT_MULTILINGUAL_CLASSIFIER_RULES = `- subscription_first_visit HY/RU: hy «օգտագործել իմ membership-ը այսօրվա մերսման համար»; ru «использовать мой абонемент на массаж сегодня». Compound explain plan → apply credit book.`;

export const SUBSCRIPTION_FIRST_VISIT_MULTILINGUAL_SCENARIOS: readonly (SubscriptionFirstVisitCompoundFixture & {
  locale: 'hy' | 'ru';
})[] = [
  {
    id: 'hy-membership-massage-today',
    prompt: 'Օգտագործել իմ membership-ը այսօրվա մերսման համար',
    surface: 'customer',
    locale: 'hy',
    orderedActions: SUBSCRIPTION_FIRST_VISIT_STEP_ACTIONS,
    serviceName: 'մերսում',
    date: 'today',
  },
  {
    id: 'hy-plan-facial-tomorrow',
    prompt: 'Իմ պլանի credit-ը վաղը դեմքի խնամքի համար',
    surface: 'customer',
    locale: 'hy',
    orderedActions: SUBSCRIPTION_FIRST_VISIT_STEP_ACTIONS,
    serviceName: 'դեմքի խնամք',
    date: 'tomorrow',
  },
  {
    id: 'ru-membership-massage-today',
    prompt: 'Использовать мой абонемент на массаж сегодня',
    surface: 'customer',
    locale: 'ru',
    orderedActions: SUBSCRIPTION_FIRST_VISIT_STEP_ACTIONS,
    serviceName: 'массаж',
    date: 'today',
  },
  {
    id: 'ru-plan-haircut',
    prompt: 'Списать кредит по плану на стрижку',
    surface: 'customer',
    locale: 'ru',
    orderedActions: SUBSCRIPTION_FIRST_VISIT_STEP_ACTIONS,
    serviceName: 'стрижку',
  },
];
