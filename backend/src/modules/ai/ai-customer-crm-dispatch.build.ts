import type { CommandResult } from './command-completion.types.js';
import type { Customer } from '../customer/entities/customer.entity.js';
import {
  handleCancelSubscriptionAdminLogic,
  handleCustomerNoShowHistoryLogic,
  handleDeleteCustomerDataLogic,
  handleDiscoverGiftCardProductsLogic,
  handleDiscoverPackagesLogic,
  handleDiscoverSubscriptionPlansLogic,
  handleExportCustomerDataLogic,
  handleExtendSubscriptionLogic,
  handleGiftCardBalanceLogic,
  handleGiftCardRedemptionHistoryLogic,
  handleListCustomerBookingsLogic,
  handleListCustomerGiftCardsLogic,
  handleListCustomerSubscriptionsLogic,
  handleMergeCustomersLogic,
  handleMyAppointmentsLogic,
  handleMyGiftCardsLogic,
  handleMyProfileLogic,
  handleMySubscriptionsLogic,
  handlePrivacyDeleteLogic,
  handlePrivacyExportLogic,
  handleRequestGiftCardCancelLogic,
  handleRequestGiftCardModifyLogic,
  handleSendReengagementMessageLogic,
  handleSubscriptionUsageHistoryLogic,
  handleSubscriptionUsageLogic,
  handleTagCustomerLogic,
  handleUpdateCustomerLogic,
  handleTrackPhysicalGiftCardOrderLogic,
  type CustomerCrmLogicDeps,
} from './ai-customer-crm.logic.js';
import { handleExplainMySubscriptionLogic } from './ai-explain-my-subscription.logic.js';

export type CustomerCrmDispatchContext = {
  businessId: string;
  action: string;
  params: Record<string, any>;
  prompt?: string;
  customers: Customer[];
  resolveCustomer: (list: Customer[], name: string) => Customer | undefined;
  sessionCustomerId?: unknown;
};

export type CustomerCrmLogicDispatchHandler = (
  deps: CustomerCrmLogicDeps,
  ctx: CustomerCrmDispatchContext,
) => Promise<CommandResult>;

export function buildCustomerCrmLogicDispatchMap(): ReadonlyMap<
  string,
  CustomerCrmLogicDispatchHandler
