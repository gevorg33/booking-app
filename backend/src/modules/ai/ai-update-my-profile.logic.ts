import type { CommandResult } from './command-completion.types.js';
import type { CustomerCrmLogicDeps } from './ai-customer-crm.logic.js';
import {
  buildUpdateMyProfileNavigate,
  buildUpdateMyProfileSummary,
  enrichUpdateMyProfileParamsFromPrompt,
  parseUpdateMyProfileFromPrompt,
} from './ai-update-my-profile.util.js';

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
  _deps: CustomerCrmLogicDeps,
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

  return success('update_my_profile', buildUpdateMyProfileSummary(parsed), {
    uiOnly: true,
    apiBlockedReason: 'PATCH me/profile not shipped (ai-cmd-customer-6.5.3)',
    field: parsed.field,
    ...(parsed.name ? { name: parsed.name } : {}),
    ...(parsed.phone ? { phone: parsed.phone } : {}),
    ...(parsed.email ? { email: parsed.email } : {}),
    navigate: buildUpdateMyProfileNavigate(parsed),
  });
}
