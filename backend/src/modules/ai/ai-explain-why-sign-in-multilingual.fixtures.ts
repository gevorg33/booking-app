import type { AiEvalLocale } from './eval/ai-command-eval.types.js';
import type { ExplainWhySignInAspect } from './ai-explain-why-sign-in.fixtures.js';

export type ExplainWhySignInMultilingualScenario = {
  id: string;
  locale: AiEvalLocale;
  prompt: string;
  surface: 'customer' | 'public';
  expectedAction: 'explain_why_sign_in';
  rescueReason: 'why_sign_in';
  aspect?: ExplainWhySignInAspect;
};

export const EXPLAIN_WHY_SIGN_IN_MULTILINGUAL_CLASSIFIER_RULES = `- Armenian/Russian sign-in value prompts (customer app + public booking page):
  - explain_why_sign_in: hy «պետք է՞ հաշիվ», «ինչ օգուտ կտա մուտքը», «կարո՞ղ եմ առանց հաշվի»; ru «нужен ли аккаунт», «зачем входить в аккаунт», «можно ли без аккаунта». Account benefits — NOT explain_guest_checkout_fields (email/phone field why).`;

export const EXPLAIN_WHY_SIGN_IN_MULTILINGUAL_SCENARIOS: ExplainWhySignInMultilingualScenario[] =
  [
    {
      id: 'need-account-hy-customer',
      locale: 'hy',
      prompt: 'Պետք է՞ հաշիվ ստեղծել ամրագրելու համար',
      surface: 'customer',
      expectedAction: 'explain_why_sign_in',
      rescueReason: 'why_sign_in',
      aspect: 'required',
    },
    {
      id: 'benefit-sign-in-hy-customer',
      locale: 'hy',
      prompt: 'Ինչ օգուտ կտա մուտք գործելը',
      surface: 'customer',
      expectedAction: 'explain_why_sign_in',
      rescueReason: 'why_sign_in',
      aspect: 'benefits',
    },
    {
      id: 'without-account-hy-customer',
      locale: 'hy',
      prompt: 'Կարո՞ղ եմ ամրագրել առանց հաշվի',
      surface: 'customer',
      expectedAction: 'explain_why_sign_in',
      rescueReason: 'why_sign_in',
      aspect: 'required',
    },
    {
      id: 'need-account-ru-public',
      locale: 'ru',
      prompt: 'Нужен ли аккаунт для записи?',
      surface: 'public',
      expectedAction: 'explain_why_sign_in',
      rescueReason: 'why_sign_in',
      aspect: 'required',
    },
    {
      id: 'benefit-sign-in-ru-customer',
      locale: 'ru',
      prompt: 'Зачем входить в аккаунт?',
      surface: 'customer',
      expectedAction: 'explain_why_sign_in',
      rescueReason: 'why_sign_in',
      aspect: 'benefits',
    },
    {
      id: 'without-account-ru-public',
      locale: 'ru',
      prompt: 'Можно ли записаться без аккаунта?',
      surface: 'public',
      expectedAction: 'explain_why_sign_in',
      rescueReason: 'why_sign_in',
      aspect: 'required',
    },
  ];
