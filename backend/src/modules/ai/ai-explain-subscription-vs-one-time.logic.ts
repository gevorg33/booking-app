import { formatCatalogServicePriceLabel } from './ai-budget-list-services.logic.js';
import type { CommandResult } from './command-completion.types.js';
import type { SelfServiceBookingLogicDeps } from './ai-self-service-booking.logic.js';
import {
  enrichExplainSubscriptionVsOneTimeParamsFromPrompt,
  isExplainSubscriptionVsOneTimePrompt,
  parseExplainSubscriptionVsOneTimeFromPrompt,
} from './ai-explain-subscription-vs-one-time.util.js';
import type { ExplainSubscriptionVsOneTimeFocus } from './ai-explain-subscription-vs-one-time.fixtures.js';
import { extractServiceNameFromPrompt } from './ai-payments.util.js';

type SubscriptionPlanRow = Awaited<
  ReturnType<SelfServiceBookingLogicDeps['subscriptionsService']['listPlans']>
>[number];

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

function resolveByName<T extends { name: string }>(
  rows: readonly T[],
  name: string,
): T | undefined {
  const needle = name.trim().toLowerCase();
  return (
    rows.find((row) => row.name.toLowerCase() === needle) ??
    rows.find((row) => row.name.toLowerCase().includes(needle)) ??
    rows.find((row) => needle.includes(row.name.toLowerCase()))
  );
}

function resolveSessionCustomerId(
  params: Record<string, unknown>,
): string | undefined {
  const raw = params.sessionCustomerId ?? params.customerId;
  return typeof raw === 'string' && raw.trim() ? raw.trim() : undefined;
}

async function resolveService(
  deps: SelfServiceBookingLogicDeps,
  businessId: string,
  params: Record<string, unknown>,
  prompt: string,
) {
  if (typeof params.serviceId === 'string' && params.serviceId.trim()) {
    return deps.serviceRepo.findOne({
      where: { id: params.serviceId.trim(), businessId, isActive: true },
    });
  }
  const serviceName =
    (typeof params.serviceName === 'string' && params.serviceName.trim()) ||
    extractServiceNameFromPrompt(prompt);
  if (!serviceName) return null;
  const catalog = await deps.serviceRepo.find({
    where: { businessId, isActive: true },
  });
  return resolveByName(catalog, serviceName) ?? null;
}

function formatMoney(amount: number, currency: string): string {
  return formatCatalogServicePriceLabel(amount, currency);
}

function describePlan(
  plan: SubscriptionPlanRow,
  deps: SelfServiceBookingLogicDeps,
): {
  name: string;
  serviceName: string;
  includedAppointments: number;
  durationMonths: number;
  subscriptionPrice: number;
  savings: number;
  perVisitPrice: number;
  unitPrice: number;
  currency: string;
} {
  const unitPrice = Number(plan.service?.price ?? 0);
  const currency = plan.service?.currency ?? 'USD';
  const preview = deps.subscriptionsService.previewFromPlan(plan, unitPrice);
  return {
    name: plan.name,
    serviceName: plan.service?.name ?? 'service',
    includedAppointments: plan.includedAppointments,
    durationMonths: plan.durationMonths,
    subscriptionPrice: preview.pricing.subscriptionPrice,
    savings: preview.pricing.savings,
    perVisitPrice: preview.pricing.perAppointmentPrice,
    unitPrice,
    currency,
  };
}

export function buildExplainSubscriptionVsOneTimeSummary(input: {
  focus: ExplainSubscriptionVsOneTimeFocus;
  serviceName?: string;
  plans: ReturnType<typeof describePlan>[];
  activeSubscription?: {
    planName: string;
    appointmentsRemaining: number;
    appointmentsIncluded?: number;
    expiresAt?: Date | string;
  } | null;
}): string {
  const serviceLabel = input.serviceName ?? input.plans[0]?.serviceName;
  const serviceSuffix = serviceLabel ? ` for ${serviceLabel}` : '';

  if (input.focus === 'useExisting' && input.activeSubscription) {
    const sub = input.activeSubscription;
    const expiry =
      sub.expiresAt instanceof Date
        ? sub.expiresAt.toISOString().slice(0, 10)
        : sub.expiresAt
          ? String(sub.expiresAt).slice(0, 10)
          : null;
    const expiryLine = expiry ? ` valid until ${expiry}` : '';
    return `At checkout${serviceSuffix}, choose Use subscription to spend one visit credit from ${sub.planName} (${sub.appointmentsRemaining} of ${sub.appointmentsIncluded ?? sub.appointmentsRemaining} left${expiryLine}) with no per-visit charge, or One-time appointment to pay the regular service price.`;
  }

  if (input.focus === 'whichPlan') {
    if (!input.plans.length) {
      return serviceLabel
        ? `No subscription plans are linked to ${serviceLabel} right now.`
        : 'No subscription plans are available for that service.';
    }
    const lines = input.plans.map(
      (plan) =>
        `${plan.name}: ${plan.includedAppointments} visit(s) over ${plan.durationMonths} month(s) for ${formatMoney(plan.subscriptionPrice, plan.currency)}`,
    );
    return serviceLabel
      ? `Subscription plans that include ${serviceLabel}: ${lines.join('; ')}.`
      : `Matching subscription plans: ${lines.join('; ')}.`;
  }

  if (!input.plans.length) {
    return serviceLabel
      ? `Checkout${serviceSuffix} offers One-time appointment at the regular visit price. No Subscribe & save plans are configured for this service yet.`
      : 'At checkout you can book a One-time appointment. No subscription plans are available yet.';
  }

  const primary = input.plans[0];
  const oneTime = `One-time appointment pays ${formatMoney(primary.unitPrice, primary.currency)} for a single visit.`;
  const subscribe = `Subscribe & save buys ${primary.name}: ${primary.includedAppointments} visit(s) over ${primary.durationMonths} month(s) for ${formatMoney(primary.subscriptionPrice, primary.currency)}${primary.savings > 0 ? ` (about ${formatMoney(primary.savings, primary.currency)} less than booking separately)` : ''}.`;
  const useExisting =
    input.activeSubscription &&
    input.activeSubscription.appointmentsRemaining > 0
      ? ` If you already have credits, Use subscription covers this visit from ${input.activeSubscription.planName}.`
      : '';

  if (input.focus === 'options') {
    return `How to book${serviceSuffix}: ${oneTime} Subscribe & save bundles multiple visits at a lower per-visit rate.${useExisting}`;
  }

  return `${oneTime} ${subscribe}${useExisting}`;
}

