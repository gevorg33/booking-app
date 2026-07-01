import {
  PROVIDER_SAME_DAY_MULTI_STEP_ACTIONS,
  type ProviderSameDayMultiCompoundFixture,
} from './ai-provider-same-day-multi-compound.fixtures.js';

export const PROVIDER_SAME_DAY_MULTI_MULTILINGUAL_CLASSIFIER_RULES = `- provider_same_day_multi HY/RU: Աննա|Մարիա|мастер + մերսում և դեմք + նույն արեւմուտք|тот же день|та же половина дня. Compound pick provider → multi-service block.`;

export const PROVIDER_SAME_DAY_MULTI_MULTILINGUAL_SCENARIOS: readonly (ProviderSameDayMultiCompoundFixture & {
  locale: 'hy' | 'ru';
})[] = [
  {
    id: 'hy-anna-massage-facial-afternoon',
    prompt: 'Աննա — մերսում և դեմքի խնամք նույն արևմուտ',
    surface: 'customer',
    locale: 'hy',
    orderedActions: PROVIDER_SAME_DAY_MULTI_STEP_ACTIONS,
    providerName: 'Աննա',
    serviceNames: ['մերսում', 'դեմքի խնամք'],
    timeOfDay: 'afternoon',
  },
  {
    id: 'hy-maria-haircut-color',
    prompt: 'Մարիայի հետ — սանրվածք և գույն նույն օր',
    surface: 'customer',
    locale: 'hy',
    orderedActions: PROVIDER_SAME_DAY_MULTI_STEP_ACTIONS,
    providerName: 'Մարիա',
    serviceNames: ['սանրվածք', 'գույն'],
  },
  {
    id: 'ru-anna-massage-facial',
    prompt: 'Анна — массаж и уход за лицом в тот же день',
    surface: 'customer',
    locale: 'ru',
    orderedActions: PROVIDER_SAME_DAY_MULTI_STEP_ACTIONS,
    providerName: 'Анна',
    serviceNames: ['массаж', 'уход за лицом'],
  },
  {
    id: 'ru-maria-haircut-color-afternoon',
    prompt: 'Записаться к Марии — стрижка и окрашивание в один день днем',
    surface: 'customer',
    locale: 'ru',
    orderedActions: PROVIDER_SAME_DAY_MULTI_STEP_ACTIONS,
    providerName: 'Марии',
    serviceNames: ['стрижка', 'окрашивание'],
    timeOfDay: 'afternoon',
  },
];
