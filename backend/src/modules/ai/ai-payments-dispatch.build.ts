import type { Service } from '../service/entities/service.entity.js';
import type { CommandResult } from './command-completion.types.js';
import { parseExplainServiceOnlinePaymentSetupFromPrompt } from './ai-service-online-payment-setup.util.js';
import {
  handleAdjustGiftCardBalanceLogic,
  handleApplyGiftCardCodeLogic,
  handleBookNearestSlotLogic,
  handleBuyGiftCardLogic,
  handleCheckGiftCardBalanceLogic,
  handleCheckProvidersForServiceLogic,
  handleChoosePaymentMethodLogic,
  handleCollectCashConfirmLogic,
  handleConfigureCashPaymentsLogic,
  handleConfigureServiceOnlinePaymentLogic,
  handleConfirmStripePaymentLogic,
  handleExplainCheckoutTotalLogic,
  handleExplainPaymentStatusLogic,
  handleExplainWhyStripeRequiredLogic,
  handleExportAccountingLogic,
  handleExportCommissionsLogic,
  handleExtendGiftCardExpiryLogic,
  handleGetBookingQuoteLogic,
  handleGetGiftCardQuoteLogic,
  handleGetMultiServiceQuoteLogic,
  handleGetPackageQuoteLogic,
  handleListSubscriptionRevenueLogic,
  handlePayCashAtVisitLogic,
  handlePayOnlineLogic,
  handlePurchaseSubscriptionCheckoutLogic,
  handleReceiptStatusLogic,
  handleRefundGiftCardOrderLogic,
  handleSummarizeUnpaidLogic,
  handleValidateGiftCardLogic,
  type PaymentsLogicDeps,
} from './ai-payments.logic.js';
import { handleBuyGiftCardForSomeoneLogic } from './ai-buy-gift-card-for-someone.logic.js';
import { handleExplainServiceOnlinePaymentSetupLogic } from './ai-service-online-payment-setup.logic.js';
import { handleConfigureServiceDepositPolicyLogic } from './ai-service-deposit-policy.logic.js';
import { handleExplainPublicBookingCheckoutLogic } from './ai-explain-public-booking-checkout.logic.js';
import { handleAuditServicesMissingOnlinePaymentLogic } from './ai-audit-services-missing-online-payment.logic.js';
import { handleConfigureCheckoutDefaultsLogic } from './ai-checkout-defaults.logic.js';
import { handleExplainServicePriceLogic } from './ai-explain-service-price.logic.js';
import { handleExplainPaymentOptionsForServiceLogic } from './ai-explain-payment-options-for-service.logic.js';
import { handleFindSoonestAppointmentLogic } from './ai-find-soonest-appointment.logic.js';
import { handleCompareServicesLogic } from './ai-compare-services.logic.js';
import { handleFilterServicesNoPrepaymentLogic } from './ai-filter-services-no-prepayment.logic.js';
import { handleExplainAmountDueNowLogic } from './ai-explain-amount-due-now.logic.js';

export type PaymentsDispatchContext = {
  businessId: string;
  action: string;
  params: Record<string, unknown>;
  prompt?: string;
  userId?: string;
  catalogServices?: Service[];
};

export type PaymentsLogicDispatchHandler = (
  deps: PaymentsLogicDeps,
  ctx: PaymentsDispatchContext,
) => Promise<CommandResult>;

function withPromptParams(
  params: Record<string, unknown>,
  prompt?: string,
): Record<string, unknown> {
  return prompt != null ? { ...params, _prompt: prompt } : params;
}

export function buildPaymentsLogicDispatchMap(): ReadonlyMap<
  string,
  PaymentsLogicDispatchHandler
