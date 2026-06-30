import { PrepaymentMode, type Service } from '../service/entities/service.entity.js';
import type { UpdateServiceDto } from '../service/dto/create-service.dto.js';
import type { CommandResult } from './command-completion.types.js';
import type { PaymentsLogicDeps } from './ai-payments.logic.js';
import {
  computeDepositPolicyAmount,
  describeServiceDepositPolicy,
  parseServiceDepositPolicyConfig,
  resolveTargetServicesForDepositPolicy,
} from './ai-service-deposit-policy.util.js';

function failure(
  action: string,
  summary: string,
  details: Record<string, unknown> = {},
): CommandResult {
  return { success: false, action, summary, details };
}

function success(
  action: string,
  summary: string,
  details: Record<string, unknown>,
): CommandResult {
  return { success: true, action, summary, details };
}

function describeScope(config: {
  allServices?: boolean;
  serviceName?: string;
  serviceNames?: string[];
  categoryName?: string;
  serviceTier?: string;
  featuredOnly?: boolean;
}): string {
  const parts: string[] = [];
  if (config.featuredOnly) parts.push('featured');
  if (config.serviceTier) parts.push(`${config.serviceTier} tier`);
  if (config.allServices) {
    parts.push('all services');
  } else if (config.serviceNames?.length) {
    parts.push(config.serviceNames.join(' and '));
  } else if (config.serviceName) {
    parts.push(config.serviceName);
  } else if (config.categoryName) {
    parts.push(`${config.categoryName} services`);
  } else if (parts.length) {
    parts.push('services');
  }
  return parts.join(' ') || 'selected services';
}

export async function handleConfigureServiceDepositPolicyLogic(
  deps: PaymentsLogicDeps,
  businessId: string,
  params: Record<string, unknown>,
  prompt: string | undefined,
  catalogServices: Service[],
  userId?: string,
): Promise<CommandResult> {
  const effectivePrompt = String(prompt || params._prompt || '');
  const config = parseServiceDepositPolicyConfig(effectivePrompt, params);
  if (!config) {
    return failure(
      'configure_service_deposit_policy',
      'Specify deposit policy scope and amount (e.g. "Set 30% deposit on premium tier services").',
      {
        clarify: true,
        missing: ['depositPercent', 'depositAmount', 'serviceTier', 'featuredOnly'],
      },
    );
  }

  const hasScope =
    config.allServices ||
    config.serviceName ||
    config.serviceNames?.length ||
    config.categoryName ||
    config.serviceTier ||
    config.featuredOnly;

  if (!hasScope) {
    return failure(
      'configure_service_deposit_policy',
      'Specify which services: tier, featured, category, named services, or all services.',
      {
        clarify: true,
        missing: [
          'serviceTier',
          'featuredOnly',
          'categoryName',
          'serviceName',
          'allServices',
        ],
      },
    );
  }

  const targets = resolveTargetServicesForDepositPolicy(
    catalogServices.filter((s) => s.businessId === businessId),
    config,
  );
  if (!targets.length) {
    return failure(
      'configure_service_deposit_policy',
      'No matching services found for that deposit policy scope.',
      { clarify: true },
    );
  }

  const updated: Array<{
    id: string;
    name: string;
    prepaymentMode: PrepaymentMode;
    depositAmount: number | null;
  }> = [];

  try {
    for (const service of targets) {
      const depositAmount = computeDepositPolicyAmount(Number(service.price), config);
      const updateDto: UpdateServiceDto = {
        prepaymentMode: PrepaymentMode.DEPOSIT,
      };
      if (depositAmount != null) {
        updateDto.depositAmount = depositAmount;
      }
      const saved = await deps.serviceService.update(
        service.id,
        updateDto,
        userId,
      );
      updated.push({
        id: saved.id,
        name: saved.name,
        prepaymentMode: saved.prepaymentMode,
        depositAmount:
          saved.depositAmount != null ? Number(saved.depositAmount) : null,
      });
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : undefined;
    return failure(
      'configure_service_deposit_policy',
      message ??
        'Could not update service deposit policy. Connect Stripe in Dashboard → Billing if enabling prepayment.',
      { updatedCount: updated.length, updated },
    );
  }

  const modeLabel = describeServiceDepositPolicy(config);
  const scopeLabel =
    updated.length === targets.length && config.allServices
      ? `all ${updated.length} services`
      : `${describeScope(config)} (${updated.length} services)`;

  return success(
    'configure_service_deposit_policy',
    `Deposit policy set for ${scopeLabel}: ${modeLabel}.`,
    {
      updatedCount: updated.length,
      prepaymentMode: PrepaymentMode.DEPOSIT,
      depositPercent: config.depositPercent ?? null,
      depositAmount: config.depositAmount ?? null,
      serviceTier: config.serviceTier ?? null,
      featuredOnly: config.featuredOnly ?? false,
      services: updated,
      navigate: { path: '/dashboard/services', label: 'Open Services' },
    },
  );
}
