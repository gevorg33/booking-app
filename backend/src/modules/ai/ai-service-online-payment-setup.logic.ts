import type { Repository } from 'typeorm';
import { Business } from '../business/entities/business.entity.js';
import { Service, PrepaymentMode } from '../service/entities/service.entity.js';
import { getBusinessStripeIntegration } from '../billing/stripe-integration.types.js';
import { resolvePublicPaymentSettings } from '../../common/utils/customer-self-service.util.js';
import type { CommandResult } from './command-completion.types.js';
import {
  filterServicesForOnlinePaymentSetupExplain,
  formatServicePrepaymentLabel,
  parseExplainServiceOnlinePaymentSetupFromPrompt,
} from './ai-service-online-payment-setup.util.js';

export interface ExplainServiceOnlinePaymentSetupLogicDeps {
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

function resolveByName<T extends { name: string }>(
  rows: T[],
  query: string,
): T | undefined {
  const needle = query.trim().toLowerCase();
  return rows.find((row) => row.name.toLowerCase() === needle);
}

function buildStripeConnectLine(
  settings: Record<string, unknown> | undefined,
): {
  line: string;
  connected: boolean;
  connectAccountId?: string;
} {
  const stripe = getBusinessStripeIntegration(settings ?? {});
  const connected = Boolean(stripe.connectAccountId);
  if (!connected) {
    return {
      connected: false,
      line: 'Stripe Connect: not connected — complete onboarding in Dashboard → Billing before enabling service prepayment.',
    };
  }
  const suffix = stripe.connectAccountId ? ` (${stripe.connectAccountId})` : '';
  return {
    connected: true,
    connectAccountId: stripe.connectAccountId,
    line: `Stripe Connect: connected${suffix}.`,
  };
}

function buildCashLine(acceptCashPayments: boolean): string {
  return acceptCashPayments
    ? 'Cash at venue on public booking: enabled.'
    : 'Cash at venue on public booking: disabled.';
}

function groupServicesByPrepayment(services: Service[]): {
  full: Service[];
  deposit: Service[];
  none: Service[];
} {
  const full: Service[] = [];
  const deposit: Service[] = [];
  const none: Service[] = [];
  for (const service of services) {
    switch (service.prepaymentMode) {
      case PrepaymentMode.FULL:
        full.push(service);
        break;
      case PrepaymentMode.DEPOSIT:
        deposit.push(service);
        break;
      default:
        none.push(service);
        break;
    }
  }
  return { full, deposit, none };
}

function buildServiceSummaryLines(services: Service[]): string[] {
  const { full, deposit, none } = groupServicesByPrepayment(services);
  const lines: string[] = [];
  const onlineCount = full.length + deposit.length;
  lines.push(
    `${onlineCount} of ${services.length} active service(s) accept online payment on public booking.`,
  );
  if (full.length) {
    lines.push(
      `Full prepayment: ${full.map((service) => service.name).join(', ')}.`,
    );
  }
  if (deposit.length) {
    lines.push(
      `Deposit prepayment: ${deposit.map((service) => formatServicePrepaymentLabel(service)).join('; ')}.`,
    );
  }
  if (none.length) {
    lines.push(
      `Online payment off: ${none.map((service) => service.name).join(', ')}.`,
    );
  }
  if (onlineCount === 0) {
    lines.push(
      'No services currently require online prepayment on public booking.',
    );
  }
  return lines;
}

export async function handleExplainServiceOnlinePaymentSetupLogic(
  deps: ExplainServiceOnlinePaymentSetupLogicDeps,
  businessId: string,
  params: Record<string, unknown> = {},
  prompt?: string,
): Promise<CommandResult> {
  const parsed = parseExplainServiceOnlinePaymentSetupFromPrompt(
    String(prompt ?? params._prompt ?? ''),
    params,
  );
  if (!parsed) {
    return failure(
      'explain_service_online_payment_setup',
      'Ask about service online payment setup (e.g. "Explain service online payment setup" or "Which services require prepayment on public booking?").',
    );
  }

  const business = await deps.businessRepo.findOne({
    where: { id: businessId },
  });
  if (!business) {
    return failure(
      'explain_service_online_payment_setup',
      'Business not found.',
    );
  }

  const settings = business.settings as Record<string, unknown> | undefined;
  const payment = resolvePublicPaymentSettings(settings);
  const stripe = buildStripeConnectLine(settings);

  const catalog = await deps.serviceRepo.find({
    where: { businessId, isActive: true },
    relations: { category: true },
    order: { name: 'ASC' },
  });

  if (parsed.serviceName || parsed.categoryName) {
    const filtered = filterServicesForOnlinePaymentSetupExplain(
      catalog,
      parsed,
    );
    if (!filtered.length) {
      return failure(
        'explain_service_online_payment_setup',
        `No active services found matching "${parsed.serviceName ?? parsed.categoryName}".`,
        {
          clarify: true,
          missing: parsed.serviceName ? ['serviceName'] : ['categoryName'],
        },
      );
    }

    const filterLabel = parsed.serviceName
      ? (resolveByName(catalog, parsed.serviceName)?.name ?? parsed.serviceName)
      : parsed.categoryName;

    const summary = [
      stripe.line,
      buildCashLine(payment.acceptCashPayments),
      `Online payment setup for ${filterLabel}:`,
      ...filtered.map((service) => formatServicePrepaymentLabel(service)),
    ].join(' ');

    return success('explain_service_online_payment_setup', summary, {
      stripeConnectConnected: stripe.connected,
      connectAccountId: stripe.connectAccountId,
      acceptCashPayments: payment.acceptCashPayments,
      serviceName: parsed.serviceName,
      categoryName: parsed.categoryName,
      services: filtered.map((service) => ({
        id: service.id,
        name: service.name,
        prepaymentMode: service.prepaymentMode,
        depositAmount:
          service.depositAmount != null ? Number(service.depositAmount) : null,
      })),
    });
  }

  const summary = [
    stripe.line,
    buildCashLine(payment.acceptCashPayments),
    ...buildServiceSummaryLines(catalog),
  ].join(' ');

  const grouped = groupServicesByPrepayment(catalog);

  return success('explain_service_online_payment_setup', summary, {
    stripeConnectConnected: stripe.connected,
    connectAccountId: stripe.connectAccountId,
    acceptCashPayments: payment.acceptCashPayments,
    totalActiveServices: catalog.length,
    onlinePaymentEnabledCount: grouped.full.length + grouped.deposit.length,
    fullPrepaymentServices: grouped.full.map((service) => service.name),
    depositPrepaymentServices: grouped.deposit.map((service) => ({
      name: service.name,
      depositAmount:
        service.depositAmount != null ? Number(service.depositAmount) : null,
    })),
    onlinePaymentOffServices: grouped.none.map((service) => service.name),
  });
}
