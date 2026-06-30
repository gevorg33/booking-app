import type { AiEvalLocale } from './eval/ai-command-eval.types.js';
import {
  CLINIC_LAB_REVIEW_COMPOUND_PROMPTS,
  CLINIC_LAB_REVIEW_EN_SCENARIO_IDS,
} from './ai-clinic-lab-review-compound.fixtures.js';
import type { ClinicLabReviewStepAction } from './ai-clinic-lab-review-compound.util.js';

export type ClinicLabReviewMultilingualScenario = {
  id: string;
  enScenarioId: string;
  locale: Extract<AiEvalLocale, 'hy' | 'ru'>;
  prompt: string;
  orderedActions: ClinicLabReviewStepAction[];
  paramsPartial?: Record<string, unknown>;
};

const I18N: Record<string, { hy: string; ru: string }> = {
  'lab-review-maria-en': {
    hy: 'Lab review for Maria: list abnormal flagged measurements and explain her lab results in plain language',
    ru: 'Lab review для Maria: list abnormal flagged measurements and explain her lab results in plain language',
  },
  'list-abnormal-explain-john-en': {
    hy: 'List abnormal results for John and then explain his lab results',
    ru: 'List abnormal results для John and then explain his lab results',
  },
  'review-flagged-anna-en': {
    hy: 'Review flagged lab results for Anna; show abnormal measurements; explain what they mean',
    ru: 'Review flagged lab results для Anna; show abnormal measurements; explain what they mean',
  },
  'abnormal-review-sofia-en': {
    hy: 'Show abnormal lab results for Sofia and explain her released results',
    ru: 'Show abnormal lab results для Sofia and explain her released results',
  },
  'flagged-results-alex-en': {
    hy: 'List flagged abnormal results for Alex, then summarize his lab results in plain language',
    ru: 'List flagged abnormal results for Alex, then summarize his lab results in plain language',
  },
  'lab-review-order-abc-en': {
    hy: 'Lab review for order #abc123 — list abnormal measurements and explain the results',
    ru: 'Lab review for order #abc123 — list abnormal measurements and explain the results',
  },
  'review-abnormal-elena-en': {
    hy: 'Review abnormal results for Elena and explain her CBC results',
    ru: 'Review abnormal results для Elena and explain her CBC results',
  },
  'flagged-review-david-en': {
    hy: 'Flagged results review: list abnormal labs for David; explain his test results',
    ru: 'Flagged results review: list abnormal labs для David; explain his test results',
  },
  'abnormal-then-explain-nina-en': {
    hy: 'List abnormal results for Nina and also explain her lab results',
    ru: 'List abnormal results для Nina and also explain her lab results',
  },
  'review-flagged-leo-en': {
    hy: 'Review flagged lab results end-to-end for Leo — show abnormal flags then explain results',
    ru: 'Review flagged lab results end-to-end для Leo — show abnormal flags then explain results',
  },
};

const EN_BY_ID = new Map(
  CLINIC_LAB_REVIEW_COMPOUND_PROMPTS.map((row) => [row.id, row]),
);

function buildClinicLabReviewMultilingualScenarios(): ClinicLabReviewMultilingualScenario[] {
  const rows: ClinicLabReviewMultilingualScenario[] = [];
  for (const enScenarioId of CLINIC_LAB_REVIEW_EN_SCENARIO_IDS) {
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
        paramsPartial: enRow.expectedParams,
      });
    }
  }
  return rows;
}

export const CLINIC_LAB_REVIEW_MULTILINGUAL_SCENARIOS: ClinicLabReviewMultilingualScenario[] =
  buildClinicLabReviewMultilingualScenarios();
