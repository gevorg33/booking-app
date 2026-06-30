import type { Repository } from 'typeorm';
import { Business } from '../business/entities/business.entity.js';
import { Service, PrepaymentMode } from '../service/entities/service.entity.js';
import { getBusinessStripeIntegration } from '../billing/stripe-integration.types.js';
import type { CommandResult } from './command-completion.types.js';
import {
  parseAuditServicesMissingOnlinePaymentFromPrompt,
  type ParsedAuditServicesMissingOnlinePayment,
} from './ai-audit-services-missing-online-payment.util.js';

const NAVIGATE = {
  path: '/dashboard/services',
  label: 'Open Services',
};

export interface AuditServicesMissingOnlinePaymentLogicDeps {
  businessRepo: Repository<Business>;
  serviceRepo: Repository<Service>;
}

function success(
  action: string,
  summary: string,
  details?: Record<string, unknown>,
): CommandResult {
  return { success: true, action, summary, details: details ?? {} };
}

function failure(
  action: string,
  summary: string,
  details?: Record<string, unknown>,
): CommandResult {
  return { success: false, action, summary, details: details ?? {} };
}

function isOnlinePaymentOff(service: {
  prepaymentMode?: PrepaymentMode | null;
}): boolean {
  return (
    service.prepaymentMode == null ||
    service.prepaymentMode === PrepaymentMode.NONE
  );
}

function filterCatalogForAudit<
  T extends {
    id: string;
    name: string;
    isActive?: boolean;
    prepaymentMode?: PrepaymentMode | null;
    category?: { name: string } | null;
  },
>(catalog: T[], parsed: ParsedAuditServicesMissingOnlinePayment): T[] {
  const active = catalog.filter((service) => service.isActive !== false);
  const scoped = parsed.categoryName
    ? active.filter((service) =>
        service.category?.name
          ?.toLowerCase()
          .includes(parsed.categoryName!.toLowerCase()),
      )
    : active;

  return scoped.filter((service) => isOnlinePaymentOff(service));
}

export function buildMissingOnlinePaymentAuditSummary(args: {
  missing: Array<{ id: string; name: string; categoryName?: string | null }>;
  totalActiveInScope: number;
  categoryName?: string;
  stripeConnected: boolean;
}): string {
  const scopeLabel = args.categoryName
    ? ` in ${args.categoryName} category`
    : '';

  if (!args.missing.length) {
    return `All ${args.totalActiveInScope} active service(s)${scopeLabel} accept online payment on public booking.`;
  }

  const preview = args.missing
    .slice(0, 8)
    .map((service) => service.name)
    .join(', ');
  const extra =
    args.missing.length > 8 ? ` (+${args.missing.length - 8} more)` : '';

  const lines = [
    `${args.missing.length} of ${args.totalActiveInScope} active service(s)${scopeLabel} do not accept online payment on public booking: ${preview}${extra}.`,
  ];

  if (!args.stripeConnected) {
    lines.push(
      'Stripe Connect is not connected — complete Billing onboarding before enabling online prepayment on these services.',
    );
  } else {
    lines.push(
      'Enable online payment per service in Services, or use configure_service_online_payment to update them in bulk.',
    );
  }

  return lines.join(' ');
}

export async function handleAuditServicesMissingOnlinePaymentLogic(
  deps: AuditServicesMissingOnlinePaymentLogicDeps,
  businessId: string,
  params: Record<string, unknown> = {},
  prompt?: string,
): Promise<CommandResult> {
  const effectivePrompt = String(prompt ?? params._prompt ?? '');
  const parsed = parseAuditServicesMissingOnlinePaymentFromPrompt(
    effectivePrompt,
    params,
  );
  if (!parsed) {
    return failure(
      'audit_services_missing_online_payment',
      'Ask which services are missing online payment (e.g. "Which services still don\'t accept online payment?" or "Audit services missing online payment").',
    );
  }

  const business = await deps.businessRepo.findOne({
    where: { id: businessId },
  });
  if (!business) {
    return failure(
      'audit_services_missing_online_payment',
      'Business not found.',
    );
  }

  const catalog = await deps.serviceRepo.find({
    where: { businessId, isActive: true },
    relations: { category: true },
    order: { name: 'ASC' },
  });

  const active = catalog.filter((service) => service.isActive !== false);
  const scoped = parsed.categoryName
    ? active.filter((service) =>
        service.category?.name
          ?.toLowerCase()
          .includes(parsed.categoryName!.toLowerCase()),
      )
    : active;

  if (parsed.categoryName && !scoped.length) {
    return failure(
      'audit_services_missing_online_payment',
      `No active services found in category "${parsed.categoryName}".`,
      { clarify: true, missing: ['categoryName'] },
    );
  }

  const missing = filterCatalogForAudit(catalog, parsed);
  const stripe = getBusinessStripeIntegration(business.settings ?? {});
  const stripeConnected = Boolean(stripe.connectAccountId);

  const summary = buildMissingOnlinePaymentAuditSummary({
    missing: missing.map((service) => ({
      id: service.id,
      name: service.name,
      categoryName: service.category?.name ?? null,
    })),
    totalActiveInScope: scoped.length,
    categoryName: parsed.categoryName,
    stripeConnected,
  });

  return success('audit_services_missing_online_payment', summary, {
    stripeConnectConnected: stripeConnected,
    connectAccountId: stripe.connectAccountId,
    categoryName: parsed.categoryName,
    totalActiveInScope: scoped.length,
    missingOnlinePaymentCount: missing.length,
    missingServices: missing.map((service) => ({
      id: service.id,
      name: service.name,
      categoryName: service.category?.name ?? null,
      prepaymentMode: service.prepaymentMode ?? PrepaymentMode.NONE,
    })),
    navigate: NAVIGATE,
  });
}
