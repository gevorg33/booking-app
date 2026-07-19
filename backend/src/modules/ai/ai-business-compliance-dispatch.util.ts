import type { CommandResult } from './command-completion.types.js';
import {
  BUSINESS_COMPLIANCE_LOGIC_DISPATCH_MAP,
  type BusinessComplianceDispatchContext,
  type BusinessComplianceLogicDispatchHandler,
} from './ai-business-compliance-dispatch.build.js';
import type { BusinessComplianceLogicDeps } from './ai-business-compliance.logic.js';

export function getBusinessComplianceLogicDispatchHandler(
  action: string,
): BusinessComplianceLogicDispatchHandler | undefined {
  return BUSINESS_COMPLIANCE_LOGIC_DISPATCH_MAP.get(action);
}

export async function dispatchBusinessComplianceLogicIntent(
  deps: BusinessComplianceLogicDeps,
  ctx: BusinessComplianceDispatchContext,
): Promise<CommandResult | null> {
  const handler = BUSINESS_COMPLIANCE_LOGIC_DISPATCH_MAP.get(ctx.action);
  if (!handler) return null;
  return handler(deps, ctx);
}

export function businessComplianceDispatchMapHas(action: string): boolean {
  return BUSINESS_COMPLIANCE_LOGIC_DISPATCH_MAP.has(action);
}
