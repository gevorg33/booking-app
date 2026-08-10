import type { CommandResult } from './command-completion.types.js';
import type { AiClinicTestResultService } from './ai-clinic-test-result.service.js';

export type ClinicTestResultDispatchContext = {
  businessId: string;
  action: string;
  params: Record<string, unknown>;
  prompt?: string;
  userId?: string;
  confirmed: boolean;
};

export type ClinicTestResultDispatchHandler = (
  service: AiClinicTestResultService,
  ctx: ClinicTestResultDispatchContext,
) => Promise<CommandResult>;

export function buildClinicTestResultDispatchMap(): ReadonlyMap<
  string,
  ClinicTestResultDispatchHandler
> {
  const map = new Map<string, ClinicTestResultDispatchHandler>();

  map.set('enter_test_result', async (service, ctx) =>
    service.handleEnterTestResult(
      ctx.businessId,
      ctx.userId ?? '',
      { ...ctx.params, _prompt: ctx.prompt },
      ctx.prompt,
      ctx.confirmed,
    ),
  );
  map.set('release_test_result', async (service, ctx) =>
    service.handleReleaseTestResult(
      ctx.businessId,
      ctx.userId ?? '',
      { ...ctx.params, _prompt: ctx.prompt },
      ctx.prompt,
      ctx.confirmed,
    ),
  );
  map.set('transition_specimen', async (service, ctx) =>
    service.handleTransitionSpecimen(
      ctx.businessId,
      ctx.userId ?? '',
      ctx.params,
    ),
  );
  map.set('explain_lab_result_history', async (service, ctx) =>
    service.handleExplainLabResultHistory(
      ctx.businessId,
      ctx.userId ?? '',
      ctx.params,
    ),
  );
  map.set('upload_patient_result', async (service, ctx) =>
    service.handleUploadPatientResult(ctx.businessId, ctx.params, ctx.prompt),
  );
  map.set('explain_patient_results', async (service, ctx) =>
    service.handleExplainPatientResults(ctx.businessId, ctx.params, ctx.prompt),
  );
  map.set('configure_test_reference_range', async (service, ctx) =>
    service.handleConfigureTestReferenceRange(
      ctx.businessId,
      ctx.userId ?? '',
      ctx.params,
    ),
  );
  map.set('list_abnormal_results', async (service, ctx) =>
    service.handleListAbnormalResults(ctx.businessId, ctx.params),
  );

  return map;
}

/** Registry-driven dispatch table for AiClinicTestResultService (ai-cmd-ext-0.5). */
export const CLINIC_TEST_RESULT_DISPATCH_MAP =
  buildClinicTestResultDispatchMap();
