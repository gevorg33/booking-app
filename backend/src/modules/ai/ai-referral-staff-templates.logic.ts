import type { Repository } from 'typeorm';
import type { Business } from '../business/entities/business.entity.js';
import type { CommandResult } from './command-completion.types.js';
import { mergeBusinessSettings } from '../../common/utils/merge-business-settings.util.js';
import {
  mergeReferralProgramSettings,
  type ReferralProgramSettings,
} from '../../common/utils/referral-program.util.js';
import {
  normalizeStaffMessageTemplatesSettings,
  readStaffMessageTemplatesSettings,
  type StaffMessageTemplate,
} from '../provider-mobile/provider-staff-message-templates.util.js';

export interface ReferralStaffTemplatesLogicDeps {
  businessRepo: Pick<Repository<Business>, 'findOne' | 'save'>;
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
  details: Record<string, unknown> = {},
): CommandResult {
  return { success: true, action, summary, details };
}

export async function handleConfigureReferralProgramLogic(
  deps: ReferralStaffTemplatesLogicDeps,
  businessId: string,
  params: Record<string, any>,
): Promise<CommandResult> {
  const business = await deps.businessRepo.findOne({
    where: { id: businessId },
  });
  if (!business) {
    return failure('configure_referral_program', 'Business not found.');
  }

  const settings = business.settings as Record<string, unknown> | undefined;
  const current = mergeReferralProgramSettings(settings);

  const patch: Partial<ReferralProgramSettings> = {};
  if (typeof params.enabled === 'boolean') patch.enabled = params.enabled;
  if (
    params.referrerRewardType === 'loyalty_points' ||
    params.referrerRewardType === 'gift_card'
  ) {
    patch.referrerRewardType = params.referrerRewardType;
  }
  if (typeof params.referrerBonusPoints === 'number') {
    patch.referrerBonusPoints = params.referrerBonusPoints;
  }
  if (typeof params.referrerGiftCardAmount === 'number') {
    patch.referrerGiftCardAmount = params.referrerGiftCardAmount;
  }
  if (typeof params.refereeBonusPoints === 'number') {
    patch.refereeBonusPoints = params.refereeBonusPoints;
  }
  if (typeof params.refereePromoCode === 'string') {
    patch.refereePromoCode = params.refereePromoCode;
  }

  if (Object.keys(patch).length === 0) {
    return failure(
      'configure_referral_program',
      'What should I change about the referral program? Provide enabled, referrerRewardType (loyalty_points|gift_card), referrerBonusPoints, referrerGiftCardAmount, refereeBonusPoints, or refereePromoCode.',
      { clarify: true, current },
    );
  }

  const normalized = mergeReferralProgramSettings({
    referralProgram: { ...current, ...patch },
  });

  business.settings = mergeBusinessSettings(settings, {
    referralProgram: normalized,
  });
  await deps.businessRepo.save(business);

  return success(
    'configure_referral_program',
    `Referral program ${normalized.enabled ? 'enabled' : 'disabled'} — referrer reward: ${normalized.referrerRewardType}.`,
    { referralProgram: normalized, previous: current },
  );
}

export async function handleConfigureStaffMessageTemplatesLogic(
  deps: ReferralStaffTemplatesLogicDeps,
  businessId: string,
  params: Record<string, any>,
): Promise<CommandResult> {
  const business = await deps.businessRepo.findOne({
    where: { id: businessId },
  });
  if (!business) {
    return failure('configure_staff_message_templates', 'Business not found.');
  }

  const settings = business.settings as Record<string, unknown> | undefined;
  const current = readStaffMessageTemplatesSettings(settings);

  const hasTemplatesPatch = Array.isArray(params.templates);
  const hasEnabledPatch = typeof params.enabled === 'boolean';

  if (!hasTemplatesPatch && !hasEnabledPatch) {
    return failure(
      'configure_staff_message_templates',
      'What should I change about staff message templates? Provide enabled (true/false) and/or templates (array of {label, body, enabled}) to bulk-replace the list.',
      { clarify: true, current },
    );
  }

  const normalized = normalizeStaffMessageTemplatesSettings({
    enabled: hasEnabledPatch ? params.enabled : current.enabled,
    templates: hasTemplatesPatch
      ? (params.templates as StaffMessageTemplate[])
      : current.templates,
  });

  business.settings = mergeBusinessSettings(settings, {
    staffMessageTemplates: normalized,
  });
  await deps.businessRepo.save(business);

  return success(
    'configure_staff_message_templates',
    `Staff message templates ${normalized.enabled ? 'enabled' : 'disabled'} — ${normalized.templates.length} template(s).`,
    { staffMessageTemplates: normalized, previous: current },
  );
}
