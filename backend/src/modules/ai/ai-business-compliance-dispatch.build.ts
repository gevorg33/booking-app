import type { CommandResult } from './command-completion.types.js';
import {
  handleAcceptHipaaBaaLogic,
  handleAdminDeleteCustomerDataLogic,
  handleExplainComplianceStatusLogic,
  handleExplainEnterpriseTrustLogic,
  handleExplainGdprChecklistLogic,
  handleExplainStrategyEvalLogic,
  handleOpenComplianceDashboardLogic,
  handleExplainHipaaSessionTimeoutLogic,
  handleExplainMinimumNecessaryPhiAccessLogic,
  handleExplainPhiEncryptionStatusLogic,
  handleListBreachIncidentsLogic,
  handleListSubProcessorsLogic,
  handleReportDataBreachLogic,
  handleSendBreachNotificationLogic,
  handleUpdateStrategyEvalLogic,
  handleViewPhiAccessAuditLogic,
  type BusinessComplianceLogicDeps,
} from './ai-business-compliance.logic.js';
import {
  parseAdminDeleteCustomerDataFromPrompt,
  parseAcceptHipaaBaaFromPrompt,
  parseExplainComplianceStatusFromPrompt,
  parseExplainEnterpriseTrustFromPrompt,
  parseExplainGdprChecklistFromPrompt,
  parseExplainHipaaSessionTimeoutFromPrompt,
  parseExplainStrategyEvalFromPrompt,
  parseListSubProcessorsFromPrompt,
  parseOpenComplianceDashboardFromPrompt,
  parseExplainMinimumNecessaryPhiAccessFromPrompt,
  parseExplainPhiEncryptionStatusFromPrompt,
  parseListBreachIncidentsFromPrompt,
  parseReportDataBreachFromPrompt,
  parseSendBreachNotificationFromPrompt,
  parseViewPhiAccessAuditFromPrompt,
} from './ai-business-compliance.util.js';

export type BusinessComplianceDispatchContext = {
  businessId: string;
  action: string;
  params: Record<string, unknown>;
  prompt: string;
  userId?: string;
};

export type BusinessComplianceLogicDispatchHandler = (
  deps: BusinessComplianceLogicDeps,
  ctx: BusinessComplianceDispatchContext,
) => Promise<CommandResult>;

function withParsed(
  params: Record<string, unknown>,
  parsed: object | null | undefined,
  prompt: string,
): Record<string, unknown> {
  return parsed ? { ...params, ...parsed, _prompt: prompt } : params;
}

export function buildBusinessComplianceLogicDispatchMap(): ReadonlyMap<
  string,
  BusinessComplianceLogicDispatchHandler
