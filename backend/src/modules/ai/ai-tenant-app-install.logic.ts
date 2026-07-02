import type { TenantAppInstallService } from '../business/tenant-app-install.service.js';
import type { Repository } from 'typeorm';
import type { Business } from '../business/entities/business.entity.js';
import type { CommandResult } from './command-completion.types.js';
import {
  buildExplainTenantAppInstallGuidance,
  buildRegenerateTenantAppInstallSummary,
} from './ai-tenant-app-install.util.js';

export interface TenantAppInstallLogicDeps {
  tenantAppInstallService: TenantAppInstallService;
  businessRepo: Repository<Business>;
}

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

export async function handleExplainTenantAppInstallLogic(
  deps: TenantAppInstallLogicDeps,
  businessId: string,
): Promise<CommandResult> {
  try {
    const business = await deps.businessRepo.findOne({
      where: { id: businessId },
    });
    if (!business) {
      return failure(
        'explain_tenant_app_install',
        'Business not found — cannot load app install assets.',
      );
    }

    const view = await deps.tenantAppInstallService.ensureForBusiness(business);
    const guidance = buildExplainTenantAppInstallGuidance({ view });

    return success('explain_tenant_app_install', guidance.summary, {
      guidance,
      appInstall: view,
    });
  } catch (err: any) {
    return failure(
      'explain_tenant_app_install',
      err?.message ?? 'Could not explain tenant app install setup.',
    );
  }
}

export async function handleRegenerateTenantAppInstallQrLogic(
  deps: TenantAppInstallLogicDeps,
  businessId: string,
): Promise<CommandResult> {
  try {
    const business = await deps.businessRepo.findOne({
      where: { id: businessId },
    });
    if (!business) {
      return failure(
        'regenerate_tenant_app_install_qr',
        'Business not found — cannot regenerate app install assets.',
      );
    }

    const view =
      await deps.tenantAppInstallService.regenerateForBusiness(business);
    const result = buildRegenerateTenantAppInstallSummary({ view });

    return success('regenerate_tenant_app_install_qr', result.summary, {
      ...result,
      appInstall: view,
      regenerated: true,
    });
  } catch (err: any) {
    return failure(
      'regenerate_tenant_app_install_qr',
      err?.message ?? 'Could not regenerate tenant app install QR.',
    );
  }
}
