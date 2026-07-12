import { PROVIDER_PUSH_SETUP_PROMPT_SCENARIOS } from './ai-provider-push-setup.fixtures.js';
import type { ProviderPushSetupIntent } from './ai-provider-push-setup.util.js';
import type { AiEvalLocale } from './eval/ai-command-eval.types.js';

export type ProviderPushSetupMultilingualScenario = {
  id: string;
  enScenarioId: string;
  locale: Extract<AiEvalLocale, 'hy' | 'ru'>;
  prompt: string;
  expectedAction: ProviderPushSetupIntent;
  rescueReason: ProviderPushSetupIntent;
};

/** Classifier guidance for hy/ru provider push setup (acc-2.4). */
export const PROVIDER_PUSH_SETUP_MULTILINGUAL_CLASSIFIER_RULES = `- Armenian/Russian provider push setup (provider mobile app only):
  - explain_push_setup: hy «ինչպես են աշխատում push-ը provider app-ում», «օգնիր կարգավորել booking alerts-ը»; ru «как работают push в приложении провайдера», «где включить push-оповещения о записях». NOT explain_last_push.
  - enable_push_notifications: hy «միացնել push-ը նոր ամրագրումների համար»; ru «включить push о новых записях», «активировать оповещения на телефоне». NOT explain_push_setup.
  - explain_push_registration_status: hy «push ծանուցումների կարգավիճակը իմ provider հաշվում», «ստուգիր push գրանցման կարգավիճակը»; ru «какой статус push-уведомлений в приложении провайдера», «я зарегистрирован на push-уведомления». NOT enable_push_notifications.`;

/** EN rows that already ship HY/RU siblings in the main adopt-6.7 fixture table. */
export const PROVIDER_PUSH_SETUP_LEGACY_LOCALE_SIBLING_IDS: Record<
  string,
  { hy: string; ru: string }
> = {
  'explain-push-setup-en': {
    hy: 'explain-push-setup-hy',
    ru: 'explain-push-setup-ru',
  },
  'enable-push-en': {
    hy: 'enable-push-hy',
    ru: 'enable-push-ru',
  },
};

const EXPLAIN_I18N: Record<string, { hy: string; ru: string }> = {
  'explain-push-setup-en-2': {
    hy: 'Օգնիր կարգավորել booking alerts-ը իմ հեռախոսում provider հավելվածում',
    ru: 'Помоги настроить оповещения о записях на телефоне в приложении провайдера',
  },
  'explain-push-setup-en-3': {
    hy: 'Ի՞նչ է պետք FCM alerts-ը միացնելու համար provider mobile app-ում',
    ru: 'Что нужно, чтобы включить FCM-оповещения в мобильном приложении провайдера',
  },
  'explain-push-setup-en-4': {
    hy: 'Բացատրիր push notification permissions-ը provider-ների համար',
    ru: 'Объясни разрешения push-уведомлений для провайдеров',
  },
  'explain-push-setup-en-5': {
    hy: 'Որտե՞ղ եմ միացնում booking push alerts-ը provider app-ում',
    ru: 'Где включить push-оповещения о записях в приложении провайдера',
  },
};

const ENABLE_I18N: Record<string, { hy: string; ru: string }> = {
  'enable-push-en-2': {
    hy: 'Միացնել provider app alerts-ը',
    ru: 'Включить оповещения приложения провайдера',
  },
  'enable-push-en-3': {
    hy: 'Ակտիվացնել booking notifications-ը իմ հեռախոսում',
    ru: 'Активировать уведомления о записях на моём телефоне',
  },
};

const STATUS_I18N: Record<string, { hy: string; ru: string }> = {
  'push-status-en': {
    hy: 'Ասա՛ push ծանուցումների կարգավիճակը իմ provider հաշվում',
    ru: 'Какой статус push-уведомлений в моём аккаунте провайдера?',
  },
  'push-status-en-2': {
    hy: 'Push գրանցման կարգավիճակը ստուգիր provider հավելվածում',
    ru: 'Я зарегистрирован на push-уведомления в приложении провайдера?',
  },
  'push-status-en-3': {
    hy: 'Ստուգիր իմ provider push ծանուցումների կարգավիճակը',
    ru: 'Проверь статус моих push-уведомлений провайдера',
  },
};

function buildProviderPushSetupMultilingualScenarios(): ProviderPushSetupMultilingualScenario[] {
  const rows: ProviderPushSetupMultilingualScenario[] = [];

  for (const [enScenarioId, i18n] of Object.entries(EXPLAIN_I18N)) {
    for (const locale of ['hy', 'ru'] as const) {
      rows.push({
        id: `${enScenarioId}-${locale}`,
        enScenarioId,
        locale,
        prompt: locale === 'hy' ? i18n.hy : i18n.ru,
        expectedAction: 'explain_push_setup',
        rescueReason: 'explain_push_setup',
      });
    }
  }

  for (const [enScenarioId, i18n] of Object.entries(ENABLE_I18N)) {
    for (const locale of ['hy', 'ru'] as const) {
      rows.push({
        id: `${enScenarioId}-${locale}`,
        enScenarioId,
        locale,
        prompt: locale === 'hy' ? i18n.hy : i18n.ru,
        expectedAction: 'enable_push_notifications',
        rescueReason: 'enable_push_notifications',
      });
    }
  }

  for (const [enScenarioId, i18n] of Object.entries(STATUS_I18N)) {
    for (const locale of ['hy', 'ru'] as const) {
      rows.push({
        id: `${enScenarioId}-${locale}`,
        enScenarioId,
        locale,
        prompt: locale === 'hy' ? i18n.hy : i18n.ru,
        expectedAction: 'explain_push_registration_status',
        rescueReason: 'explain_push_registration_status',
      });
    }
  }

  return rows;
}

export const PROVIDER_PUSH_SETUP_EN_SCENARIO_IDS: string[] =
  PROVIDER_PUSH_SETUP_PROMPT_SCENARIOS.filter(
    (row) => row.id.endsWith('-en') || /-en-\d+$/.test(row.id),
  ).map((row) => row.id);

export const PROVIDER_PUSH_SETUP_MULTILINGUAL_SCENARIOS: ProviderPushSetupMultilingualScenario[] =
  buildProviderPushSetupMultilingualScenarios();
