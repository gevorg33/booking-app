import type { CommandResult } from './command-completion.types.js';
import type { CustomerCrmLogicDeps } from './ai-customer-crm.logic.js';
import {
  buildUpdateMyProfileEmailUnsupportedSummary,
  buildUpdateMyProfileMissingValueSummary,
  enrichUpdateMyProfileParamsFromPrompt,
  parseUpdateMyProfileFromPrompt,
} from './ai-update-my-profile.util.js';
import { resolveBusinessSlugFromParamsOrId } from './ai-resolve-business-slug.util.js';

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

function resolveSessionCustomerId(
  params: Record<string, unknown>,
): string | undefined {
  const raw = params.sessionCustomerId ?? params.customerId;
  return typeof raw === 'string' && raw.trim() ? raw.trim() : undefined;
}

export async function handleUpdateMyProfileLogic(
  deps: CustomerCrmLogicDeps,
  businessId: string,
  params: Record<string, unknown>,
  prompt = '',
): Promise<CommandResult> {
  const textPrompt = prompt || String(params._prompt ?? '');
  const enriched = enrichUpdateMyProfileParamsFromPrompt(
    { ...params, _prompt: textPrompt },
    textPrompt,
  );
  // e2e-bug.441 — `params` has to reach the parse. Before this it took only
  // the message, so `enriched` was computed and then never used for any value
  // that got written.
  const parsed = parseUpdateMyProfileFromPrompt(textPrompt, enriched);
  if (!parsed) {
    return failure(
      'update_my_profile',
      'Say what to update on your profile (name, phone, or email).',
      { clarify: true },
    );
  }

  const customerId = resolveSessionCustomerId(enriched);
  if (!customerId) {
    return failure('update_my_profile', 'Sign in to update your profile.', {
      clarify: true,
      missing: ['sessionCustomerId'],
    });
  }

  // Name/phone have a real API (ai-cmd-customer-6.14.3). Email has none, and
  // Account has no profile-edit UI — never navigate to ?section=profile (e2e-bug.40).
  if (parsed.name || parsed.phone) {
    // e2e-bug.82 — resolve slug from businessId when classifier omits params.slug.
    const slug = await resolveBusinessSlugFromParamsOrId(
      deps.businessRepo,
      businessId,
      enriched,
    );
    if (!slug) return failure('update_my_profile', 'Business not found.');
    try {
      const profile = await deps.publicCustomerAuthService.updateMyProfile(
        slug,
        customerId,
        { name: parsed.name, phone: parsed.phone },
      );
      const parts: string[] = [];
      if (parsed.name) parts.push(`name to "${profile.name}"`);
      if (parsed.phone) parts.push(`phone to ${profile.phone}`);
      return success(
        'update_my_profile',
        `Updated your ${parts.join(' and ')}.`,
        { field: parsed.field, profile },
      );
    } catch (err: any) {
      return failure(
        'update_my_profile',
        err?.message ?? 'Could not update your profile.',
        { field: parsed.field },
      );
    }
  }

  if (parsed.field === 'email' || parsed.email) {
    return failure(
      'update_my_profile',
      buildUpdateMyProfileEmailUnsupportedSummary(parsed),
      {
        apiBlockedReason:
          'PATCH me/profile only supports name/phone (email not shipped)',
        field: parsed.field,
        emailUnsupported: true,
        ...(parsed.email ? { email: parsed.email } : {}),
      },
    );
  }

  return failure(
    'update_my_profile',
    buildUpdateMyProfileMissingValueSummary(parsed),
    { clarify: true, field: parsed.field },
  );
}
