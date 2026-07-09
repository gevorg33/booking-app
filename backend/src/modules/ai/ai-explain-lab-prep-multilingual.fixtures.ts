import type { AiEvalLocale } from './eval/ai-command-eval.types.js';

export const EXPLAIN_LAB_PREP_MULTILINGUAL_CLASSIFIER_RULES = `- explain_lab_prep HY/RU: hy «Պետք է լինեմ ծոմավորո՞ւմ արյան թեստի համար», «CBC-ն ծոմավոր պահանջո՞ւմ է», «որ լաբ թեստերն են ծոմավոր»; ru «Нужно ли голодать перед анализом крови», «CBC требует голодания», «какие анализы натощак». Catalog lab prep — NOT checkout fields and NOT post-booking visit prep.`;

export type ExplainLabPrepMultilingualScenario = {
  id: string;
  locale: AiEvalLocale;
  prompt: string;
  surface: 'customer' | 'public';
  expectedAction: 'explain_lab_prep';
  rescueReason: 'lab_prep';
  serviceName?: string;
};

export const EXPLAIN_LAB_PREP_MULTILINGUAL_SCENARIOS: ExplainLabPrepMultilingualScenario[] =
  [
    {
      id: 'fast-blood-hy-public',
      locale: 'hy',
      prompt: 'Պետք է լինեմ ծոմավորո՞ւմ արյան թեստի համար',
      surface: 'public',
      expectedAction: 'explain_lab_prep',
      rescueReason: 'lab_prep',
    },
    {
      id: 'cbc-fasting-hy-customer',
      locale: 'hy',
      prompt: 'CBC-ն ծոմավոր պահանջո՞ւմ է',
      surface: 'customer',
      expectedAction: 'explain_lab_prep',
      rescueReason: 'lab_prep',
      serviceName: 'CBC',
    },
    {
      id: 'which-fasting-hy-public',
      locale: 'hy',
      prompt: 'Ես պետք է ծոմավորվե՞մ լաբորատոր թեստերիս համար',
      surface: 'public',
      expectedAction: 'explain_lab_prep',
      rescueReason: 'lab_prep',
    },
    {
      id: 'fast-blood-ru-customer',
      locale: 'ru',
      prompt: 'Нужно ли голодать перед анализом крови',
      surface: 'customer',
      expectedAction: 'explain_lab_prep',
      rescueReason: 'lab_prep',
    },
    {
      id: 'cbc-fasting-ru-public',
      locale: 'ru',
      prompt: 'CBC требует голодания?',
      surface: 'public',
      expectedAction: 'explain_lab_prep',
      rescueReason: 'lab_prep',
      serviceName: 'CBC',
    },
    {
      id: 'which-fasting-ru-customer',
      locale: 'ru',
      prompt: 'Какие анализы нужно сдавать натощак?',
      surface: 'customer',
      expectedAction: 'explain_lab_prep',
      rescueReason: 'lab_prep',
    },
  ];
