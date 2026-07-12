import type { CommandResult } from './command-completion.types.js';
import {
  CUSTOMER_CRM_LOGIC_DISPATCH_MAP,
  type CustomerCrmDispatchContext,
  type CustomerCrmLogicDispatchHandler,
} from './ai-customer-crm-dispatch.build.js';
import type { CustomerCrmLogicDeps } from './ai-customer-crm.logic.js';

export function getCustomerCrmLogicDispatchHandler(
  action: string,
): CustomerCrmLogicDispatchHandler | undefined {
  return CUSTOMER_CRM_LOGIC_DISPATCH_MAP.get(action);
}

export async function dispatchCustomerCrmLogicIntent(
  deps: CustomerCrmLogicDeps,
  ctx: CustomerCrmDispatchContext,
): Promise<CommandResult | null> {
  const handler = CUSTOMER_CRM_LOGIC_DISPATCH_MAP.get(ctx.action);
  if (!handler) return null;
  return handler(deps, ctx);
}

export function customerCrmDispatchMapHas(action: string): boolean {
  return CUSTOMER_CRM_LOGIC_DISPATCH_MAP.has(action);
}