> {
  const map = new Map<string, BusinessComplianceLogicDispatchHandler>();

  map.set('accept_hipaa_baa', async (deps, ctx) => {
    const parsed = parseAcceptHipaaBaaFromPrompt(ctx.prompt, ctx.params);
    return handleAcceptHipaaBaaLogic(
      deps,
      ctx.businessId,
      ctx.userId,
      withParsed(ctx.params, parsed, ctx.prompt),
      ctx.prompt,
    );
  });
  map.set('explain_compliance_status', async (deps, ctx) => {
    const parsed = parseExplainComplianceStatusFromPrompt(
      ctx.prompt,
      ctx.params,
    );
    return handleExplainComplianceStatusLogic(
      deps,
      ctx.businessId,
      withParsed(ctx.params, parsed, ctx.prompt),
      ctx.prompt,
    );
  });
  map.set('list_sub_processors', async (deps, ctx) => {
    const parsed = parseListSubProcessorsFromPrompt(ctx.prompt, ctx.params);
    return handleListSubProcessorsLogic(
      deps,
      ctx.businessId,
      ctx.userId,
      withParsed(ctx.params, parsed, ctx.prompt),
      ctx.prompt,
    );
  });
  map.set('explain_gdpr_checklist', async (deps, ctx) => {
    const parsed = parseExplainGdprChecklistFromPrompt(
      ctx.prompt,
      ctx.params,
    );
    return handleExplainGdprChecklistLogic(
      deps,
      ctx.businessId,
      ctx.userId,
      withParsed(ctx.params, parsed, ctx.prompt),
      ctx.prompt,
    );
  });
  map.set('explain_enterprise_trust', async (deps, ctx) => {
    const parsed = parseExplainEnterpriseTrustFromPrompt(
      ctx.prompt,
      ctx.params,
    );
    return handleExplainEnterpriseTrustLogic(
      deps,
      ctx.businessId,
      ctx.userId,
      withParsed(ctx.params, parsed, ctx.prompt),
      ctx.prompt,
    );
  });
  map.set('explain_strategy_eval', async (deps, ctx) => {
    const parsed = parseExplainStrategyEvalFromPrompt(ctx.prompt, ctx.params);
    return handleExplainStrategyEvalLogic(
      deps,
      ctx.businessId,
      ctx.userId,
      withParsed(ctx.params, parsed, ctx.prompt),
      ctx.prompt,
    );
  });
  map.set('update_strategy_eval', async (deps, ctx) =>
    handleUpdateStrategyEvalLogic(
      deps,
      ctx.businessId,
      ctx.userId,
      ctx.params,
      ctx.prompt,
    ),
  );
  map.set('open_compliance_dashboard', async (deps, ctx) => {
    const parsed = parseOpenComplianceDashboardFromPrompt(
      ctx.prompt,
      ctx.params,
    );
    return handleOpenComplianceDashboardLogic(
      deps,
      ctx.businessId,
      ctx.userId,
      withParsed(ctx.params, parsed, ctx.prompt),
      ctx.prompt,
    );
  });
  map.set('admin_delete_customer_data', async (deps, ctx) => {
    const parsed = parseAdminDeleteCustomerDataFromPrompt(
      ctx.prompt,
      ctx.params,
    );
    return handleAdminDeleteCustomerDataLogic(
      deps,
      ctx.businessId,
      withParsed(ctx.params, parsed, ctx.prompt),
      ctx.prompt,
    );
  });
  map.set('report_data_breach', async (deps, ctx) => {
    const parsed = parseReportDataBreachFromPrompt(ctx.prompt, ctx.params);
    return handleReportDataBreachLogic(
      deps,
      ctx.businessId,
      ctx.userId,
      withParsed(ctx.params, parsed, ctx.prompt),
      ctx.prompt,
    );
  });
  map.set('send_breach_notification', async (deps, ctx) => {
    const parsed = parseSendBreachNotificationFromPrompt(
      ctx.prompt,
      ctx.params,
    );
    return handleSendBreachNotificationLogic(
      deps,
      ctx.businessId,
      ctx.userId,
      withParsed(ctx.params, parsed, ctx.prompt),
      ctx.prompt,
    );
  });
  map.set('list_breach_incidents', async (deps, ctx) => {
    const parsed = parseListBreachIncidentsFromPrompt(ctx.prompt, ctx.params);
    return handleListBreachIncidentsLogic(
      deps,
      ctx.businessId,
      ctx.userId,
      withParsed(ctx.params, parsed, ctx.prompt),
      ctx.prompt,
    );
  });
  map.set('view_phi_access_audit', async (deps, ctx) => {
    const parsed = parseViewPhiAccessAuditFromPrompt(ctx.prompt, ctx.params);
    return handleViewPhiAccessAuditLogic(
      deps,
      ctx.businessId,
      ctx.userId,
      withParsed(ctx.params, parsed, ctx.prompt),
      ctx.prompt,
    );
  });
  map.set('explain_phi_encryption_status', async (deps, ctx) => {
    const parsed = parseExplainPhiEncryptionStatusFromPrompt(
      ctx.prompt,
      ctx.params,
    );
    return handleExplainPhiEncryptionStatusLogic(
      deps,
      ctx.businessId,
      withParsed(ctx.params, parsed, ctx.prompt),
      ctx.prompt,
    );
  });
  map.set('explain_minimum_necessary_phi_access', async (deps, ctx) => {
    const parsed = parseExplainMinimumNecessaryPhiAccessFromPrompt(
      ctx.prompt,
      ctx.params,
    );
    return handleExplainMinimumNecessaryPhiAccessLogic(
      deps,
      ctx.businessId,
      withParsed(ctx.params, parsed, ctx.prompt),
      ctx.prompt,
    );
  });
  map.set('explain_hipaa_session_timeout', async (deps, ctx) => {
    const parsed = parseExplainHipaaSessionTimeoutFromPrompt(
      ctx.prompt,
      ctx.params,
    );
    return handleExplainHipaaSessionTimeoutLogic(
      deps,
      ctx.businessId,
      withParsed(ctx.params, parsed, ctx.prompt),
      ctx.prompt,
    );
  });

  return map;
}

/** Registry-driven dispatch table for AiBusinessComplianceService (ai-cmd-ext-0.5). */
export const BUSINESS_COMPLIANCE_LOGIC_DISPATCH_MAP =
  buildBusinessComplianceLogicDispatchMap();
