import { listClinicTestResultExtLocaleParityGaps } from './ai-clinic-test-result-ext-locale-parity.util.js';
import {
  AI_COMMAND_EVAL_CLINIC_TEST_RESULT_EXT_CASES,
  AI_COMMAND_EVAL_CLINIC_TEST_RESULT_EXT_MULTILINGUAL_CASES,
} from './eval/ai-command-eval.cases.js';
import { AI_COMMAND_EVAL_CLINIC_TEST_RESULT_EXT_CLASSIFIER_CASES } from './ai-clinic-test-result-ext.eval.util.js';
import { evaluateDeterministicEvalCase } from './eval/ai-command-eval.runner.js';
import { buildDeterministicAccuracyReport } from './eval/ai-command-eval.report.js';

const CLINIC_EXT_DASHBOARD_EVAL_CASES = [
  ...AI_COMMAND_EVAL_CLINIC_TEST_RESULT_EXT_CASES,
  ...AI_COMMAND_EVAL_CLINIC_TEST_RESULT_EXT_CLASSIFIER_CASES,
  ...AI_COMMAND_EVAL_CLINIC_TEST_RESULT_EXT_MULTILINGUAL_CASES,
];

const CLINIC_EXT_INTENT_IDS = [
  'upload_patient_result',
  'explain_patient_results',
  'configure_test_reference_range',
  'list_abnormal_results',
] as const;

describe('ai-cmd-clinic-6-gap exit criteria (gap-1–4, parity-2.4 / acc-2.4)', () => {
  it('has zero HY/RU locale parity gaps for ext EN eval ids', () => {
    expect(listClinicTestResultExtLocaleParityGaps()).toEqual([]);
  });

  it('tags every ext eval row with dashboard surface and access tier', () => {
    for (const evalCase of CLINIC_EXT_DASHBOARD_EVAL_CASES) {
      expect(evalCase.surface).toBe('dashboard');
      expect(evalCase.expect.accessTier).toBeDefined();
    }
  });

  it('passes deterministic eval runner for every ext dashboard eval case', () => {
    const failures: string[] = [];
    for (const evalCase of CLINIC_EXT_DASHBOARD_EVAL_CASES) {
      const result = evaluateDeterministicEvalCase(evalCase);
      if (!result.passed) {
        failures.push(`${evalCase.id}: ${result.errors.join('; ')}`);
      }
    }
    expect(failures).toEqual([]);
  });

  it('has zero per-intent regression on ext dashboard eval subset (acc-2.4)', () => {
    const report = buildDeterministicAccuracyReport(CLINIC_EXT_DASHBOARD_EVAL_CASES);
    expect(report.failed).toBe(0);
    for (const intentId of CLINIC_EXT_INTENT_IDS) {
      const row = report.byIntent.find((entry) => entry.intent === intentId);
      expect(row?.passed).toBe(row?.total);
      expect(row?.total).toBeGreaterThan(0);
    }
  });
});
