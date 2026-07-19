import type { CommandResult } from './command-completion.types.js';
import type { AiMetaOpsService } from './ai-meta-ops.service.js';

export type MetaOpsDispatchContext = {
  businessId: string;
  action: string;
  params: Record<string, any>;
  membershipRole?: string;
};

export type MetaOpsDispatchHandler = (
  service: AiMetaOpsService,
  ctx: MetaOpsDispatchContext,
) => Promise<CommandResult>;

export function buildMetaOpsDispatchMap(): ReadonlyMap<
  string,
  MetaOpsDispatchHandler
> {
  const map = new Map<string, MetaOpsDispatchHandler>();

  map.set('summarize_ai_briefing', async (service, ctx) =>
    service.handleSummarizeAiBriefing(ctx.businessId),
  );
  map.set('summarize_ai_weekly_report', async (service, ctx) =>
    service.handleSummarizeAiWeeklyReport(ctx.businessId),
  );
  map.set('explain_ai_audit_log', async (service, ctx) =>
    service.handleExplainAiAuditLog(ctx.businessId, ctx.params),
  );
  map.set('explain_ai_usage_analytics', async (service, ctx) =>
    service.handleExplainAiUsageAnalytics(ctx.businessId, ctx.params),
  );
  map.set('explain_ai_capabilities', async (service, ctx) =>
    service.handleExplainAiCapabilities(ctx.businessId, ctx.membershipRole),
  );
  map.set('summarize_ai_settings', async (service, ctx) =>
    service.handleSummarizeAiSettings(ctx.businessId),
  );
  map.set('configure_ai_autopilot', async (service, ctx) =>
    service.handleConfigureAiAutopilot(ctx.businessId, ctx.params),
  );

  return map;
}

/** Registry-driven dispatch table for AiMetaOpsService (ai-cmd-ext-0.5). */
export const META_OPS_DISPATCH_MAP = buildMetaOpsDispatchMap();