export async function handleExplainSubscriptionVsOneTimeLogic(
  deps: SelfServiceBookingLogicDeps,
  businessId: string,
  params: Record<string, unknown> = {},
  prompt = '',
): Promise<CommandResult> {
  const textPrompt = prompt || String(params._prompt ?? '');
  const enriched = enrichExplainSubscriptionVsOneTimeParamsFromPrompt(
    { ...params, _prompt: textPrompt },
    textPrompt,
  );

  if (textPrompt && !isExplainSubscriptionVsOneTimePrompt(textPrompt)) {
    return failure(
      'explain_subscription_vs_one_time',
      'Ask how Subscribe & save compares to a one-time visit, which plan includes a service, or whether to use subscription credit at checkout.',
      { clarify: true },
    );
  }

  const parsed = parseExplainSubscriptionVsOneTimeFromPrompt(
    textPrompt,
    enriched,
  );
  const focus =
    (enriched.focus as ExplainSubscriptionVsOneTimeFocus) ??
    parsed?.focus ??
    'compare';
  const service = await resolveService(deps, businessId, enriched, textPrompt);

  let plans: SubscriptionPlanRow[] = [];
  if (service) {
    plans = await deps.subscriptionsService.listPlans(
      businessId,
      service.id,
      false,
    );
  } else if (parsed?.serviceName || enriched.serviceName) {
    const allPlans = await deps.subscriptionsService.listPlans(businessId);
    const needle = String(
      parsed?.serviceName ?? enriched.serviceName,
    ).toLowerCase();
    plans = allPlans.filter((plan) =>
      (plan.service?.name ?? '').toLowerCase().includes(needle),
    );
  } else if (focus === 'whichPlan' || focus === 'compare') {
    plans = await deps.subscriptionsService.listPlans(businessId);
  }

  if (typeof enriched.planName === 'string' && enriched.planName.trim()) {
    const named = resolveByName(plans, enriched.planName);
    if (named) plans = [named];
  }

  const describedPlans = plans.map((plan) => describePlan(plan, deps));
  const customerId = resolveSessionCustomerId(enriched);
  let activeSubscription: {
    planName: string;
    appointmentsRemaining: number;
    appointmentsIncluded?: number;
    expiresAt?: Date | string;
  } | null = null;

  if (customerId && service) {
    const active = await deps.subscriptionsService.getActiveForCustomerService(
      businessId,
      customerId,
      service.id,
    );
    if (active) {
      activeSubscription = {
        planName: active.plan?.name ?? 'Membership plan',
        appointmentsRemaining: active.appointmentsRemaining,
        appointmentsIncluded: active.appointmentsIncluded,
        expiresAt: active.expiresAt,
      };
    }
  }

  const summary = buildExplainSubscriptionVsOneTimeSummary({
    focus,
    serviceName: service?.name ?? parsed?.serviceName,
    plans: describedPlans,
    activeSubscription,
  });

  return success('explain_subscription_vs_one_time', summary, {
    focus,
    serviceId: service?.id ?? null,
    serviceName: service?.name ?? parsed?.serviceName ?? null,
    plans: describedPlans,
    hasActiveSubscription: Boolean(activeSubscription),
    ...(activeSubscription
      ? {
          appointmentsRemaining: activeSubscription.appointmentsRemaining,
          subscriptionPlanName: activeSubscription.planName,
        }
      : {}),
    ...(service
      ? {
          navigate: {
            path: 'checkout',
            query: { serviceId: service.id },
          },
        }
      : {}),
  });
}
