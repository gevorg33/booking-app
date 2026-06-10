import { EXPLAIN_PROVIDER_SESSION_TIMEOUT_PROMPTS } from './ai-provider-session-timeout.fixtures.js';
import type { ProviderSessionTimeoutIntent } from './ai-provider-session-timeout.util.js';
import type { AiEvalLocale } from './eval/ai-command-eval.types.js';

export type ProviderSessionTimeoutMultilingualScenario = {
  id: string;
  enScenarioId: string;
  locale: Extract<AiEvalLocale, 'hy' | 'ru'>;
  prompt: string;
  expectedAction: ProviderSessionTimeoutIntent;
  rescueReason: ProviderSessionTimeoutIntent;
};

/** Classifier guidance for hy/ru provider session timeout (acc-2.4). */
export const PROVIDER_SESSION_TIMEOUT_MULTILINGUAL_CLASSIFIER_RULES = `- Armenian/Russian provider session timeout (clinic provider mobile app only):
  - explain_provider_session_timeout: hy «երբ provider mobile app-ը ելք կտա», «what is the provider mobile app session timeout», «որքան provider mobile app-ից անգործունակության ելք»; ru «когда мобильное приложение провайдера сделает выход», «что такое таймаут сессии приложения провайдера», «как долго до выхода при бездействии». NOT explain_hipaa_session_timeout (dashboard) and NOT configure_hipaa_session_timeout (mutate).`;

export const PROVIDER_SESSION_TIMEOUT_LEGACY_LOCALE_SIBLING_IDS: Record<
  string,
  { hy: string; ru: string }
> = {};

const SESSION_TIMEOUT_I18N: Record<string, { hy: string; ru: string }> = {
  'when-will-provider-app-logout': {
    hy: 'Երբ provider mobile app-ը ինձ ելք կտա',
    ru: 'Когда мобильное приложение провайдера сделает выход из сессии',
  },
  'provider-mobile-session-timeout': {
    hy: 'Ինչ session timeout ունի provider mobile app-ը',
    ru: 'Что такое таймаут сессии мобильного приложения провайдера',
  },
  'provider-app-inactivity-logout': {
    hy: 'Որքան provider mobile app-ից ելք է անգործունակության դեպքում',
    ru: 'Как долго до выхода из мобильного приложения провайдера при бездействии',
  },
  'provider-app-auto-logout': {
    hy: 'Երբ provider mobile app-ը auto logout է անում',
    ru: 'Когда мобильное приложение провайдера делает автовыход',
  },
};

function buildProviderSessionTimeoutMultilingualScenarios(): ProviderSessionTimeoutMultilingualScenario[] {
  const rows: ProviderSessionTimeoutMultilingualScenario[] = [];

  for (const [enScenarioId, i18n] of Object.entries(SESSION_TIMEOUT_I18N)) {
    for (const locale of ['hy', 'ru'] as const) {
      rows.push({
        id: `${enScenarioId}-${locale}`,
        enScenarioId,
        locale,
        prompt: locale === 'hy' ? i18n.hy : i18n.ru,
        expectedAction: 'explain_provider_session_timeout',
        rescueReason: 'explain_provider_session_timeout',
      });
    }
  }

  return rows;
}

export const PROVIDER_SESSION_TIMEOUT_EN_SCENARIO_IDS: string[] =
  EXPLAIN_PROVIDER_SESSION_TIMEOUT_PROMPTS.map((row) => row.id);

export const PROVIDER_SESSION_TIMEOUT_MULTILINGUAL_SCENARIOS: ProviderSessionTimeoutMultilingualScenario[] =
  buildProviderSessionTimeoutMultilingualScenarios();
