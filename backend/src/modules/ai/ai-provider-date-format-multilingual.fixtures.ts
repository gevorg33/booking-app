import {
  CONFIGURE_PROVIDER_PUSH_DATE_FORMAT_PROMPTS,
  EXPLAIN_PROVIDER_DATE_DISPLAY_PROMPTS,
} from './ai-provider-date-format.fixtures.js';
import type { ProviderDateFormatIntent } from './ai-provider-date-format.util.js';
import type { AiEvalLocale } from './eval/ai-command-eval.types.js';

export type ProviderDateFormatMultilingualScenario = {
  id: string;
  enScenarioId: string;
  locale: Extract<AiEvalLocale, 'hy' | 'ru'>;
  prompt: string;
  expectedAction: ProviderDateFormatIntent;
  rescueReason: ProviderDateFormatIntent;
};

/** Classifier guidance for remaining hy/ru provider date-format rows (acc-2.4). */
export const PROVIDER_DATE_FORMAT_MULTILINGUAL_CLASSIFIER_RULES = `- Armenian/Russian provider date display + push time format (fmt-1.8):
  - explain_provider_date_display: hy «ինչու 12-hour format schedule-ում», «booking card dates provider mobile app-ում»; ru «почему 12-часовой формат в расписании», «как форматируются даты на карточках». NOT explain_business_date_format.
  - configure_provider_push_date_format: hy «set provider push booking times 12-hour format», «format booking times push alerts salon time settings-ով»; ru «установи 12-часовой формат в push», «форматировать время записи в push по настройкам салона». NOT explain_provider_date_display.`;

/** EN rows already covered by \`MULTILINGUAL_DATE_INPUT_PROVIDER_FORMAT_EVAL_SCENARIOS\`. */
export const PROVIDER_DATE_FORMAT_LEGACY_LOCALE_SIBLING_IDS: Record<
  string,
  { hy: string; ru: string }
> = {
  'how-booking-cards-format-dates': {
    hy: 'hy-explain-provider-cards',
    ru: 'ru-explain-provider-cards',
  },
  'date-format-from-settings': {
    hy: 'hy-explain-schedule-format',
    ru: 'ru-explain-schedule-format',
  },
  'configure-push-business-time': {
    hy: 'hy-configure-push-time',
    ru: 'ru-configure-push-time',
  },
  'enable-24h-push': {
    hy: 'hy-enable-24h-push',
    ru: 'ru-enable-24h-push',
  },
};

const EXPLAIN_I18N: Record<
  string,
  { hy: string; ru: string; expectedAction: 'explain_provider_date_display' }
> = {
  'why-12-hour-schedule': {
    hy: 'Ինչու՞ եմ my schedule appointments-ում 12-hour format time տեսնում',
    ru: 'Почему в моём расписании показывается 12-часовой формат времени',
    expectedAction: 'explain_provider_date_display',
  },
  'booking-card-date-display': {
    hy: 'How are booking card dates formatted provider mobile app-ում',
    ru: 'Как форматируются даты на карточках записи в мобильном приложении провайдера',
    expectedAction: 'explain_provider_date_display',
  },
  'explain-schedule-display': {
    hy: 'Բացատրիր provider schedule date and time display-ը',
    ru: 'Объясни отображение даты и времени в расписании провайдера',
    expectedAction: 'explain_provider_date_display',
  },
  'salon-format-from-login': {
    hy: 'Ինչ salon dateFormat են provider booking cards-ը login-ից օգտագործում',
    ru: 'Какой формат даты используют карточки записи провайдера с логина салона',
    expectedAction: 'explain_provider_date_display',
  },
};

const CONFIGURE_I18N: Record<
  string,
  { hy: string; ru: string; expectedAction: 'configure_provider_push_date_format' }
> = {
  'push-12-hour-format': {
    hy: 'Set provider push booking times-ը 12-hour format',
    ru: 'Установи 12-часовой формат времени в push уведомлениях провайдера',
    expectedAction: 'configure_provider_push_date_format',
  },
  'fcm-business-timeformat': {
    hy: 'Use business timeFormat FCM push notification bodies-ում',
    ru: 'Использовать business timeFormat в телах FCM push уведомлений',
    expectedAction: 'configure_provider_push_date_format',
  },
  'push-salon-time-settings': {
    hy: 'Format booking times push alerts-ում salon time settings-ով',
    ru: 'Форматировать время записи в push оповещениях по настройкам времени салона',
    expectedAction: 'configure_provider_push_date_format',
  },
  'configure-new-booking-push-time': {
    hy: 'Configure provider push date format new booking notifications-ի համար',
    ru: 'Настроить формат даты push для новых уведомлений о записях',
    expectedAction: 'configure_provider_push_date_format',
  },
};

function buildProviderDateFormatMultilingualScenarios(): ProviderDateFormatMultilingualScenario[] {
  const rows: ProviderDateFormatMultilingualScenario[] = [];

  for (const [enScenarioId, i18n] of Object.entries(EXPLAIN_I18N)) {
    for (const locale of ['hy', 'ru'] as const) {
      rows.push({
        id: `${enScenarioId}-${locale}`,
        enScenarioId,
        locale,
        prompt: locale === 'hy' ? i18n.hy : i18n.ru,
        expectedAction: i18n.expectedAction,
        rescueReason: i18n.expectedAction,
      });
    }
  }

  for (const [enScenarioId, i18n] of Object.entries(CONFIGURE_I18N)) {
    for (const locale of ['hy', 'ru'] as const) {
      rows.push({
        id: `${enScenarioId}-${locale}`,
        enScenarioId,
        locale,
        prompt: locale === 'hy' ? i18n.hy : i18n.ru,
        expectedAction: i18n.expectedAction,
        rescueReason: i18n.expectedAction,
      });
    }
  }

  return rows;
}

export const PROVIDER_DATE_FORMAT_EN_SCENARIO_IDS: string[] = [
  ...EXPLAIN_PROVIDER_DATE_DISPLAY_PROMPTS.map((row) => row.id),
  ...CONFIGURE_PROVIDER_PUSH_DATE_FORMAT_PROMPTS.map((row) => row.id),
];

export const PROVIDER_DATE_FORMAT_MULTILINGUAL_SCENARIOS: ProviderDateFormatMultilingualScenario[] =
  buildProviderDateFormatMultilingualScenarios();