> {
  const map = new Map<string, PaymentsLogicDispatchHandler>();

  map.set('summarize_unpaid', (deps, ctx) =>
    handleSummarizeUnpaidLogic(deps, ctx.businessId, ctx.params),
  );
  map.set('validate_gift_card', (deps, ctx) =>
    handleValidateGiftCardLogic(
      deps,
      ctx.businessId,
      withPromptParams(ctx.params, ctx.prompt),
    ),
  );
  map.set('export_accounting', (deps, ctx) =>
    handleExportAccountingLogic(deps, ctx.businessId, ctx.params),
  );
  map.set('export_commissions', (deps, ctx) =>
    handleExportCommissionsLogic(deps, ctx.businessId, ctx.params),
  );
  map.set('explain_checkout_total', (deps, ctx) =>
    handleExplainCheckoutTotalLogic(
      deps,
      ctx.businessId,
      withPromptParams(ctx.params, ctx.prompt),
    ),
  );
  map.set('explain_amount_due_now', (deps, ctx) =>
    handleExplainAmountDueNowLogic(
      deps,
      ctx.businessId,
      withPromptParams(ctx.params, ctx.prompt),
      ctx.prompt ?? '',
    ),
  );
  map.set('explain_service_price', (deps, ctx) =>
    handleExplainServicePriceLogic(
      deps,
      ctx.businessId,
      withPromptParams(ctx.params, ctx.prompt),
      ctx.prompt ?? '',
    ),
  );
  map.set('explain_payment_options_for_service', (deps, ctx) =>
    handleExplainPaymentOptionsForServiceLogic(
      deps,
      ctx.businessId,
      withPromptParams(ctx.params, ctx.prompt),
      ctx.prompt ?? '',
    ),
  );
  map.set('find_soonest_appointment', (deps, ctx) =>
    handleFindSoonestAppointmentLogic(
      deps,
      ctx.businessId,
      withPromptParams(ctx.params, ctx.prompt),
      ctx.prompt ?? '',
    ),
  );
  map.set('compare_services', (deps, ctx) =>
    handleCompareServicesLogic(
      deps,
      ctx.businessId,
      withPromptParams(ctx.params, ctx.prompt),
      ctx.prompt ?? '',
    ),
  );
  map.set('filter_services_no_prepayment', (deps, ctx) =>
    handleFilterServicesNoPrepaymentLogic(
      deps,
      ctx.businessId,
      withPromptParams(ctx.params, ctx.prompt),
      ctx.prompt ?? '',
    ),
  );
  map.set('list_subscription_revenue', (deps, ctx) =>
    handleListSubscriptionRevenueLogic(deps, ctx.businessId, ctx.params),
  );
  map.set('configure_cash_payments', (deps, ctx) =>
    handleConfigureCashPaymentsLogic(
      deps,
      ctx.businessId,
      ctx.params,
      ctx.prompt,
    ),
  );
  map.set('configure_checkout_defaults', (deps, ctx) =>
    handleConfigureCheckoutDefaultsLogic(
      deps,
      ctx.businessId,
      ctx.params,
      ctx.prompt,
    ),
  );
  map.set('configure_service_deposit_policy', (deps, ctx) =>
    handleConfigureServiceDepositPolicyLogic(
      deps,
      ctx.businessId,
      ctx.params,
      ctx.prompt,
      ctx.catalogServices ?? [],
      ctx.userId,
    ),
  );
  map.set('explain_service_online_payment_setup', (deps, ctx) => {
    const parsed = parseExplainServiceOnlinePaymentSetupFromPrompt(
      ctx.prompt ?? '',
      ctx.params,
    );
    const enriched = parsed
      ? {
          ...ctx.params,
          ...(parsed.serviceName ? { serviceName: parsed.serviceName } : {}),
          ...(parsed.categoryName ? { categoryName: parsed.categoryName } : {}),
        }
      : ctx.params;
    return handleExplainServiceOnlinePaymentSetupLogic(
      deps,
      ctx.businessId,
      enriched,
      ctx.prompt,
    );
  });
  map.set('explain_public_booking_checkout', (deps, ctx) =>
    handleExplainPublicBookingCheckoutLogic(
      deps,
      ctx.businessId,
      ctx.params,
      ctx.prompt,
    ),
  );
  map.set('audit_services_missing_online_payment', (deps, ctx) =>
    handleAuditServicesMissingOnlinePaymentLogic(
      deps,
      ctx.businessId,
      ctx.params,
      ctx.prompt,
    ),
  );
  map.set('configure_service_online_payment', (deps, ctx) =>
    handleConfigureServiceOnlinePaymentLogic(
      deps,
      ctx.businessId,
      ctx.params,
      ctx.prompt,
      ctx.catalogServices ?? [],
      ctx.userId,
    ),
  );
  map.set('adjust_gift_card_balance', (deps, ctx) =>
    handleAdjustGiftCardBalanceLogic(
      deps,
      ctx.businessId,
      withPromptParams(ctx.params, ctx.prompt),
      ctx.userId,
    ),
  );
  map.set('extend_gift_card_expiry', (deps, ctx) =>
    handleExtendGiftCardExpiryLogic(
      deps,
      ctx.businessId,
      withPromptParams(ctx.params, ctx.prompt),
      ctx.userId,
    ),
  );
  map.set('refund_gift_card_order', (deps, ctx) =>
    handleRefundGiftCardOrderLogic(
      deps,
      ctx.businessId,
      withPromptParams(ctx.params, ctx.prompt),
    ),
  );
  map.set('explain_payment_status', (deps, ctx) =>
    handleExplainPaymentStatusLogic(deps, ctx.businessId, ctx.params),
  );
  map.set('collect_cash_confirm', (deps, ctx) =>
    handleCollectCashConfirmLogic(deps, ctx.businessId, ctx.params, ctx.userId),
  );
  map.set('check_providers_for_service', (deps, ctx) =>
    handleCheckProvidersForServiceLogic(
      deps,
      ctx.businessId,
      ctx.params,
      ctx.prompt,
    ),
  );
  map.set('book_nearest_slot', (deps, ctx) =>
    handleBookNearestSlotLogic(deps, ctx.businessId, ctx.params, ctx.prompt),
  );
  map.set('apply_gift_card_code', (deps, ctx) =>
    handleApplyGiftCardCodeLogic(deps, ctx.businessId, ctx.params, ctx.prompt),
  );
  map.set('check_gift_card_balance', (deps, ctx) =>
    handleCheckGiftCardBalanceLogic(
      deps,
      ctx.businessId,
      ctx.params,
      ctx.prompt,
    ),
  );
  map.set('buy_gift_card', (deps, ctx) =>
    handleBuyGiftCardLogic(deps, ctx.businessId, ctx.params, false),
  );
  map.set('buy_gift_card_for_someone', (deps, ctx) =>
    handleBuyGiftCardForSomeoneLogic(
      deps,
      ctx.businessId,
      withPromptParams(ctx.params, ctx.prompt),
      ctx.prompt,
    ),
  );
  map.set('buy_gift_card_physical', (deps, ctx) =>
    handleBuyGiftCardLogic(deps, ctx.businessId, ctx.params, true),
  );
  map.set('get_gift_card_quote', (deps, ctx) =>
    handleGetGiftCardQuoteLogic(
      deps,
      ctx.businessId,
      withPromptParams(ctx.params, ctx.prompt),
      ctx.prompt,
    ),
  );
  map.set('choose_payment_method', (deps, ctx) =>
    handleChoosePaymentMethodLogic(
      deps,
      ctx.businessId,
      withPromptParams(ctx.params, ctx.prompt),
      ctx.prompt,
    ),
  );
  map.set('pay_online', (deps, ctx) =>
    handlePayOnlineLogic(
      deps,
      ctx.businessId,
      withPromptParams(ctx.params, ctx.prompt),
      ctx.prompt,
    ),
  );
  map.set('pay_cash_at_visit', (deps, ctx) =>
    handlePayCashAtVisitLogic(
      deps,
      ctx.businessId,
      withPromptParams(ctx.params, ctx.prompt),
      ctx.prompt,
    ),
  );
  map.set('get_booking_quote', (deps, ctx) =>
    handleGetBookingQuoteLogic(deps, ctx.businessId, ctx.params),
  );
  map.set('get_package_quote', (deps, ctx) =>
    handleGetPackageQuoteLogic(deps, ctx.businessId, ctx.params),
  );
  map.set('get_multi_service_quote', (deps, ctx) =>
    handleGetMultiServiceQuoteLogic(deps, ctx.businessId, ctx.params),
  );
  map.set('confirm_stripe_payment', (deps, ctx) =>
    handleConfirmStripePaymentLogic(deps, ctx.businessId, ctx.params),
  );
  map.set('purchase_subscription_checkout', (deps, ctx) =>
    handlePurchaseSubscriptionCheckoutLogic(deps, ctx.businessId, ctx.params),
  );
  map.set('explain_why_stripe_required', (deps, ctx) =>
    handleExplainWhyStripeRequiredLogic(
      deps,
      ctx.businessId,
      withPromptParams(ctx.params, ctx.prompt),
      ctx.prompt,
    ),
  );
  map.set('receipt_status', (deps, ctx) =>
    handleReceiptStatusLogic(deps, ctx.businessId, ctx.params),
  );

  return map;
}

/** Registry-driven dispatch table for AiPaymentsService (ai-cmd-ext-6.2). */
export const PAYMENTS_LOGIC_DISPATCH_MAP = buildPaymentsLogicDispatchMap();
