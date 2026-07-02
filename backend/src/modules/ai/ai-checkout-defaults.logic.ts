import {
  applyPublicPaymentSettingsToBusinessSettings,
  mergePublicPaymentSettingsPatch,
  resolvePublicPaymentSettings,
} from '../../common/utils/customer-self-service.util.js';
import { PrepaymentMode } from '../service/entities/service.entity.js';
import type { Business } from '../business/entities/business.entity.js';
import type { Repository } from 'typeorm';
import type { CommandResult } from './command-completion.types.js';
import {
  describeCheckoutDefaultPrepayment,
  parseConfigureCheckoutDefaultsFromPrompt,
} from './ai-checkout-defaults.util.js';

export interface ConfigureCheckoutDefaultsLogicDeps {
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

function buildNavigate(path: string, label?: string) {
  return { path, ...(label ? { label } : {}) };
}

export async function handleConfigureCheckoutDefaultsLogic(
  deps: ConfigureCheckoutDefaultsLogicDeps,
  businessId: string,
  params: Record<string, unknown> = {},
  prompt?: string,
): Promise<CommandResult> {
  const parsed = parseConfigureCheckoutDefaultsFromPrompt(
    String(prompt ?? params._prompt ?? ''),
    params,
  );
  if (!parsed) {
    return failure(
      'configure_checkout_defaults',
      'Specify checkout defaults (e.g. "Set checkout defaults: allow cash at venue and 50% prepayment for new services").',
      {
        clarify: true,
        missing: ['acceptCashPayments', 'defaultServicePrepaymentMode'],
      },
    );
  }

  const business = await deps.businessRepo.findOne({
    where: { id: businessId },
  });
  if (!business) {
    return failure('configure_checkout_defaults', 'Business not found.');
  }

  const current = resolvePublicPaymentSettings(business.settings ?? {});
  const patch: Parameters<typeof mergePublicPaymentSettingsPatch>[1] = {};

  if (parsed.acceptCashPayments !== undefined) {
    patch.acceptCashPayments = parsed.acceptCashPayments;
  }
  if (parsed.defaultServicePrepaymentMode !== undefined) {
    patch.defaultServicePrepaymentMode = parsed.defaultServicePrepaymentMode;
    if (parsed.defaultServicePrepaymentMode === PrepaymentMode.DEPOSIT) {
      patch.defaultServiceDepositPercent =
        parsed.defaultServiceDepositPercent ?? null;
    }
  }

  const next = mergePublicPaymentSettingsPatch(current, patch);
  business.settings = applyPublicPaymentSettingsToBusinessSettings(
    business.settings ?? {},
    next,
  );
  await deps.businessRepo.save(business);

  const parts: string[] = [];
  if (parsed.acceptCashPayments !== undefined) {
    parts.push(
      parsed.acceptCashPayments
        ? 'Cash pay-at-venue enabled for public checkout'
        : 'Cash pay-at-venue disabled for public checkout',
    );
  }
  if (parsed.defaultServicePrepaymentMode !== undefined) {
    parts.push(
      `New services default to ${describeCheckoutDefaultPrepayment(
        parsed.defaultServicePrepaymentMode,
        next.defaultServiceDepositPercent,
      )}`,
    );
  }

  const navigate =
    parsed.acceptCashPayments !== undefined &&
    parsed.defaultServicePrepaymentMode !== undefined
      ? buildNavigate('/dashboard/billing', 'Open Billing & checkout defaults')
      : parsed.acceptCashPayments !== undefined
        ? buildNavigate('/dashboard/billing', 'Open Billing')
        : buildNavigate('/dashboard/services', 'Open Services');

  return success(
    'configure_checkout_defaults',
    parts.length
      ? `Checkout defaults updated: ${parts.join('; ')}.`
      : 'Checkout defaults updated.',
    {
      acceptCashPayments: next.acceptCashPayments,
      ...(next.defaultServicePrepaymentMode
        ? { defaultServicePrepaymentMode: next.defaultServicePrepaymentMode }
        : {}),
      ...(next.defaultServiceDepositPercent !== undefined
        ? { defaultServiceDepositPercent: next.defaultServiceDepositPercent }
        : {}),
      navigate,
    },
  );
}
