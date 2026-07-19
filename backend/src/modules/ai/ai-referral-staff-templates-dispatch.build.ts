import type { CommandResult } from './command-completion.types.js';
import {
  handleConfigureReferralProgramLogic,
  handleConfigureStaffMessageTemplatesLogic,
  type ReferralStaffTemplatesLogicDeps,
} from './ai-referral-staff-templates.logic.js';

export type ReferralStaffTemplatesDispatchContext = {
  businessId: string;
  action: string;
  params: Record<string, any>;
};

export type ReferralStaffTemplatesLogicDispatchHandler = (
  deps: ReferralStaffTemplatesLogicDeps,
  ctx: ReferralStaffTemplatesDispatchContext,
) => Promise<CommandResult>;

export function buildReferralStaffTemplatesLogicDispatchMap(): ReadonlyMap<
  string,
  ReferralStaffTemplatesLogicDispatchHandler
> {
  const map = new Map<string, ReferralStaffTemplatesLogicDispatchHandler>();

  map.set('configure_referral_program', async (deps, ctx) =>
    handleConfigureReferralProgramLogic(deps, ctx.businessId, ctx.params),
  );
  map.set('configure_staff_message_templates', async (deps, ctx) =>
    handleConfigureStaffMessageTemplatesLogic(deps, ctx.businessId, ctx.params),
  );

  return map;
}

/** Registry-driven dispatch table for AiReferralStaffTemplatesService (ai-cmd-ext-0.5). */
export const REFERRAL_STAFF_TEMPLATES_LOGIC_DISPATCH_MAP =
  buildReferralStaffTemplatesLogicDispatchMap();
