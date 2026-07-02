import type { AiEvalLocale } from './eval/ai-command-eval.types.js';
import {
  CLINIC_LAB_DAY_CLOSE_COMPOUND_PROMPTS,
  CLINIC_LAB_DAY_CLOSE_EN_SCENARIO_IDS,
} from './ai-clinic-lab-day-close-compound.fixtures.js';
import type { ClinicLabDayCloseStepAction } from './ai-clinic-lab-day-close-compound.util.js';

export type ClinicLabDayCloseMultilingualScenario = {
  id: string;
  enScenarioId: string;
  locale: Extract<AiEvalLocale, 'hy' | 'ru'>;
  prompt: string;
  orderedActions: ClinicLabDayCloseStepAction[];
  paramsPartial?: Record<string, unknown>;
};

const I18N: Record<string, { hy: string; ru: string }> = {
  'lab-day-close-maria-e2e-en': {
    hy: 'Lab day close end-to-end: list pending test orders for today, enter WBC 12.5 for order abc123, release results to Maria, notify her when results are ready',
    ru: 'Закрытие лабораторного дня end-to-end: list pending test orders for today, enter WBC 12.5 for order abc123, release results to Maria, notify her when results are ready',
  },
  'close-lab-day-today-john-en': {
    hy: 'Փակել lab day for today — show pending lab orders, record hemoglobin 13.1 for order ord-42, publish results to John, send result-ready notification',
    ru: 'Close lab day на сегодня — show pending lab orders, record hemoglobin 13.1 for order ord-42, publish results to John, send result-ready notification',
  },
  'end-of-lab-day-sofia-en': {
    hy: 'End-of-lab day wrap-up: list test orders awaiting results, enter glucose 95 for order abc123, release results to Sofia, notify when results are ready',
    ru: 'Конец лабораторного дня wrap-up: list test orders awaiting results, enter glucose 95 for order abc123, release results to Sofia, notify when results are ready',
  },
  'lab-closeout-semicolon-anna-en': {
    hy: 'Lab closeout for today; list pending lab orders; enter CBC 4.2 for order abc123; release results to Anna; notify her when results are ready',
    ru: 'Lab closeout на сегодня; list pending lab orders; enter CBC 4.2 for order abc123; release results to Anna; notify her when results are ready',
  },
  'wrap-up-lab-day-alex-en': {
    hy: 'Wrap up lab day: show pending test orders, log sodium 140 for order ord-55, release results to Alex, tell patient when results are ready',
    ru: 'Wrap up lab day: show pending test orders, log sodium 140 for order ord-55, release results to Alex, tell patient when results are ready',
  },
  'finish-lab-day-james-en': {
    hy: 'Finish lab day end-to-end — list lab orders for today, enter WBC 11.0 for order abc123, publish results to James, alert when results are ready',
    ru: 'Finish lab day end-to-end — list lab orders на сегодня, enter WBC 11.0 for order abc123, publish results to James, alert when results are ready',
  },
  'close-out-lab-elena-en': {
    hy: 'Close out the lab for today: list pending test orders, record hemoglobin 12.8 for order abc123, release results to Elena, send notification when results are ready',
    ru: 'Close out the lab на сегодня: list pending test orders, record hemoglobin 12.8 for order abc123, release results to Elena, send notification when results are ready',
  },
  'lab-day-close-cbc-maria-en': {
    hy: 'Lab day close: show test orders awaiting results, enter CBC 4.5 for order ord-99, release to patient Maria, notify Maria when lab results are ready',
    ru: 'Lab day close: show test orders awaiting results, enter CBC 4.5 for order ord-99, release to patient Maria, notify Maria when lab results are ready',
  },
  'day-close-wbc-david-en': {
    hy: 'Close the day in lab — list pending lab orders; then enter WBC 10.2 for order abc123; release results to David; notify when results are ready',
    ru: 'Close the day in lab — list pending lab orders; then enter WBC 10.2 for order abc123; release results to David; notify when results are ready',
  },
  'lab-day-wrap-up-nina-en': {
    hy: 'Lab day wrap-up end-to-end: list test orders for today, set glucose 88 for order abc123, release results to Nina, message Nina when results are ready',
    ru: 'Lab day wrap-up end-to-end: list test orders на сегодня, set glucose 88 for order abc123, release results to Nina, message Nina when results are ready',
  },
  'full-lab-close-leo-en': {
    hy: 'Full lab day close for today: show pending test orders, enter hemoglobin 14.0 for order ord-12, release results to Leo, notify patient when results are ready',
    ru: 'Full lab day close на сегодня: show pending test orders, enter hemoglobin 14.0 for order ord-12, release results to Leo, notify patient when results are ready',
  },
};

const EN_BY_ID = new Map(
  CLINIC_LAB_DAY_CLOSE_COMPOUND_PROMPTS.map((row) => [row.id, row]),
);

function buildClinicLabDayCloseMultilingualScenarios(): ClinicLabDayCloseMultilingualScenario[] {
  const rows: ClinicLabDayCloseMultilingualScenario[] = [];
  for (const enScenarioId of CLINIC_LAB_DAY_CLOSE_EN_SCENARIO_IDS) {
    const i18n = I18N[enScenarioId];
    const enRow = EN_BY_ID.get(enScenarioId);
    if (!i18n || !enRow) continue;
    for (const locale of ['hy', 'ru'] as const) {
      rows.push({
        id: `${enScenarioId}-${locale}`,
        enScenarioId,
        locale,
        prompt: locale === 'hy' ? i18n.hy : i18n.ru,
        orderedActions: [...enRow.orderedActions],
        ...(enRow.expectedParams
          ? { paramsPartial: enRow.expectedParams }
          : {}),
      });
    }
  }
  return rows;
}

export const CLINIC_LAB_DAY_CLOSE_MULTILINGUAL_SCENARIOS =
  buildClinicLabDayCloseMultilingualScenarios();
