import type { CommandResult } from './command-completion.types.js';
import {
  handleAuditDashboardDateSurfacesLogic,
  handleExplainBusinessDateFormatLogic,
  handleExplainDateInputFormatLogic,
  handleExplainNotificationDateFormatLogic,
  handleNotifyPatientResultReadyLogic,
  handlePreviewBusinessDateFormatLogic,
  handlePreviewDateInputParseLogic,
  handlePreviewNotificationDatetimeLogic,
  type BusinessDateFormatLogicDeps,
} from './ai-business-date-format.logic.js';
import { parseBusinessDateFormatFromPrompt } from './ai-business-date-format.util.js';
import { parseDateStringsFromPrompt } from './ai-date-input-format.util.js';

export type BusinessDateFormatDispatchContext = {
  businessId: string;
  action: string;
  params: Record<string, unknown>;
  prompt: string;
  confirmed?: boolean;
};

export type BusinessDateFormatLogicDispatchHandler = (
  deps: BusinessDateFormatLogicDeps,
  ctx: BusinessDateFormatDispatchContext,
) => Promise<CommandResult>;

export function buildBusinessDateFormatLogicDispatchMap(): ReadonlyMap<
  string,
  BusinessDateFormatLogicDispatchHandler
> {
  const map = new Map<string, BusinessDateFormatLogicDispatchHandler>();

  map.set('explain_business_date_format', async (deps, ctx) =>
    handleExplainBusinessDateFormatLogic(deps, ctx.businessId),
  );
  map.set('preview_business_date_format', async (deps, ctx) => {
    const parsed = parseBusinessDateFormatFromPrompt(ctx.prompt, ctx.params);
    const merged = parsed
      ? {
          ...ctx.params,
          ...(parsed.dateFormat ? { dateFormat: parsed.dateFormat } : {}),
          ...(parsed.timeFormat ? { timeFormat: parsed.timeFormat } : {}),
        }
      : ctx.params;
    return handlePreviewBusinessDateFormatLogic(
      deps,
      ctx.businessId,
      merged,
      ctx.prompt,
    );
  });
  map.set('audit_dashboard_date_surfaces', async (deps, ctx) =>
    handleAuditDashboardDateSurfacesLogic(deps, ctx.businessId),
  );
  map.set('explain_notification_date_format', async (deps, ctx) =>
    handleExplainNotificationDateFormatLogic(deps, ctx.businessId),
  );
  map.set('preview_notification_datetime', async (deps, ctx) => {
    const messageKind =
      typeof ctx.params.messageKind === 'string'
        ? ctx.params.messageKind
        : undefined;
    return handlePreviewNotificationDatetimeLogic(
      deps,
      ctx.businessId,
      messageKind ? { ...ctx.params, messageKind } : ctx.params,
      ctx.prompt,
    );
  });
  map.set('notify_patient_result_ready', async (deps, ctx) =>
    handleNotifyPatientResultReadyLogic(
      deps,
      ctx.businessId,
      { ...ctx.params, _prompt: ctx.prompt },
      ctx.prompt,
      ctx.confirmed ?? false,
    ),
  );
  map.set('explain_date_input_format', async (deps, ctx) =>
    handleExplainDateInputFormatLogic(deps, ctx.businessId),
  );
  map.set('preview_date_input_parse', async (deps, ctx) => {
    const dateStrings = parseDateStringsFromPrompt(ctx.prompt, ctx.params);
    return handlePreviewDateInputParseLogic(
      deps,
      ctx.businessId,
      { ...ctx.params, dateStrings, _prompt: ctx.prompt },
      ctx.prompt,
    );
  });

  return map;
}

/** Registry-driven dispatch table for AiBusinessDateFormatService (ai-cmd-ext-0.5). */
export const BUSINESS_DATE_FORMAT_LOGIC_DISPATCH_MAP =
  buildBusinessDateFormatLogicDispatchMap();
