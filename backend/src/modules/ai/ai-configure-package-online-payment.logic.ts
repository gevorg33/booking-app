import {
  PrepaymentMode,
  type Service,
} from '../service/entities/service.entity.js';
import type { UpdateServiceDto } from '../service/dto/create-service.dto.js';
import type { CommandResult } from './command-completion.types.js';
import type { CatalogLogicDeps } from './ai-catalog.logic.js';
import {
  collectServiceIdsFromPackages,
  computeServiceDepositAmount,
  describePrepaymentMode,
  parseConfigurePackageOnlinePaymentFromPrompt,
  resolveTargetPackages,
  toServiceOnlinePaymentConfig,
} from './ai-configure-package-online-payment.util.js';

const NAVIGATE = {
  path: '/dashboard/services?tab=packages',
  label: 'Open Packages',
};

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

export async function handleConfigurePackageOnlinePaymentLogic(
  deps: CatalogLogicDeps,
  businessId: string,
  params: Record<string, unknown> = {},
  services: Service[],
  prompt?: string,
  userId?: string,
): Promise<CommandResult> {
  const effectivePrompt = String(prompt ?? params._prompt ?? '');
  const parsed = parseConfigurePackageOnlinePaymentFromPrompt(
    effectivePrompt,
    params,
  );

  if (!parsed) {
    return failure(
      'configure_package_online_payment',
      'Ask to configure package online prepayment (e.g. "Require 50% online prepayment for Spa Day package").',
      {
        clarify: true,
        missing: ['packageName', 'prepaymentMode'],
        navigate: NAVIGATE,
      },
    );
  }

  if (
    !parsed.allPackages &&
    !parsed.packageName &&
    !parsed.packageNames?.length
  ) {
    return failure(
      'configure_package_online_payment',
      'Which package should I update — one package, several by name, or all packages?',
      {
        clarify: true,
        missing: ['packageName', 'packageNames', 'allPackages'],
        navigate: NAVIGATE,
      },
    );
  }

  const packages = await deps.packagesService.listPackages(
    businessId,
    'active',
    true,
  );
  const targetPackages = resolveTargetPackages(packages, parsed);
  if (!targetPackages.length) {
    return failure(
      'configure_package_online_payment',
      'No matching active packages found for that scope.',
      { clarify: true, navigate: NAVIGATE },
    );
  }

  const serviceIds = collectServiceIdsFromPackages(targetPackages);
  if (!serviceIds.length) {
    return failure(
      'configure_package_online_payment',
      'The selected package(s) have no linked services to update.',
      { clarify: true, navigate: NAVIGATE },
    );
  }

  const paymentConfig = toServiceOnlinePaymentConfig(parsed);
  const targets = services.filter((service) => serviceIds.includes(service.id));
  if (!targets.length) {
    return failure(
      'configure_package_online_payment',
      'No matching catalog services found for those package items.',
      { clarify: true, navigate: NAVIGATE },
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
      const depositAmount = computeServiceDepositAmount(
        Number(service.price),
        paymentConfig,
      );
      const updateDto: UpdateServiceDto = {
        prepaymentMode: parsed.prepaymentMode,
      };
      if (
        parsed.prepaymentMode === PrepaymentMode.DEPOSIT &&
        depositAmount != null
      ) {
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
    const message =
      err instanceof Error
        ? err.message
        : 'Could not update package service prepayment. Connect Stripe in Dashboard → Billing if enabling prepayment.';
    return failure('configure_package_online_payment', message, {
      updatedCount: updated.length,
      updated,
      navigate: NAVIGATE,
    });
  }

  const modeLabel = describePrepaymentMode(paymentConfig);
  const packageLabel = parsed.allPackages
    ? `all ${targetPackages.length} packages`
    : targetPackages.map((pkg) => `"${pkg.name}"`).join(', ');
  const summary =
    parsed.prepaymentMode === PrepaymentMode.NONE
      ? `Online payment disabled on ${updated.length} service(s) in ${packageLabel}.`
      : `Online prepayment (${modeLabel}) enabled on ${updated.length} service(s) in ${packageLabel}.`;

  return success('configure_package_online_payment', summary, {
    packageCount: targetPackages.length,
    packages: targetPackages.map((pkg) => ({ id: pkg.id, name: pkg.name })),
    updatedCount: updated.length,
    prepaymentMode: parsed.prepaymentMode,
    services: updated,
    navigate: NAVIGATE,
  });
}
