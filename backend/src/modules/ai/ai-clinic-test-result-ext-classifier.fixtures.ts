import { CLINIC_TEST_RESULT_EXT_PROMPT_FIXTURES } from './ai-clinic-test-result-ext.fixtures.js';
import { MULTILINGUAL_CLINIC_TEST_RESULT_EXT_EVAL_SCENARIOS } from './ai-clinic-test-result-ext-multilingual.fixtures.js';
import type { ClinicTestResultExtIntent } from './ai-clinic-test-result-ext.util.js';
import type { AiEvalLocale } from './eval/ai-command-eval.types.js';

/** Top EN archetype per ext intent for classifier-without-rescue golden rows (ai-cmd-clinic-6-gap-2.3). */
export const CLINIC_TEST_RESULT_EXT_CLASSIFIER_GOLDEN_EN_SCENARIO_IDS = [
  'upload-order-hash',
  'explain-maria',
  'set-wbc-range',
  'list-abnormal-en',
] as const;

const CLASSIFIER_MULTILINGUAL_ROW_BY_EN_AND_LOCALE: Record<
  (typeof CLINIC_TEST_RESULT_EXT_CLASSIFIER_GOLDEN_EN_SCENARIO_IDS)[number],
  Record<'hy' | 'ru', string>
> = {
  'upload-order-hash': {
    hy: 'hy-upload-order-hash',
    ru: 'ru-upload-order-hash',
  },
  'explain-maria': {
    hy: 'hy-explain-maria',
    ru: 'ru-explain-maria',
  },
  'set-wbc-range': {
    hy: 'hy-set-wbc-range',
    ru: 'ru-set-wbc-range',
  },
  'list-abnormal-en': {
    hy: 'hy-list-abnormal',
    ru: 'ru-list-abnormal',
  },
};

export type ClinicTestResultExtClassifierScenario = {
  id: string;
  prompt: string;
  locale: AiEvalLocale;
  expectedAction: ClinicTestResultExtIntent;
  paramsPartial?: Record<string, unknown>;
  needsMultilingual?: boolean;
};

function buildEnClassifierScenario(
  enScenarioId: (typeof CLINIC_TEST_RESULT_EXT_CLASSIFIER_GOLDEN_EN_SCENARIO_IDS)[number],
): ClinicTestResultExtClassifierScenario {
  const fixture = CLINIC_TEST_RESULT_EXT_PROMPT_FIXTURES.find(
    (row) => row.id === enScenarioId,
  );
  if (!fixture) {
    throw new Error(`Missing EN classifier fixture: ${enScenarioId}`);
  }
  return {
    id: `en-${enScenarioId}`,
    prompt: fixture.prompt,
    locale: 'en',
    expectedAction: fixture.expectedAction,
    ...(fixture.expectedParams ? { paramsPartial: fixture.expectedParams } : {}),
  };
}

function buildLocaleClassifierScenario(
  enScenarioId: (typeof CLINIC_TEST_RESULT_EXT_CLASSIFIER_GOLDEN_EN_SCENARIO_IDS)[number],
  locale: 'hy' | 'ru',
): ClinicTestResultExtClassifierScenario {
  const rowId = CLASSIFIER_MULTILINGUAL_ROW_BY_EN_AND_LOCALE[enScenarioId][locale];
  const row = MULTILINGUAL_CLINIC_TEST_RESULT_EXT_EVAL_SCENARIOS.find(
    (entry) => entry.id === rowId,
  );
  if (!row) {
    throw new Error(`Missing ${locale} classifier fixture: ${rowId}`);
  }
  return {
    id: `${locale}-${enScenarioId}`,
    prompt: row.prompt,
    locale,
    expectedAction: row.expectedAction,
    ...(row.paramsPartial ? { paramsPartial: row.paramsPartial } : {}),
    ...(row.needsMultilingual ? { needsMultilingual: true } : {}),
  };
}

export const CLINIC_TEST_RESULT_EXT_CLASSIFIER_SCENARIOS: ClinicTestResultExtClassifierScenario[] =
  [
    ...CLINIC_TEST_RESULT_EXT_CLASSIFIER_GOLDEN_EN_SCENARIO_IDS.map(
      buildEnClassifierScenario,
    ),
    ...CLINIC_TEST_RESULT_EXT_CLASSIFIER_GOLDEN_EN_SCENARIO_IDS.flatMap(
      (enScenarioId) => [
        buildLocaleClassifierScenario(enScenarioId, 'hy'),
        buildLocaleClassifierScenario(enScenarioId, 'ru'),
      ],
    ),
  ];
