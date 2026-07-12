import type { CommandResult } from './command-completion.types.js';
import type { AiClinicTestResultService } from './ai-clinic-test-result.service.js';
import {
  CLINIC_TEST_RESULT_DISPATCH_MAP,
  type ClinicTestResultDispatchContext,
  type ClinicTestResultDispatchHandler,
} from './ai-clinic-test-result-dispatch.build.js';

export function getClinicTestResultDispatchHandler(
  action: string,
): ClinicTestResultDispatchHandler | undefined {
  return CLINIC_TEST_RESULT_DISPATCH_MAP.get(action);
}

export async function dispatchClinicTestResultIntent(
  service: AiClinicTestResultService,
  ctx: ClinicTestResultDispatchContext,
): Promise<CommandResult | null> {
  const handler = CLINIC_TEST_RESULT_DISPATCH_MAP.get(ctx.action);
  if (!handler) return null;
  return handler(service, ctx);
}

export function clinicTestResultDispatchMapHas(action: string): boolean {
  return CLINIC_TEST_RESULT_DISPATCH_MAP.has(action);
}
