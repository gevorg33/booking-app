import type { CommandResult } from './command-completion.types.js';
import type { AiProviderTimeOffService } from './ai-provider-time-off.service.js';

export type ProviderTimeOffDispatchContext = {
  businessId: string;
  action: string;
  params: Record<string, unknown>;
  userId: string;
};

export type ProviderTimeOffDispatchHandler = (
  service: AiProviderTimeOffService,
  ctx: ProviderTimeOffDispatchContext,
) => Promise<CommandResult>;

export function buildProviderTimeOffDispatchMap(): ReadonlyMap<
  string,
  ProviderTimeOffDispatchHandler
> {
  const map = new Map<string, ProviderTimeOffDispatchHandler>();

  const dashboardTimeOffHandler: ProviderTimeOffDispatchHandler = async (
    service,
    ctx,
  ) =>
    (await service.handleIntent(
      ctx.businessId,
      ctx.userId,
      ctx.action,
      ctx.params,
      'dashboard',
    )) ?? {
      success: false,
      action: ctx.action,
      summary: 'Could not process time-off request.',
      details: { clarify: true },
    };

  // DASHBOARD_TIME_OFF_INTENTS (ai-provider-time-off.util.ts) — all three
  // route through the same handleIntent('dashboard') internal switch.
  map.set('list_time_off_requests', dashboardTimeOffHandler);
  map.set('approve_time_off_request', dashboardTimeOffHandler);
  map.set('deny_time_off_request', dashboardTimeOffHandler);

  return map;
}

/** Registry-driven dispatch table for AiProviderTimeOffService (ai-cmd-ext-0.5, dashboard surface only). */
export const PROVIDER_TIME_OFF_DISPATCH_MAP = buildProviderTimeOffDispatchMap();
