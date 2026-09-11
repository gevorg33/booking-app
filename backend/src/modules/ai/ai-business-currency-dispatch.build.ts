import type { CommandResult } from './command-completion.types.js';
import {
  handleBulkUpdateServiceCurrencyLogic,
  handleDiagnoseStripeCheckoutFailureLogic,
  handleExplainBusinessCurrencyLogic,
  handleExplainReportsCurrencyLogic,
  handleExplainStripeCurrencyWarningLogic,
  handleSummarizeRevenueKpisLogic,
  type BusinessCurrencyLogicDeps,
} from './ai-business-currency.logic.js';

export type BusinessCurrencyDispatchContext = {
  businessId: string;
  action: string;
  params: Record<string, unknown>;
  prompt: string;
  confirmed?: boolean;
};

export type BusinessCurrencyLogicDispatchHandler = (
  deps: BusinessCurrencyLogicDeps,
  ctx: BusinessCurrencyDispatchContext,
) => Promise<CommandResult>;

export function buildBusinessCurrencyLogicDispatchMap(): ReadonlyMap<
  string,
  BusinessCurrencyLogicDispatchHandler
> {
  const map = new Map<string, BusinessCurrencyLogicDispatchHandler>();

  map.set('explain_business_currency', async (deps, ctx) =>
    handleExplainBusinessCurrencyLogic(deps, ctx.businessId),
  );
  map.set('explain_stripe_currency_warning', async (deps, ctx) =>
    handleExplainStripeCurrencyWarningLogic(deps, ctx.businessId),
  );
  map.set('diagnose_stripe_checkout_failure', async (deps, ctx) =>
    handleDiagnoseStripeCheckoutFailureLogic(deps, ctx.businessId),
  );
  map.set('explain_reports_currency', async (deps, ctx) =>
    handleExplainReportsCurrencyLogic(deps, ctx.businessId),
  );
  map.set('summarize_revenue_kpis', async (deps, ctx) =>
    handleSummarizeRevenueKpisLogic(
      deps,
      ctx.businessId,
      ctx.params,
      ctx.prompt,
    ),
  );
  map.set('bulk_update_service_currency', async (deps, ctx) =>
    handleBulkUpdateServiceCurrencyLogic(
      deps,
      ctx.businessId,
      { ...ctx.params, _prompt: ctx.prompt },
      ctx.prompt,
      ctx.confirmed ?? false,
    ),
  );

  return map;
}

/** Registry-driven dispatch table for AiBusinessCurrencyService (ai-cmd-ext-0.5). */
export const BUSINESS_CURRENCY_LOGIC_DISPATCH_MAP =
  buildBusinessCurrencyLogicDispatchMap();
