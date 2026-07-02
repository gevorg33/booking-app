import type { AiEvalLocale } from './eval/ai-command-eval.types.js';

export type PayAtVenueFallbackMultilingualScenario = {
  id: string;
  locale: AiEvalLocale;
  prompt: string;
  surface: 'customer' | 'public';
  expectedAction: 'pay_at_venue_fallback';
  rescueReason: 'pay_at_venue_fallback';
};

export const PAY_AT_VENUE_FALLBACK_MULTILINGUAL_CLASSIFIER_RULES = `- Armenian/Russian pay-at-venue fallback (customer + public booking):
  - pay_at_venue_fallback: hy «բաց թող առցանց վճարումը», «վճարեմ սalonում»; ru «пропустить онлайн оплату», «оплатить в салоне вместо карты». Skip optional online checkout — NOT pay_cash_at_visit without skip cue.`;

export const PAY_AT_VENUE_FALLBACK_MULTILINGUAL_SCENARIOS: PayAtVenueFallbackMultilingualScenario[] =
  [
    {
      id: 'skip-online-hy-customer',
      locale: 'hy',
      prompt: 'Բաց թող առցանց վճարումը',
      surface: 'customer',
      expectedAction: 'pay_at_venue_fallback',
      rescueReason: 'pay_at_venue_fallback',
    },
    {
      id: 'pay-salon-instead-hy-public',
      locale: 'hy',
      prompt: 'Վճարեմ salon-ում instead',
      surface: 'public',
      expectedAction: 'pay_at_venue_fallback',
      rescueReason: 'pay_at_venue_fallback',
    },
    {
      id: 'skip-online-ru-customer',
      locale: 'ru',
      prompt: 'Пропустить онлайн оплату',
      surface: 'customer',
      expectedAction: 'pay_at_venue_fallback',
      rescueReason: 'pay_at_venue_fallback',
    },
    {
      id: 'pay-salon-instead-ru-public',
      locale: 'ru',
      prompt: 'Оплатить в салоне вместо карты',
      surface: 'public',
      expectedAction: 'pay_at_venue_fallback',
      rescueReason: 'pay_at_venue_fallback',
    },
    {
      id: 'confirm-visit-hy-customer',
      locale: 'hy',
      prompt: 'Հաստատել և վճարել այցի ժամանակ instead',
      surface: 'customer',
      expectedAction: 'pay_at_venue_fallback',
      rescueReason: 'pay_at_venue_fallback',
    },
    {
      id: 'without-online-ru-public',
      locale: 'ru',
      prompt: 'Без онлайн оплаты — оплатить при визите',
      surface: 'public',
      expectedAction: 'pay_at_venue_fallback',
      rescueReason: 'pay_at_venue_fallback',
    },
  ];
