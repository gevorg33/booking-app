import type { CommandResult } from './command-completion.types.js';
import {
  CLINIC_TEST_ORDER_LOGIC_DISPATCH_MAP,
  type ClinicTestOrderDispatchContext,
  type ClinicTestOrderLogicDispatchHandler,
} from './ai-clinic-test-order-dispatch.build.js';
import type { ClinicTestOrderLogicDeps } from './ai-clinic-test-order.logic.js';

export function getClinicTestOrderLogicDispatchHandler(
  action: string,
): ClinicTestOrderLogicDispatchHandler | undefined {
  return CLINIC_TEST_ORDER_LOGIC_DISPATCH_MAP.get(action);
}

export async function dispatchClinicTestOrderLogicIntent(
  deps: ClinicTestOrderLogicDeps,
  ctx: ClinicTestOrderDispatchContext,
): Promise<CommandResult | null> {
  const handler = CLINIC_TEST_ORDER_LOGIC_DISPATCH_MAP.get(ctx.action);
  if (!handler) return null;
  return handler(deps, ctx);
}

export function clinicTestOrderDispatchMapHas(action: string): boolean {
  return CLINIC_TEST_ORDER_LOGIC_DISPATCH_MAP.has(action);
}
