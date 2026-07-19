import type { CommandResult } from './command-completion.types.js';
import {
  handleAddRetailSaleToBookingLogic,
  handleAddRetailToMyBookingLogic,
  handleAdjustInventoryLogic,
  handleCommissionReportLogic,
  handleCreateCommissionRuleLogic,
  handleCreateProductLogic,
  handleDeleteCommissionRuleLogic,
  handleDeleteExpenseLogic,
  handleDeleteInventoryProductLogic,
  handleExportAnalyticsReportLogic,
  handleLinkProductToServiceLogic,
  handleListExpensesLogic,
  handleListProductsLogic,
  handlePayoutExportLogic,
  handleRecordExpenseLogic,
  handleRemoveRetailLineLogic,
  handleSetRecommendedProductsLogic,
  handleSetRetailSalesLinesLogic,
  handleSuggestRetailUpsellLogic,
  handleSummarizeAdoptionFunnelLogic,
  handleSummarizePlLogic,
  handleSummarizeReviewsLogic,
  handleUnlinkInventoryProductLogic,
  handleUpdateInventoryProductLogic,
  type RetailFinanceLogicDeps,
} from './ai-retail-finance.logic.js';

export type RetailFinanceDispatchContext = {
  businessId: string;
  action: string;
  params: Record<string, any>;
  prompt?: string;
  userId?: string;
  sessionEmployeeId?: string;
};

export type RetailFinanceLogicDispatchHandler = (
  deps: RetailFinanceLogicDeps,
  ctx: RetailFinanceDispatchContext,
) => Promise<CommandResult>;

export function buildRetailFinanceLogicDispatchMap(): ReadonlyMap<
  string,
  RetailFinanceLogicDispatchHandler
> {
  const map = new Map<string, RetailFinanceLogicDispatchHandler>();

  map.set('list_products', async (deps, ctx) =>
    handleListProductsLogic(deps, ctx.businessId, ctx.params),
  );
  map.set('create_product', async (deps, ctx) =>
    handleCreateProductLogic(deps, ctx.businessId, ctx.params, ctx.prompt),
  );
  map.set('link_product_to_service', async (deps, ctx) =>
    handleLinkProductToServiceLogic(
      deps,
      ctx.businessId,
      ctx.params,
      ctx.prompt,
    ),
  );
  map.set('update_inventory_product', async (deps, ctx) =>
    handleUpdateInventoryProductLogic(
      deps,
      ctx.businessId,
      ctx.params,
      ctx.prompt,
    ),
  );
  map.set('delete_inventory_product', async (deps, ctx) =>
    handleDeleteInventoryProductLogic(
      deps,
      ctx.businessId,
      ctx.params,
      ctx.prompt,
    ),
  );
  map.set('unlink_inventory_product', async (deps, ctx) =>
    handleUnlinkInventoryProductLogic(
      deps,
      ctx.businessId,
      ctx.params,
      ctx.prompt,
    ),
  );
  map.set('set_recommended_products', async (deps, ctx) =>
    handleSetRecommendedProductsLogic(
      deps,
      ctx.businessId,
      ctx.params,
      ctx.prompt,
    ),
  );
  map.set('adjust_inventory', async (deps, ctx) =>
    handleAdjustInventoryLogic(deps, ctx.businessId, ctx.params, ctx.prompt),
  );
  map.set('add_retail_sale_to_booking', async (deps, ctx) =>
    handleAddRetailSaleToBookingLogic(
      deps,
      ctx.businessId,
      ctx.params,
      ctx.userId,
      ctx.prompt,
    ),
  );
  map.set('remove_retail_line', async (deps, ctx) =>
    handleRemoveRetailLineLogic(
      deps,
      ctx.businessId,
      ctx.params,
      ctx.userId,
      ctx.prompt,
    ),
  );
  map.set('set_retail_sales_lines', async (deps, ctx) =>
    handleSetRetailSalesLinesLogic(
      deps,
      ctx.businessId,
      ctx.params,
      ctx.userId,
      ctx.prompt,
    ),
  );
  map.set('record_expense', async (deps, ctx) =>
    handleRecordExpenseLogic(deps, ctx.businessId, ctx.params, ctx.prompt),
  );
  map.set('list_expenses', async (deps, ctx) =>
    handleListExpensesLogic(deps, ctx.businessId, ctx.params),
  );
  map.set('delete_expense', async (deps, ctx) =>
    handleDeleteExpenseLogic(deps, ctx.businessId, ctx.params, ctx.prompt),
  );
  map.set('summarize_pl', async (deps, ctx) =>
    handleSummarizePlLogic(deps, ctx.businessId, ctx.params, ctx.prompt),
  );
  map.set('commission_report', async (deps, ctx) =>
    handleCommissionReportLogic(deps, ctx.businessId, ctx.params, ctx.prompt),
  );
  map.set('create_commission_rule', async (deps, ctx) =>
    handleCreateCommissionRuleLogic(
      deps,
      ctx.businessId,
      ctx.params,
      ctx.prompt,
    ),
  );
  map.set('delete_commission_rule', async (deps, ctx) =>
    handleDeleteCommissionRuleLogic(
      deps,
      ctx.businessId,
      ctx.params,
      ctx.prompt,
    ),
  );
  map.set('payout_export', async (deps, ctx) =>
    handlePayoutExportLogic(deps, ctx.businessId, ctx.params, ctx.prompt),
  );
  map.set('export_analytics_report', async (deps, ctx) =>
    handleExportAnalyticsReportLogic(
      deps,
      ctx.businessId,
      ctx.params,
      ctx.prompt,
    ),
  );
  map.set('summarize_reviews', async (deps, ctx) =>
    handleSummarizeReviewsLogic(deps, ctx.businessId, ctx.params),
  );
  map.set('summarize_adoption_funnel', async (deps, ctx) =>
    handleSummarizeAdoptionFunnelLogic(deps, ctx.businessId, ctx.params),
  );
  map.set('suggest_retail_upsell', async (deps, ctx) =>
    handleSuggestRetailUpsellLogic(
      deps,
      ctx.businessId,
      {
        ...ctx.params,
        sessionEmployeeId: ctx.sessionEmployeeId,
        _prompt: ctx.prompt,
      },
      ctx.prompt,
    ),
  );
  map.set('add_retail_to_my_booking', async (deps, ctx) =>
    handleAddRetailToMyBookingLogic(
      deps,
      ctx.businessId,
      {
        ...ctx.params,
        sessionEmployeeId: ctx.sessionEmployeeId,
        _prompt: ctx.prompt,
      },
      ctx.userId,
      ctx.prompt,
    ),
  );

  return map;
}

/** Registry-driven dispatch table for AiRetailFinanceService (ai-cmd-ext-0.5). */
export const RETAIL_FINANCE_LOGIC_DISPATCH_MAP =
  buildRetailFinanceLogicDispatchMap();
