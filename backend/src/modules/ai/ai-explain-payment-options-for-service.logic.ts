import type { Service } from '../service/entities/service.entity.js';
import type { CommandResult } from './command-completion.types.js';
import { buildPaymentMethodOptionsCopy } from './ai-cash-payment-checkout.util.js';
import {
  describeServicePrepaymentPolicy,
  resolveServicePrepaymentDueAmount,
} from './ai-explain-prepayment.util.js';
import {
  enrichExplainPaymentOptionsParamsFromPrompt,
  enrichPaymentOptionsParamsFromCatalogContext,
  needsPaymentOptionsServiceClarify,
} from './ai-explain-payment-options-for-service.util.js';
import { resolvePublicPaymentSettings } from '../../common/utils/customer-self-service.util.js';
import { getBusinessStripeIntegration } from '../billing/stripe-integration.types.js';
import type { PaymentsLogicDeps } from './ai-payments.logic.js';

function isOnlinePaymentsEnabled(
  settings: Record<string, unknown> | null | undefined,
): boolean {
  return Boolean(getBusinessStripeIntegration(settings ?? {}).connectAccountId);
}

async function resolveServiceForPaymentOptions(
  deps: PaymentsLogicDeps,
  businessId: string,
  params: Record<string, any>,
): Promise<Service | undefined> {
  const services = await deps.serviceRepo.find({
    where: { businessId, isActive: true },
  });

  if (params.serviceId) {
    return services.find((entry) => entry.id === params.serviceId);
  }

  const name = (params.serviceName as string | undefined)?.trim();
  if (!name) return undefined;

  const needle = name.toLowerCase();
  return (
    services.find((entry) => entry.name.toLowerCase() === needle) ??
    services.find((entry) => entry.name.toLowerCase().includes(needle))
  );
}

export async function handleExplainPaymentOptionsForServiceLogic(
  deps: PaymentsLogicDeps,
  businessId: string,
  params: Record<string, any>,
  prompt = '',
  catalogContext?: Record<string, unknown>,
): Promise<CommandResult> {
  const business = await deps.businessRepo.findOne({
    where: { id: businessId },
  });
  if (!business) {
    return {
      success: false,
      action: 'explain_payment_options_for_service',
      summary: 'Business not found.',
      details: {},
    };
  }

  const textPrompt = prompt || String(params._prompt ?? '');
  const withCatalog = enrichPaymentOptionsParamsFromCatalogContext(
    params,
    textPrompt,
    catalogContext,
  );
  const enrichedParams = enrichExplainPaymentOptionsParamsFromPrompt(
    withCatalog,
    textPrompt,
  );

  if (needsPaymentOptionsServiceClarify(textPrompt, enrichedParams)) {
    return {
      success: false,
      action: 'explain_payment_options_for_service',
      summary:
        'Select a service first, or tell me which service payment options to explain.',
      details: {
        clarify: true,
        missing: ['serviceName'],
      },
    };
  }

  const service = await resolveServiceForPaymentOptions(
    deps,
    businessId,
    enrichedParams,
  );
  if (!service) {
    return {
      success: false,
      action: 'explain_payment_options_for_service',
      summary: 'Specify which service payment options to explain.',
      details: {
        clarify: true,
        missing: ['serviceName'],
      },
    };
  }

  const payment = resolvePublicPaymentSettings(business.settings);
  const online = isOnlinePaymentsEnabled(business.settings);
  const copy = buildPaymentMethodOptionsCopy({
    onlineEnabled: online,
    acceptCashPayments: payment.acceptCashPayments,
    service,
  });
  const prepaymentPolicy = describeServicePrepaymentPolicy(service);
  const depositDueNow = resolveServicePrepaymentDueAmount(service);
  const summary = [
    copy.summary,
    `Prepayment policy: ${prepaymentPolicy}.`,
  ].join(' ');

  return {
    success: true,
    action: 'explain_payment_options_for_service',
    summary,
    details: {
      ...copy,
      serviceId: service.id,
      serviceName: service.name,
      prepaymentMode: service.prepaymentMode,
      prepaymentPolicy,
      depositDueNow,
    },
  };
}
