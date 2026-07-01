import type { AiEvalLocale } from './eval/ai-command-eval.types.js';
import type { ExplainAnalyticsConsentAspect } from './ai-explain-analytics-consent.fixtures.js';

export type ExplainAnalyticsConsentMultilingualScenario = {
  id: string;
  locale: AiEvalLocale;
  prompt: string;
  surface: 'customer';
  expectedAction: 'explain_analytics_consent';
  rescueReason: 'analytics_consent';
  aspect?: ExplainAnalyticsConsentAspect;
};

export const EXPLAIN_ANALYTICS_CONSENT_MULTILINGUAL_CLASSIFIER_RULES = `- Armenian/Russian explain analytics consent (customer mobile):
  - explain_analytics_consent: hy «Ինչու եք հարցնում վերլուծության մասին», «Անջատել օգտագործման հետևումը»; ru «Почему вы спрашиваете про аналитику», «Отключить отслеживание использования». READ analyticsConsent banner — NOT explain_push_permission.`;

export const EXPLAIN_ANALYTICS_CONSENT_MULTILINGUAL_SCENARIOS: readonly ExplainAnalyticsConsentMultilingualScenario[] =
  [
    {
      id: 'why-analytics-hy-customer',
      locale: 'hy',
      prompt: 'Ինչու եք հարցնում վերլուծության մասին',
      surface: 'customer',
      expectedAction: 'explain_analytics_consent',
      rescueReason: 'analytics_consent',
      aspect: 'why_consent',
    },
    {
      id: 'turn-off-hy-customer',
      locale: 'hy',
      prompt: 'Անջատել օգտագործման հետևումը',
      surface: 'customer',
      expectedAction: 'explain_analytics_consent',
      rescueReason: 'analytics_consent',
      aspect: 'turn_off_tracking',
    },
    {
      id: 'what-tracked-hy-customer',
      locale: 'hy',
      prompt: 'Ինչ տվյալներ եք հավաքում վերլուծության համար',
      surface: 'customer',
      expectedAction: 'explain_analytics_consent',
      rescueReason: 'analytics_consent',
      aspect: 'what_is_tracked',
    },
    {
      id: 'why-analytics-ru-customer',
      locale: 'ru',
      prompt: 'Почему вы спрашиваете про аналитику?',
      surface: 'customer',
      expectedAction: 'explain_analytics_consent',
      rescueReason: 'analytics_consent',
      aspect: 'why_consent',
    },
    {
      id: 'turn-off-ru-customer',
      locale: 'ru',
      prompt: 'Отключить отслеживание использования',
      surface: 'customer',
      expectedAction: 'explain_analytics_consent',
      rescueReason: 'analytics_consent',
      aspect: 'turn_off_tracking',
    },
    {
      id: 'anonymous-ru-customer',
      locale: 'ru',
      prompt: 'Аналитика анонимная?',
      surface: 'customer',
      expectedAction: 'explain_analytics_consent',
      rescueReason: 'analytics_consent',
      aspect: 'what_is_tracked',
    },
  ];
