import type { CommandResult } from './command-completion.types.js';
import type { CustomerCrmLogicDeps } from './ai-customer-crm.logic.js';
import {
  buildUpdateMyProfileNavigate,
  buildUpdateMyProfileSummary,
  enrichUpdateMyProfileParamsFromPrompt,
  parseUpdateMyProfileFromPrompt,
} from './ai-update-my-profile.util.js';

function resolveSlug(params: Record<string, unknown>): string | undefined {
  const raw = params.slug;
  return typeof raw === 'string' && raw.trim() ? raw.trim() : undefined;
}

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
  _businessId: string,
  params: Record<string, unknown>,
  prompt = '',
): Promise<CommandResult> {
  const textPrompt = prompt || String(params._prompt ?? '');
  const enriched = enrichUpdateMyProfileParamsFromPrompt(
    { ...params, _prompt: textPrompt },
    textPrompt,
  );
  const parsed = parseUpdateMyProfileFromPrompt(textPrompt);
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

  // Name/phone have a real API (ai-cmd-customer-6.14.3); email changes still
  // have no backend endpoint, so they fall back to the navigate handoff below.
  if (parsed.name || parsed.phone) {
    const slug = resolveSlug(enriched);
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

  return success('update_my_profile', buildUpdateMyProfileSummary(parsed), {
    uiOnly: true,
    apiBlockedReason: 'PATCH me/profile only supports name/phone (email not shipped)',
    field: parsed.field,
    ...(parsed.email ? { email: parsed.email } : {}),
    navigate: buildUpdateMyProfileNavigate(parsed),
  });
}
