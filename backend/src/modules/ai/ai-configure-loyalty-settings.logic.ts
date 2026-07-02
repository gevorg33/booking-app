import type { Repository } from 'typeorm';
import type { Business } from '../business/entities/business.entity.js';
import type { PlanEntitlementsService } from '../billing/plan-entitlements.service.js';
import {
  getEarnPercentCashback,
  getLoyaltySettingsResponse,
} from '../loyalty/loyalty-settings.util.js';
import type { CommandResult } from './command-completion.types.js';
import { parseConfigureLoyaltySettingsFromPrompt } from './ai-configure-loyalty-settings.util.js';

export interface ConfigureLoyaltySettingsLogicDeps {
  businessRepo: Repository<Business>;
  planEntitlementsService: PlanEntitlementsService;
}

const NAVIGATE = {
  path: '/dashboard/monetization',
  label: 'Open Monetization → Loyalty',
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

function hasChanges(
  parsed: ReturnType<typeof parseConfigureLoyaltySettingsFromPrompt>,
): boolean {
  if (!parsed) return false;
  return (
    parsed.earnPercentCashback != null ||
    parsed.enabled != null ||
    (parsed.earnExcludedServiceIds?.length ?? 0) > 0
  );
}

export async function handleConfigureLoyaltySettingsLogic(
  deps: ConfigureLoyaltySettingsLogicDeps,
  businessId: string,
  params: Record<string, unknown> = {},
  prompt?: string,
): Promise<CommandResult> {
  const effectivePrompt = String(prompt ?? params._prompt ?? '');
  const parsed = parseConfigureLoyaltySettingsFromPrompt(
    effectivePrompt,
    params,
  );

  if (!parsed) {
    return failure(
      'configure_loyalty_settings',
      'Ask to configure loyalty settings (e.g. "Set loyalty earn rate to 10%" or "Enable loyalty program").',
      {
        clarify: true,
        missing: ['earnPercentCashback', 'enabled'],
        navigate: NAVIGATE,
      },
    );
  }

  if (!hasChanges(parsed)) {
    return failure(
      'configure_loyalty_settings',
      'What should I change — earn rate (e.g. 10%) or enable/disable the loyalty program?',
      {
        clarify: true,
        missing: ['earnPercentCashback', 'enabled'],
        navigate: NAVIGATE,
      },
    );
  }

  try {
    await deps.planEntitlementsService.assertFeature(businessId, 'loyalty');

    const business = await deps.businessRepo.findOne({
      where: { id: businessId },
    });
    if (!business) {
      return failure('configure_loyalty_settings', 'Business not found.', {
        navigate: NAVIGATE,
      });
    }

    const existing =
      (business.settings?.loyalty as Record<string, unknown> | undefined) ?? {};
    const loyalty: Record<string, unknown> = { ...existing };

    if (parsed.earnPercentCashback != null) {
      loyalty.earnPercentCashback = parsed.earnPercentCashback;
    }
    if (parsed.enabled != null) {
      loyalty.enabled = parsed.enabled;
    }
    if (parsed.earnExcludedServiceIds != null) {
      loyalty.earnExcludedServiceIds = parsed.earnExcludedServiceIds;
    }

    business.settings = {
      ...(business.settings || {}),
      loyalty,
    };
    await deps.businessRepo.save(business);

    const settings = getLoyaltySettingsResponse(business.settings);
    const enabled =
      (business.settings.loyalty as Record<string, unknown> | undefined)
        ?.enabled !== false;
    const parts: string[] = [];
    if (parsed.enabled != null) {
      parts.push(
        enabled ? 'enabled loyalty program' : 'disabled loyalty program',
      );
    }
    if (parsed.earnPercentCashback != null) {
      parts.push(`set earn rate to ${settings.earnPercentCashback}%`);
    }
    if (parsed.earnExcludedServiceIds?.length) {
      parts.push(
        `updated excluded services (${parsed.earnExcludedServiceIds.length})`,
      );
    }
    const summary =
      parts.length > 0
        ? `Updated loyalty settings — ${parts.join(', ')}.`
        : `Updated loyalty settings — customers earn ${settings.earnPercentCashback}% back as points.`;

    return success('configure_loyalty_settings', summary, {
      settings: {
        ...settings,
        enabled,
        earnPercentCashback: getEarnPercentCashback(business.settings),
      },
      navigate: NAVIGATE,
    });
  } catch (err: any) {
    return failure(
      'configure_loyalty_settings',
      err?.message || 'Could not update loyalty settings.',
      { navigate: NAVIGATE },
    );
  }
}
