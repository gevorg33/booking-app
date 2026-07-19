import type { CommandResult } from './command-completion.types.js';
import {
  handleConfirmBillingCheckoutLogic,
  handleExplainPlanEntitlementsLogic,
  handleExplainPlanLimitsLogic,
  handleHowToDownloadAppLogic,
  handleListInactiveCustomersLogic,
  handleLoyaltyPointsBalanceLogic,
  handleOpenBillingSettingsLogic,
  handlePromoCodeHelpLogic,
  handleStartBillingCheckoutLogic,
  handleSuggestUpgradeLogic,
  handleSummarizeAutomationPerformanceLogic,
  handleSummarizeLoyaltyProgramLogic,
  handleSummarizeNewRegistrationsLogic,
  handleSwitchToConsumerAppLogic,
  handleToggleAnnualBillingLogic,
  handleTriggerReengagementLogic,
  type MarketingGrowthLogicDeps,
} from './ai-marketing-growth.logic.js';
import {
  handleExplainTenantAppInstallLogic,
  handleRegenerateTenantAppInstallQrLogic,
} from './ai-tenant-app-install.logic.js';
import {
  handleCreatePromoCodeLogic,
  handleDeactivatePromoCodeLogic,
} from './ai-create-promo-code.logic.js';
import { handleListPromoCodesLogic } from './ai-list-promo-codes.logic.js';
import { handleExplainLoyaltyPointsLogic } from './ai-explain-loyalty-points.logic.js';

export type MarketingGrowthDispatchContext = {
  businessId: string;
  action: string;
  params: Record<string, any>;
  prompt?: string;
  userEmail?: string;
  sessionCustomerId?: string;
};

export type MarketingGrowthLogicDispatchHandler = (
  deps: MarketingGrowthLogicDeps,
  ctx: MarketingGrowthDispatchContext,
) => Promise<CommandResult>;

export function buildMarketingGrowthLogicDispatchMap(): ReadonlyMap<
  string,
  MarketingGrowthLogicDispatchHandler
> {
  const map = new Map<string, MarketingGrowthLogicDispatchHandler>();

  map.set('summarize_automation_performance', async (deps, ctx) =>
    handleSummarizeAutomationPerformanceLogic(deps, ctx.businessId),
  );
  map.set('trigger_reengagement', async (deps, ctx) =>
    handleTriggerReengagementLogic(deps, ctx.businessId),
  );
  map.set('list_inactive_customers', async (deps, ctx) =>
    handleListInactiveCustomersLogic(deps, ctx.businessId),
  );
  map.set('explain_plan_limits', async (deps, ctx) =>
    handleExplainPlanLimitsLogic(deps, ctx.businessId),
  );
  map.set('suggest_upgrade', async (deps, ctx) =>
    handleSuggestUpgradeLogic(deps, ctx.businessId),
  );
  map.set('toggle_annual_billing', async (deps, ctx) =>
    handleToggleAnnualBillingLogic(
      deps,
      ctx.businessId,
      ctx.params,
      ctx.userEmail,
    ),
  );
  map.set('summarize_new_registrations', async (deps, ctx) =>
    handleSummarizeNewRegistrationsLogic(
      deps,
      ctx.businessId,
      ctx.params,
      ctx.prompt,
    ),
  );
  map.set('open_billing_settings', async (deps, ctx) =>
    handleOpenBillingSettingsLogic(deps, ctx.businessId),
  );
  map.set('start_billing_checkout', async (deps, ctx) =>
    handleStartBillingCheckoutLogic(deps, ctx.businessId, ctx.params),
  );
  map.set('confirm_billing_checkout', async (deps, ctx) =>
    handleConfirmBillingCheckoutLogic(deps, ctx.businessId, ctx.params),
  );
  map.set('explain_plan_entitlements', async (deps, ctx) =>
    handleExplainPlanEntitlementsLogic(deps, ctx.businessId),
  );
  map.set('summarize_loyalty_program', async (deps, ctx) =>
    handleSummarizeLoyaltyProgramLogic(deps, ctx.businessId),
  );
  map.set('explain_tenant_app_install', async (deps, ctx) =>
    handleExplainTenantAppInstallLogic(deps, ctx.businessId),
  );
  map.set('regenerate_tenant_app_install_qr', async (deps, ctx) =>
    handleRegenerateTenantAppInstallQrLogic(deps, ctx.businessId),
  );
  map.set('list_promo_codes', async (deps, ctx) =>
    handleListPromoCodesLogic(deps, ctx.businessId, {
      ...ctx.params,
      _prompt: ctx.prompt,
    }),
  );
  map.set('create_promo_code', async (deps, ctx) =>
    handleCreatePromoCodeLogic(deps, ctx.businessId, ctx.params, ctx.prompt),
  );
  map.set('deactivate_promo_code', async (deps, ctx) =>
    handleDeactivatePromoCodeLogic(deps, ctx.businessId, ctx.params),
  );
  map.set('how_to_download_app', async (deps, ctx) =>
    handleHowToDownloadAppLogic(deps, ctx.businessId),
  );
  map.set('switch_to_consumer_app', async (deps, ctx) =>
    handleSwitchToConsumerAppLogic(deps, ctx.businessId),
  );
  map.set('promo_code_help', async (deps, ctx) =>
    handlePromoCodeHelpLogic(deps, ctx.businessId, ctx.params, ctx.prompt),
  );
  map.set('loyalty_points_balance', async (deps, ctx) =>
    handleLoyaltyPointsBalanceLogic(deps, ctx.businessId, {
      ...ctx.params,
      sessionCustomerId: ctx.sessionCustomerId,
    }),
  );
  map.set('explain_loyalty_points', async (deps, ctx) =>
    handleExplainLoyaltyPointsLogic(
      deps,
      ctx.businessId,
      { ...ctx.params, sessionCustomerId: ctx.sessionCustomerId },
      ctx.prompt,
    ),
  );

  return map;
}

/** Registry-driven dispatch table for AiMarketingGrowthService (ai-cmd-ext-0.5). */
export const MARKETING_GROWTH_LOGIC_DISPATCH_MAP =
  buildMarketingGrowthLogicDispatchMap();
