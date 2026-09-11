import type { Repository } from 'typeorm';
import type {
  EntityReader,
} from './ai-logic-repo.types.js';
import type { Business } from '../business/entities/business.entity.js';
import { readBusinessPrivacySettings } from '../../common/utils/business-compliance.util.js';
import type { CommandResult } from './command-completion.types.js';
import {
  buildFixCheckoutValidationErrorNavigate,
  parseFixCheckoutValidationErrorFromPrompt,
  type CheckoutValidationErrorAspect,
  type ParsedFixCheckoutValidationError,
} from './ai-fix-checkout-validation-error.util.js';

export interface FixCheckoutValidationErrorLogicDeps {
  businessRepo: EntityReader<Business>;
}

const TROUBLESHOOTING: Record<
  Exclude<CheckoutValidationErrorAspect, 'all'>,
  string
> = {
  email:
    'Checkout needs your name plus email or phone — not both contact methods. If you are signed in, profile and guest fields merge: an empty or invalid email in the visible field can still trigger "Enter an email or phone number" even when profile data appears elsewhere. Expand contact details, tap the email field, and enter a full address like name@example.com with no leading or trailing spaces.',
  phone:
    'Phone must include enough digits for your country (country code included). Signed-in checkout merges profile and guest phone — whitespace-only values fail validation. Expand contact details and re-enter the phone field, or provide a valid email instead.',
  name: 'Name is always required. Collapsed contact sections can hide an empty or whitespace-only name field. Expand personal information and enter your full name before confirming.',
  contact_or:
    'Checkout validates merged contact: name plus email or phone. If both contact fields look filled, verify email is a complete address and phone has enough digits. Signed-in users still need a valid merged result — profile gaps do not count unless the checkout field or profile supplies a valid value.',
  profile_merge:
    'Signed-in checkout merges profile email/phone with what you type — profile values fill gaps, but empty profile plus empty guest field still fails. Update the visible checkout email or phone field, or sign out to enter fresh guest contact.',
  consent:
    'Some salons require privacy or data-processing consent before confirm. Scroll to the consent checkboxes at the bottom of checkout and accept required items.',
  compact_hidden:
    'Contact fields may collapse when they look complete. If confirm still fails, expand personal information and verify name plus email or phone are fully valid — not partial or whitespace-only.',
};

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

function buildAspectSummary(
  parsed: ParsedFixCheckoutValidationError,
  privacy: ReturnType<typeof readBusinessPrivacySettings>,
): string {
  const base =
    parsed.aspect === 'all'
      ? [
          TROUBLESHOOTING.name,
          TROUBLESHOOTING.contact_or,
          TROUBLESHOOTING.profile_merge,
          TROUBLESHOOTING.compact_hidden,
        ].join(' ')
      : TROUBLESHOOTING[parsed.aspect];

  const tail =
    parsed.aspect === 'consent' || parsed.aspect === 'all'
      ? privacy.granularConsent.requireAiProcessing
        ? ' This salon may also require AI-processing consent on checkout.'
        : ''
      : '';

  return `${base}${tail} Ask "Why do you need my email?" for full field rules.`;
}

export async function handleFixCheckoutValidationErrorLogic(
  deps: FixCheckoutValidationErrorLogicDeps,
  businessId: string,
  params: Record<string, unknown> = {},
  prompt?: string,
): Promise<CommandResult> {
  const parsed = parseFixCheckoutValidationErrorFromPrompt(
    String(prompt ?? params._prompt ?? ''),
    params,
  );
  if (!parsed) {
    return failure(
      'fix_checkout_validation_error',
      'Describe the checkout validation error (e.g. "It says enter email but I filled it in").',
      {
        clarify: true,
        missing: ['aspect'],
      },
    );
  }

  const business = await deps.businessRepo.findOne({
    where: { id: businessId },
  });
  if (!business) {
    return failure('fix_checkout_validation_error', 'Business not found.');
  }

  const privacy = readBusinessPrivacySettings(
    (business.settings ?? {}) as Record<string, unknown>,
  );
  const summary = buildAspectSummary(parsed, privacy);
  const navigate = buildFixCheckoutValidationErrorNavigate(
    parsed.aspect,
    params,
  );

  return success('fix_checkout_validation_error', summary, {
    aspect: parsed.aspect,
    navigate,
    fieldHints: navigate.fieldHints,
    requireAiProcessingConsent: privacy.granularConsent.requireAiProcessing,
    requireThirdPartyIntegrationsConsent:
      privacy.granularConsent.requireThirdPartyIntegrations,
  });
}
