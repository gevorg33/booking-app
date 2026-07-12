import { PROVIDER_SHOW_APPOINTMENTS_PROMPT_SCENARIOS } from './ai-provider-show-appointments.fixtures.js';
import type { AiEvalLocale } from './eval/ai-command-eval.types.js';

export type ProviderShowAppointmentsMultilingualScenario = {
  id: string;
  enScenarioId: string;
  locale: Extract<AiEvalLocale, 'hy' | 'ru'>;
  prompt: string;
  expectedAction: 'show_appointments';
  rescueReason: 'show_appointments_pattern';
};

/** EN rows that already ship HY/RU siblings directly in PROVIDER_SHOW_APPOINTMENTS_PROMPT_SCENARIOS. */
export const PROVIDER_SHOW_APPOINTMENTS_LEGACY_LOCALE_SIBLING_IDS: Record<
  string,
  { hy: string; ru: string }
> = {
  'show-appointments-today-en': {
    hy: 'show-appointments-today-hy',
    ru: 'show-appointments-today-ru',
  },
  'show-appointments-clock-time-en': {
    hy: 'show-appointments-clock-time-hy',
    ru: 'show-appointments-clock-time-ru',
  },
};

const SHOW_APPOINTMENTS_I18N: Record<string, { hy: string; ru: string }> = {
  'show-appointments-afternoon-en': {
    hy: 'Ցույց տուր իմ ցերեկվա ժամադրությունները',
    ru: 'Покажи мои записи на вторую половину дня',
  },
  'show-appointments-morning-en': {
    hy: 'Ցույց տուր առավոտյան ժամադրությունները',
    ru: 'Покажи утренние записи',
  },
  'show-appointments-tomorrow-morning-en': {
    hy: 'Ցույց տուր վաղվա առավոտյան ժամադրությունները',
    ru: 'Покажи записи на завтра утром',
  },
  'show-appointments-confirmed-en': {
    hy: 'Ցույց տուր ընդունված ժամադրությունները',
    ru: 'Покажи мои подтверждённые записи',
  },
  'show-appointments-completed-today-en': {
    hy: 'Ցույց տուր այսօրվա կատարված ժամադրությունները',
    ru: 'Покажи закрытые записи на сегодня',
  },
  'show-appointments-clock-time-half-en': {
    hy: 'Ում եմ տեսնում ժամը 3:30-ին',
    ru: 'Кого я принимаю в 15:30?',
  },
  'show-appointments-no-show-en': {
    hy: 'Ցույց տուր իմ բաց թողած ժամադրությունները',
    ru: 'Покажи мои записи с неявкой',
  },
  'show-appointments-tomorrow-all-en': {
    hy: 'Ցույց տուր վաղվա բոլոր ժամադրությունները',
    ru: 'Покажи все мои записи на завтра',
  },
  'show-appointments-weekday-en': {
    hy: 'Ցույց տուր ուրբաթի ժամադրությունները',
    ru: 'Покажи мои записи на пятницу',
  },
  'show-appointments-explicit-date-en': {
    hy: 'Ցույց տուր մարտի 5-ի ժամադրությունները',
    ru: 'Покажи записи на 5 марта',
  },
};

function buildProviderShowAppointmentsMultilingualScenarios(): ProviderShowAppointmentsMultilingualScenario[] {
  const rows: ProviderShowAppointmentsMultilingualScenario[] = [];

  for (const [enScenarioId, i18n] of Object.entries(SHOW_APPOINTMENTS_I18N)) {
    for (const locale of ['hy', 'ru'] as const) {
      rows.push({
        id: `${enScenarioId}-${locale}`,
        enScenarioId,
        locale,
        prompt: locale === 'hy' ? i18n.hy : i18n.ru,
        expectedAction: 'show_appointments',
        rescueReason: 'show_appointments_pattern',
      });
    }
  }

  return rows;
}

export const PROVIDER_SHOW_APPOINTMENTS_EN_SCENARIO_IDS: string[] =
  PROVIDER_SHOW_APPOINTMENTS_PROMPT_SCENARIOS.filter((row) =>
    row.id.endsWith('-en'),
  ).map((row) => row.id);

export const PROVIDER_SHOW_APPOINTMENTS_MULTILINGUAL_SCENARIOS: ProviderShowAppointmentsMultilingualScenario[] =
  buildProviderShowAppointmentsMultilingualScenarios();
