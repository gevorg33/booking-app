import { CLINIC_TEST_RESULT_EXT_PROMPT_FIXTURES } from './ai-clinic-test-result-ext.fixtures.js';
import {
  CLINIC_TEST_RESULT_EXT_EN_SCENARIO_IDS,
  MULTILINGUAL_CLINIC_TEST_RESULT_EXT_EVAL_SCENARIOS,
  type ClinicTestResultExtEvalScenario,
} from './ai-clinic-test-result-ext-multilingual.fixtures.js';
import type { ClinicTestResultExtIntent } from './ai-clinic-test-result-ext.util.js';
import type {
  AiCommandEvalCase,
  AiEvalLocale,
} from './eval/ai-command-eval.types.js';

export type ClinicTestResultExtLocaleParityGap = {
  enScenarioId: string;
  intent: string;
  missingLocales: AiEvalLocale[];
};

function clinicTestResultExtEnEvalCaseIdForIntent(
  intent: ClinicTestResultExtIntent,
  enScenarioId: string,
): string {
  switch (intent) {
    case 'upload_patient_result':
      return `upload-patient-result-${enScenarioId}`;
    case 'explain_patient_results':
      return `explain-patient-results-${enScenarioId}`;
    case 'configure_test_reference_range':
      return `configure-reference-range-${enScenarioId}`;
    case 'list_abnormal_results':
      return `list-abnormal-results-${enScenarioId}`;
  }
}

export function clinicTestResultExtEnEvalCaseId(enScenarioId: string): string {
  const fixture = CLINIC_TEST_RESULT_EXT_PROMPT_FIXTURES.find(
    (row) => row.id === enScenarioId,
  );
  if (!fixture) {
    throw new Error(`Unknown clinic ext EN scenario id: ${enScenarioId}`);
  }
  return clinicTestResultExtEnEvalCaseIdForIntent(
    fixture.expectedAction,
    enScenarioId,
  );
}

export function clinicTestResultExtMultilingualEvalCaseId(
  scenario: Pick<ClinicTestResultExtEvalScenario, 'id'>,
): string {
  return `clinic-test-result-ext-${scenario.id}`;
}

/** acc-2.4 / parity-2.4 — representative EN ext rows need HY + RU fixture siblings. */
export function listClinicTestResultExtLocaleParityGaps(): ClinicTestResultExtLocaleParityGap[] {
  const byEnId = new Map<
    string,
    { hy: boolean; ru: boolean; intent: string }
  >();

  for (const enScenarioId of CLINIC_TEST_RESULT_EXT_EN_SCENARIO_IDS) {
    byEnId.set(enScenarioId, { hy: false, ru: false, intent: '' });
  }

  for (const row of MULTILINGUAL_CLINIC_TEST_RESULT_EXT_EVAL_SCENARIOS) {
    const slot = byEnId.get(row.enScenarioId);
    if (!slot) continue;
    slot.intent = row.expectedAction;
    if (row.locale === 'hy') slot.hy = true;
    if (row.locale === 'ru') slot.ru = true;
  }

  for (const row of CLINIC_TEST_RESULT_EXT_PROMPT_FIXTURES) {
    const slot = byEnId.get(row.id);
    if (slot && !slot.intent) slot.intent = row.expectedAction;
  }

  const gaps: ClinicTestResultExtLocaleParityGap[] = [];
  for (const [enScenarioId, slot] of byEnId.entries()) {
    const missingLocales: AiEvalLocale[] = [];
    if (!slot.hy) missingLocales.push('hy');
    if (!slot.ru) missingLocales.push('ru');
    if (missingLocales.length === 0) continue;
    gaps.push({
      enScenarioId,
      intent: slot.intent,
      missingLocales,
    });
  }
  return gaps;
}

export function listClinicTestResultExtEvalLocaleParityGaps(
  evalCases: readonly AiCommandEvalCase[],
): string[] {
  const evalIds = new Set(evalCases.map((row) => row.id));
  const gaps: string[] = [];

  for (const enScenarioId of CLINIC_TEST_RESULT_EXT_EN_SCENARIO_IDS) {
    const enEvalId = clinicTestResultExtEnEvalCaseId(enScenarioId);
    if (!evalIds.has(enEvalId)) {
      gaps.push(`${enEvalId}: missing EN eval case`);
    }
  }

  for (const row of MULTILINGUAL_CLINIC_TEST_RESULT_EXT_EVAL_SCENARIOS) {
    const evalId = clinicTestResultExtMultilingualEvalCaseId(row);
    if (!evalIds.has(evalId)) {
      gaps.push(`${evalId}: missing HY/RU eval case`);
    }
  }

  return gaps;
}
