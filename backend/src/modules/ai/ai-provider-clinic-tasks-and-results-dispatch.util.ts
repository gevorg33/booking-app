import type { CommandResult } from './command-completion.types.js';
import {
  PROVIDER_CLINIC_TASKS_AND_RESULTS_LOGIC_DISPATCH_MAP,
  type ProviderClinicTasksAndResultsDispatchContext,
  type ProviderClinicTasksAndResultsLogicDispatchHandler,
} from './ai-provider-clinic-tasks-and-results-dispatch.build.js';
import type { ProviderClinicTasksAndResultsLogicDeps } from './ai-provider-clinic-tasks-and-results.logic.js';

export function getProviderClinicTasksAndResultsLogicDispatchHandler(
  action: string,
): ProviderClinicTasksAndResultsLogicDispatchHandler | undefined {
  return PROVIDER_CLINIC_TASKS_AND_RESULTS_LOGIC_DISPATCH_MAP.get(action);
}

export async function dispatchProviderClinicTasksAndResultsLogicIntent(
  deps: ProviderClinicTasksAndResultsLogicDeps,
  ctx: ProviderClinicTasksAndResultsDispatchContext,
): Promise<CommandResult | null> {
  const handler = PROVIDER_CLINIC_TASKS_AND_RESULTS_LOGIC_DISPATCH_MAP.get(
    ctx.action,
  );
  if (!handler) return null;
  return handler(deps, ctx);
}

export function providerClinicTasksAndResultsDispatchMapHas(
  action: string,
): boolean {
  return PROVIDER_CLINIC_TASKS_AND_RESULTS_LOGIC_DISPATCH_MAP.has(action);
}
