import type { Repository } from 'typeorm';
import type { Business } from '../business/entities/business.entity.js';
import { readBusinessPrivacySettings } from '../../common/utils/business-compliance.util.js';
import type { CommandResult } from './command-completion.types.js';
import {
  parseExplainGuestCheckoutFieldsFromPrompt,
  type GuestCheckoutFieldsAspect,
  type ParsedExplainGuestCheckoutFields,
} from './ai-explain-guest-checkout-fields.util.js';

export interface GuestCheckoutFieldsLogicDeps {
  businessRepo: Pick<Repository<Business>, 'findOne'>;
}

const FIELD_EXPLANATIONS: Record<
  Exclude<GuestCheckoutFieldsAspect, 'all'>,
  string
> = {
  email:
    'Your email lets the salon send booking confirmations and optional email reminders. Provide email or phone — not both.',
  phone:
    'Your phone lets staff reach you and enables SMS or WhatsApp reminders when you opt in. Provide email or phone — not both. WhatsApp reminders require a valid phone number.',
  name:
    'Your name is required so the salon can identify you on the appointment and on confirmations.',
  guest_vs_account:
    'You can complete checkout as a guest without creating an account. Enter your name plus email or phone. Signing in before checkout is optional; you can create an account after booking to manage future visits.',
  contact_merge:
    'When signed in, checkout pre-fills from your profile — profile email and phone fill gaps over guest fields. Guest bookings made with the same email or phone link to your account when you sign in later. Returning guests with the same contact reuse one customer record instead of duplicating you.',
  reminders:
    'Email, SMS, and WhatsApp reminder toggles on checkout are optional unless the salon requires them. Turn on WhatsApp reminders only when you entered a phone number.',
  consent:
    'Privacy or data-processing consent may be required before you confirm, depending on salon settings. Marketing consent toggles are separate and optional unless the salon configured them as required.',
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

function buildGenericAspectSummary(aspect: GuestCheckoutFieldsAspect): string {
  if (aspect === 'all') {
    return [
      FIELD_EXPLANATIONS.name,
      FIELD_EXPLANATIONS.email,
      FIELD_EXPLANATIONS.guest_vs_account,
      FIELD_EXPLANATIONS.contact_merge,
      FIELD_EXPLANATIONS.reminders,
      FIELD_EXPLANATIONS.consent,
    ].join(' ');
  }
  return FIELD_EXPLANATIONS[aspect];
}

function appendConsentTailoring(
  summary: string,
  privacy: ReturnType<typeof readBusinessPrivacySettings>,
): string {
  const parts = [summary];
  if (privacy.granularConsent.requireAiProcessing) {
    parts.push(
      'This salon requires AI-processing consent on checkout before you confirm.',
    );
  }
  if (privacy.granularConsent.requireThirdPartyIntegrations) {
    parts.push(
      'Third-party integration consent may also appear on the checkout form.',
    );
  }
  return parts.join(' ');
}

function buildAspectSummary(
  parsed: ParsedExplainGuestCheckoutFields,
  privacy: ReturnType<typeof readBusinessPrivacySettings>,
): string {
  const base = buildGenericAspectSummary(parsed.aspect);
  if (parsed.aspect === 'consent' || parsed.aspect === 'all') {
    return appendConsentTailoring(base, privacy);
  }
  return base;
}

export async function handleExplainGuestCheckoutFieldsLogic(
  deps: GuestCheckoutFieldsLogicDeps,
  businessId: string,
  params: Record<string, unknown> = {},
  prompt?: string,
): Promise<CommandResult> {
  const parsed = parseExplainGuestCheckoutFieldsFromPrompt(
    String(prompt ?? params._prompt ?? ''),
    params,
  );
  if (!parsed) {
    return failure(
      'explain_guest_checkout_fields',
      'Ask about guest checkout fields (e.g. "Why do you need my email?" or "Can I book without an account?").',
      {
        clarify: true,
        missing: ['aspect'],
      },
    );
  }

  const business = await deps.businessRepo.findOne({ where: { id: businessId } });
  if (!business) {
    return failure('explain_guest_checkout_fields', 'Business not found.');
  }

  const privacy = readBusinessPrivacySettings(
    (business.settings ?? {}) as Record<string, unknown>,
  );
  const summary = buildAspectSummary(parsed, privacy);

  return success('explain_guest_checkout_fields', summary, {
    aspect: parsed.aspect,
    requireAiProcessingConsent: privacy.granularConsent.requireAiProcessing,
    requireThirdPartyIntegrationsConsent:
      privacy.granularConsent.requireThirdPartyIntegrations,
    cookieBannerEnabled: privacy.cookieBanner.enabled,
  });
}
