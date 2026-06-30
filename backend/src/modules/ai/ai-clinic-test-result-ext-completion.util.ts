import type {
  ResolvedCommand,
  ValidationIssue,
} from './command-completion.types.js';
import {
  getClinicTestResultExtIntentParamSpec,
  isClinicTestResultExtValidatedIntent,
} from './ai-command-entity-params.registry.js';
import {
  parseConfigureTestReferenceRangeFromPrompt,
  parseExplainPatientResultsFromPrompt,
  parseUploadPatientResultFromPrompt,
} from './ai-clinic-test-result-ext.util.js';

export { isClinicTestResultExtValidatedIntent };

const issue = (
  field: string,
  label: string,
  message: string,
  example: string,
): ValidationIssue => ({ field, label, message, example });

function paramPresent(cmd: ResolvedCommand, key: string): boolean {
  const value = cmd.params[key] ?? cmd.enrichedParams[key];
  if (value === undefined || value === null || value === '') return false;
  if (Array.isArray(value)) return value.length > 0;
  return true;
}

function rangeValuePresent(cmd: ResolvedCommand, key: 'normalLow' | 'normalHigh'): boolean {
  const value = cmd.params[key] ?? cmd.enrichedParams[key];
  if (value === undefined || value === null || value === '') return false;
  return true;
}

export function validateClinicTestResultExtCommand(
  cmd: ResolvedCommand,
): ValidationIssue[] {
  if (!isClinicTestResultExtValidatedIntent(cmd.action)) return [];

  const spec = getClinicTestResultExtIntentParamSpec(cmd.action);
  if (!spec) return [];

  const prompt = cmd.prompt ?? '';
  const mergedParams = { ...cmd.params, ...cmd.enrichedParams };

  switch (cmd.action) {
    case 'upload_patient_result': {
      const parsed = parseUploadPatientResultFromPrompt(prompt, mergedParams);
      if (parsed?.orderId || paramPresent(cmd, 'orderId')) return [];
      return [
        issue(
          'orderId',
          'Lab order',
          'Specify the lab order to attach a result file',
          'Upload lab result for order #abc123',
        ),
      ];
    }

    case 'explain_patient_results': {
      const parsed = parseExplainPatientResultsFromPrompt(prompt, mergedParams);
      if (
        parsed?.customerName ||
        parsed?.orderId ||
        paramPresent(cmd, 'customerName') ||
        paramPresent(cmd, 'orderId') ||
        !!cmd.entities.customer
      ) {
        return [];
      }
      return [
        issue(
          'customerName',
          'Patient or order',
          'Specify the patient name or lab order to explain results',
          "Explain Maria's lab results",
        ),
      ];
    }

    case 'configure_test_reference_range': {
      const parsed = parseConfigureTestReferenceRangeFromPrompt(prompt, mergedParams);
      const measurementCode =
        parsed?.measurementCode ??
        (typeof mergedParams.measurementCode === 'string'
          ? mergedParams.measurementCode.trim()
          : undefined);
      const normalLow = parsed?.normalLow ?? mergedParams.normalLow;
      const normalHigh = parsed?.normalHigh ?? mergedParams.normalHigh;

      const issues: ValidationIssue[] = [];
      if (!measurementCode) {
        issues.push(
          issue(
            'measurementCode',
            'Measurement',
            'Specify which measurement to configure (e.g. WBC, glucose)',
            'Set WBC reference range from 4.0 to 11.0',
          ),
        );
      }
      if (!normalLow && !rangeValuePresent(cmd, 'normalLow')) {
        issues.push(
          issue(
            'normalLow',
            'Normal low',
            'Specify the lower bound of the reference range',
            'Set WBC reference range from 4.0 to 11.0',
          ),
        );
      }
      if (!normalHigh && !rangeValuePresent(cmd, 'normalHigh')) {
        issues.push(
          issue(
            'normalHigh',
            'Normal high',
            'Specify the upper bound of the reference range',
            'Set WBC reference range from 4.0 to 11.0',
          ),
        );
      }
      return issues;
    }

    case 'list_abnormal_results':
      return [];

    default:
      return [];
  }
}
