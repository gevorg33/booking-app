import type { Repository } from 'typeorm';
import { PrepaymentMode } from '../service/entities/service.entity.js';
import type { Business } from '../business/entities/business.entity.js';
import type { Service } from '../service/entities/service.entity.js';
import { resolvePublicPaymentSettings } from '../../common/utils/customer-self-service.util.js';
import { getBusinessStripeIntegration } from '../billing/stripe-integration.types.js';
import type { CommandResult } from './command-completion.types.js';
import {
  enrichCashPaymentParamsFromPrompt,
  resolveServiceCashAvailability,
} from './ai-cash-payment-checkout.util.js';
import { extractServiceNameFromPrompt } from './ai-payments.util.js';
import {
  buildPayAtVenueFallbackNavigate,
  parsePayAtVenueFallbackFromPrompt,
} from './ai-pay-at-venue-fallback.util.js';

export interface PayAtVenueFallbackLogicDeps {
  businessRepo: Pick<Repository<Business>, 'findOne'>;
  serviceRepo: Pick<Repository<Service>, 'findOne'>;
}

function failure(
  action: string,
  summary: string,
  details?: Record<string, unknown>,
): CommandResult {
  return { success: false, action, summary, details: details ?? {} };
}

function success(
  action: string,
  summary: string,
  details?: Record<string, unknown>,
): CommandResult {
  return { success: true, action, summary, details: details ?? {} };
}

function isOnlinePaymentsEnabled(
  settings: Record<string, unknown> | null | undefined,
): boolean {
  return Boolean(getBusinessStripeIntegration(settings ?? {}).connectAccountId);
}

async function resolveService(
  deps: PayAtVenueFallbackLogicDeps,
  businessId: string,
  params: Record<string, unknown>,
): Promise<Pick<Service, 'id' | 'name' | 'prepaymentMode'> | undefined> {
  const serviceId = params.serviceId as string | undefined;
  if (serviceId) {
    const service = await deps.serviceRepo.findOne({
      where: { id: serviceId, businessId, isActive: true },
      select: { id: true, name: true, prepaymentMode: true },
    });
    if (service) return service;
  }

  const serviceName = params.serviceName as string | undefined;
  if (!serviceName) return undefined;

  const service = await deps.serviceRepo.findOne({
    where: { businessId, isActive: true, name: serviceName },
    select: { id: true, name: true, prepaymentMode: true },
  });
  return service ?? undefined;
}

export async function handlePayAtVenueFallbackLogic(
  deps: PayAtVenueFallbackLogicDeps,
  businessId: string,
  params: Record<string, unknown> = {},
  prompt?: string,
): Promise<CommandResult> {
  const textPrompt = prompt || String(params._prompt ?? '');
  const parsed = parsePayAtVenueFallbackFromPrompt(textPrompt, params);
  if (!parsed) {
    return failure(
      'pay_at_venue_fallback',
      'Ask to skip online payment and pay at the salon instead (e.g. "Pay at salon instead" or "Skip online payment").',
      { clarify: true },
    );
  }

  const business = await deps.businessRepo.findOne({
    where: { id: businessId },
  });
  if (!business) {
    return failure('pay_at_venue_fallback', 'Business not found.');
  }

  const settings = business.settings as Record<string, unknown> | undefined;
  const payment = resolvePublicPaymentSettings(settings);
  const onlineEnabled = isOnlinePaymentsEnabled(settings);
  const enrichedParams = enrichCashPaymentParamsFromPrompt(
    params,
    textPrompt,
    extractServiceNameFromPrompt,
  );
  const service = await resolveService(deps, businessId, enrichedParams);
  const cashAvailability = resolveServiceCashAvailability(service, {
    acceptCashPayments: payment.acceptCashPayments,
    onlineEnabled,
  });

  if (!payment.acceptCashPayments) {
    return failure(
      'pay_at_venue_fallback',
      'Cash pay-at-venue is not enabled — this business requires online card checkout.',
      {
        acceptCashPayments: false,
        onlinePaymentsEnabled: onlineEnabled,
        serviceName: service?.name,
      },
    );
  }

  if (service?.prepaymentMode === PrepaymentMode.FULL && onlineEnabled) {
    return failure(
      'pay_at_venue_fallback',
      `${service.name} requires full payment online — you cannot skip card checkout for this service.`,
      {
        acceptCashPayments: true,
        onlinePaymentsEnabled: onlineEnabled,
        serviceName: service.name,
        prepaymentMode: service.prepaymentMode,
        serviceCash: cashAvailability,
      },
    );
  }

  if (
    !cashAvailability.cashForFullVisit &&
    cashAvailability.prepaymentBlocksCashOnly
  ) {
    return failure(
      'pay_at_venue_fallback',
      `${service?.name ?? 'This service'} requires an online deposit — pay the deposit online, then any balance can be paid at your visit.`,
      {
        acceptCashPayments: true,
        onlinePaymentsEnabled: onlineEnabled,
        serviceName: service?.name,
        prepaymentMode: service?.prepaymentMode,
        serviceCash: cashAvailability,
      },
    );
  }

  const isActivationPath =
    params.isActivationPath === true ||
    params.completedBookingCount === 0 ||
    params.activationPath === true;

  const summary = isActivationPath
    ? 'Pay at visit selected — confirm below to complete your booking.'
    : 'Confirm and pay at the salon instead — online card checkout skipped.';

  const navigate = buildPayAtVenueFallbackNavigate(enrichedParams);

  return success('pay_at_venue_fallback', summary, {
    paymentMethod: 'cash',
    payAtVenue: true,
    skipOnlinePayment: true,
    acceptCashPayments: payment.acceptCashPayments,
    onlinePaymentsEnabled: onlineEnabled,
    serviceName: service?.name,
    serviceCash: cashAvailability,
    activationPath: isActivationPath,
    sessionContext: {
      paymentMethod: 'cash',
      payAtVenue: true,
      skipOnlinePayment: true,
    },
    ...(navigate ? { navigate } : {}),
  });
}
