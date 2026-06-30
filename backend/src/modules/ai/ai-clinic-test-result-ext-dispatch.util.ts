import type { AiClinicTestResultService } from './ai-clinic-test-result.service.js';
import {
  isClinicTestResultExtIntent,
  type ClinicTestResultExtIntent,
} from './ai-clinic-test-result-ext.util.js';
import type { CommandResult } from './command-completion.types.js';

export type ClinicTestResultExtDispatchService = Pick<
  AiClinicTestResultService,
  | 'handleUploadPatientResult'
  | 'handleExplainPatientResults'
  | 'handleConfigureTestReferenceRange'
  | 'handleListAbnormalResults'
>;

export type ClinicTestResultExtDispatchInput = {
  businessId: string;
  userId: string;
  params: Record<string, unknown>;
  prompt?: string;
};

/** executeSingleIntent switch body for clinic test-result ext intents (ai-cmd-clinic-6-gap-3.2). */
export async function dispatchClinicTestResultExtIntent(
  action: ClinicTestResultExtIntent,
  service: ClinicTestResultExtDispatchService,
  input: ClinicTestResultExtDispatchInput,
): Promise<CommandResult> {
  switch (action) {
    case 'upload_patient_result':
      return service.handleUploadPatientResult(
        input.businessId,
        input.params,
        input.prompt,
      );
    case 'explain_patient_results':
      return service.handleExplainPatientResults(
        input.businessId,
        input.params,
        input.prompt,
      );
    case 'configure_test_reference_range':
      return service.handleConfigureTestReferenceRange(
        input.businessId,
        input.userId,
        input.params,
      );
    case 'list_abnormal_results':
      return service.handleListAbnormalResults(input.businessId, input.params);
  }
}

export function assertClinicTestResultExtCommandResultShape(
  result: CommandResult,
  expectedAction: ClinicTestResultExtIntent,
): string[] {
  const errors: string[] = [];
  if (typeof result.success !== 'boolean') {
    errors.push('CommandResult.success must be boolean');
  }
  if (result.action !== expectedAction) {
    errors.push(
      `CommandResult.action: expected ${expectedAction}, got ${result.action}`,
    );
  }
  if (typeof result.summary !== 'string' || result.summary.length === 0) {
    errors.push('CommandResult.summary must be a non-empty string');
  }
  if (result.details == null || typeof result.details !== 'object') {
    errors.push('CommandResult.details must be an object');
  }
  return errors;
}

export function coerceClinicTestResultExtIntent(action: string): ClinicTestResultExtIntent {
  if (!isClinicTestResultExtIntent(action)) {
    throw new Error(`Not a clinic test result ext intent: ${action}`);
  }
  return action;
}