> {
  const map = new Map<string, CustomerCrmLogicDispatchHandler>();

  map.set('list_customer_subscriptions', async (deps, ctx) =>
    handleListCustomerSubscriptionsLogic(
      deps,
      ctx.businessId,
      ctx.params,
      ctx.customers,
      ctx.resolveCustomer,
    ),
  );
  map.set('subscription_usage_history', async (deps, ctx) =>
    handleSubscriptionUsageHistoryLogic(
      deps,
      ctx.businessId,
      ctx.params,
      ctx.customers,
      ctx.resolveCustomer,
    ),
  );
  map.set('extend_subscription', async (deps, ctx) =>
    handleExtendSubscriptionLogic(
      deps,
      ctx.businessId,
      ctx.params,
      ctx.customers,
      ctx.resolveCustomer,
    ),
  );
  map.set('cancel_subscription_admin', async (deps, ctx) =>
    handleCancelSubscriptionAdminLogic(
      deps,
      ctx.businessId,
      ctx.params,
      ctx.customers,
      ctx.resolveCustomer,
    ),
  );
  map.set('list_customer_gift_cards', async (deps, ctx) =>
    handleListCustomerGiftCardsLogic(
      deps,
      ctx.businessId,
      ctx.params,
      ctx.customers,
      ctx.resolveCustomer,
    ),
  );
  map.set('list_customer_bookings', async (deps, ctx) =>
    handleListCustomerBookingsLogic(
      deps,
      ctx.businessId,
      ctx.params,
      ctx.customers,
      ctx.resolveCustomer,
    ),
  );
  map.set('customer_no_show_history', async (deps, ctx) =>
    handleCustomerNoShowHistoryLogic(
      deps,
      ctx.businessId,
      ctx.params,
      ctx.customers,
      ctx.resolveCustomer,
    ),
  );
  map.set('tag_customer', async (deps, ctx) =>
    handleTagCustomerLogic(
      deps,
      ctx.businessId,
      ctx.params,
      ctx.customers,
      ctx.resolveCustomer,
    ),
  );
  map.set('update_customer', async (deps, ctx) =>
    handleUpdateCustomerLogic(
      deps,
      ctx.businessId,
      ctx.params,
      ctx.customers,
      ctx.resolveCustomer,
    ),
  );
  map.set('export_customer_data', async (deps, ctx) =>
    handleExportCustomerDataLogic(
      deps,
      ctx.businessId,
      ctx.params,
      ctx.customers,
      ctx.resolveCustomer,
    ),
  );
  map.set('delete_customer_data', async (deps, ctx) =>
    handleDeleteCustomerDataLogic(
      deps,
      ctx.businessId,
      ctx.params,
      ctx.customers,
      ctx.resolveCustomer,
    ),
  );
  map.set('send_reengagement_message', async (deps, ctx) =>
    handleSendReengagementMessageLogic(
      deps,
      ctx.businessId,
      ctx.params,
      ctx.customers,
      ctx.resolveCustomer,
    ),
  );
  map.set('merge_customers', async (deps, ctx) =>
    handleMergeCustomersLogic(
      deps,
      ctx.businessId,
      ctx.params,
      ctx.customers,
      ctx.resolveCustomer,
    ),
  );
  map.set('my_profile', async (deps, ctx) =>
    handleMyProfileLogic(deps, ctx.businessId, {
      ...ctx.params,
      sessionCustomerId: ctx.sessionCustomerId,
    }),
  );
  map.set('my_appointments', async (deps, ctx) =>
    handleMyAppointmentsLogic(deps, ctx.businessId, {
      ...ctx.params,
      sessionCustomerId: ctx.sessionCustomerId,
    }),
  );
  map.set('my_subscriptions', async (deps, ctx) =>
    handleMySubscriptionsLogic(deps, ctx.businessId, {
      ...ctx.params,
      sessionCustomerId: ctx.sessionCustomerId,
    }),
  );
  map.set('explain_my_subscription', async (deps, ctx) =>
    handleExplainMySubscriptionLogic(
      deps,
      ctx.businessId,
      { ...ctx.params, sessionCustomerId: ctx.sessionCustomerId },
      ctx.prompt,
    ),
  );
  map.set('subscription_usage', async (deps, ctx) =>
    handleSubscriptionUsageLogic(deps, ctx.businessId, {
      ...ctx.params,
      sessionCustomerId: ctx.sessionCustomerId,
    }),
  );
  map.set('my_gift_cards', async (deps, ctx) =>
    handleMyGiftCardsLogic(deps, ctx.businessId, {
      ...ctx.params,
      sessionCustomerId: ctx.sessionCustomerId,
    }),
  );
  map.set('gift_card_balance', async (deps, ctx) =>
    handleGiftCardBalanceLogic(deps, ctx.businessId, {
      ...ctx.params,
      sessionCustomerId: ctx.sessionCustomerId,
    }),
  );
  map.set('gift_card_redemption_history', async (deps, ctx) =>
    handleGiftCardRedemptionHistoryLogic(deps, ctx.businessId, {
      ...ctx.params,
      sessionCustomerId: ctx.sessionCustomerId,
    }),
  );
  map.set('request_gift_card_cancel', async (deps, ctx) =>
    handleRequestGiftCardCancelLogic(deps, ctx.businessId, {
      ...ctx.params,
      sessionCustomerId: ctx.sessionCustomerId,
    }),
  );
  map.set('request_gift_card_modify', async (deps, ctx) =>
    handleRequestGiftCardModifyLogic(deps, ctx.businessId, {
      ...ctx.params,
      sessionCustomerId: ctx.sessionCustomerId,
    }),
  );
  map.set('track_physical_gift_card_order', async (deps, ctx) =>
    handleTrackPhysicalGiftCardOrderLogic(deps, ctx.businessId, {
      ...ctx.params,
      sessionCustomerId: ctx.sessionCustomerId,
    }),
  );
  map.set('privacy_export', async (deps, ctx) =>
    handlePrivacyExportLogic(
      deps,
      ctx.businessId,
      { ...ctx.params, sessionCustomerId: ctx.sessionCustomerId },
      '',
    ),
  );
  map.set('privacy_delete', async (deps, ctx) =>
    handlePrivacyDeleteLogic(
      deps,
      ctx.businessId,
      { ...ctx.params, sessionCustomerId: ctx.sessionCustomerId },
      '',
    ),
  );
  map.set('discover_packages', async (deps, ctx) =>
    handleDiscoverPackagesLogic(deps, ctx.businessId),
  );
  map.set('discover_subscription_plans', async (deps, ctx) =>
    handleDiscoverSubscriptionPlansLogic(deps, ctx.businessId, ctx.params),
  );
  map.set('discover_gift_card_products', async (deps, ctx) =>
    handleDiscoverGiftCardProductsLogic(deps, ctx.businessId),
  );

  return map;
}

/** Registry-driven dispatch table for AiCustomerCrmService (ai-cmd-ext-0.5). */
export const CUSTOMER_CRM_LOGIC_DISPATCH_MAP =
  buildCustomerCrmLogicDispatchMap();
