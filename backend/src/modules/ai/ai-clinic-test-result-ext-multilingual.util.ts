import type { ClinicTestResultExtEvalScenario } from './ai-clinic-test-result-ext-multilingual.fixtures.js';
import { assertClinicTestResultParamsPartial } from './ai-clinic-test-result-multilingual.util.js';
import {
  isConfigureTestReferenceRangePrompt,
  isExplainPatientResultsPrompt,
  isListAbnormalResultsPrompt,
  isUploadPatientResultPrompt,
  parseConfigureTestReferenceRangeFromPrompt,
  parseExplainPatientResultsFromPrompt,
  parseUploadPatientResultFromPrompt,
  rescueClinicTestResultExtIntent,
  type ClinicTestResultExtIntent,
} from './ai-clinic-test-result-ext.util.js';
import { rescueClinicTestResultIntent } from './ai-clinic-test-result.util.js';

export function isClinicTestResultExtPromptForIntent(
  prompt: string,
  intent: ClinicTestResultExtIntent,
): boolean {
  switch (intent) {
    case 'upload_patient_result':
      return isUploadPatientResultPrompt(prompt);
    case 'explain_patient_results':
      return isExplainPatientResultsPrompt(prompt);
    case 'configure_test_reference_range':
      return isConfigureTestReferenceRangePrompt(prompt);
    case 'list_abnormal_results':
      return isListAbnormalResultsPrompt(prompt);
  }
}

export function parseClinicTestResultExtFromPrompt(
  prompt: string,
  intent: ClinicTestResultExtIntent,
): Record<string, unknown> | null {
  switch (intent) {
    case 'upload_patient_result':
      return parseUploadPatientResultFromPrompt(prompt);
    case 'explain_patient_results':
      return parseExplainPatientResultsFromPrompt(prompt);
    case 'configure_test_reference_range':
      return parseConfigureTestReferenceRangeFromPrompt(prompt);
    case 'list_abnormal_results':
      return isListAbnormalResultsPrompt(prompt) ? {} : null;
  }
}

export function assertClinicTestResultExtMultilingualScenario(
  scenario: ClinicTestResultExtEvalScenario,
): void {
  expect(
    isClinicTestResultExtPromptForIntent(
      scenario.prompt,
      scenario.expectedAction,
    ),
  ).toBe(true);

  const rescued = rescueClinicTestResultExtIntent(scenario.prompt, 'unknown');
  expect(rescued?.action).toBe(scenario.expectedAction);
  expect(rescued?.rescueReason).toBe(
    scenario.rescueReason ?? scenario.expectedAction,
  );
  expect(rescueClinicTestResultIntent(scenario.prompt, 'unknown')?.action).toBe(
    scenario.expectedAction,
  );

  const parsed = parseClinicTestResultExtFromPrompt(
    scenario.prompt,
    scenario.expectedAction,
  );
  if (scenario.expectedAction === 'list_abnormal_results') {
    expect(parsed).toEqual({});
    return;
  }
  assertClinicTestResultParamsPartial(parsed, scenario.paramsPartial);
}
