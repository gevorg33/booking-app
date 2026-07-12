import type { CommandResult } from './command-completion.types.js';
import {
  REFERRAL_STAFF_TEMPLATES_LOGIC_DISPATCH_MAP,
  type ReferralStaffTemplatesDispatchContext,
  type ReferralStaffTemplatesLogicDispatchHandler,
} from './ai-referral-staff-templates-dispatch.build.js';
import type { ReferralStaffTemplatesLogicDeps } from './ai-referral-staff-templates.logic.js';

export function getReferralStaffTemplatesLogicDispatchHandler(
  action: string,
): ReferralStaffTemplatesLogicDispatchHandler | undefined {
  return REFERRAL_STAFF_TEMPLATES_LOGIC_DISPATCH_MAP.get(action);
}

export async function dispatchReferralStaffTemplatesLogicIntent(
  deps: ReferralStaffTemplatesLogicDeps,
  ctx: ReferralStaffTemplatesDispatchContext,
): Promise<CommandResult | null> {
  const handler = REFERRAL_STAFF_TEMPLATES_LOGIC_DISPATCH_MAP.get(ctx.action);
  if (!handler) return null;
  return handler(deps, ctx);
}

export function referralStaffTemplatesDispatchMapHas(action: string): boolean {
  return REFERRAL_STAFF_TEMPLATES_LOGIC_DISPATCH_MAP.has(action);
}
