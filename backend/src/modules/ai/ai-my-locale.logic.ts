import type { CommandResult } from './command-completion.types.js';
import type { CustomerCrmLogicDeps } from './ai-customer-crm.logic.js';
import { normalizeRequestedLocale } from './ai-my-locale.util.js';
import { resolveBusinessSlugFromParamsOrId } from './ai-resolve-business-slug.util.js';

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

function resolveSessionCustomerId(
  params: Record<string, unknown>,
): string | undefined {
  const raw = params.sessionCustomerId ?? params.customerId;
  return typeof raw === 'string' && raw.trim() ? raw.trim() : undefined;
}

export async function handleGetMyLocaleLogic(
  deps: CustomerCrmLogicDeps,
  businessId: string,
  params: Record<string, unknown> = {},
): Promise<CommandResult> {
  const customerId = resolveSessionCustomerId(params);
  if (!customerId) {
    return failure('get_my_locale', 'Sign in to check your language setting.', {
      clarify: true,
      missing: ['sessionCustomerId'],
    });
  }

  // e2e-bug.82 — resolve slug from businessId when classifier omits params.slug.
  const slug = await resolveBusinessSlugFromParamsOrId(
    deps.businessRepo,
    businessId,
    params,
  );
  if (!slug) {
    return failure('get_my_locale', 'Business not found.');
  }

  try {
    const view = await deps.publicCustomerAuthService.getPreferredLocale(
      slug,
      customerId,
    );
    return success(
      'get_my_locale',
      `Your preferred language is set to ${view.preferredLocale}.`,
      view,
    );
  } catch (err: any) {
    return failure(
      'get_my_locale',
      err?.message ?? 'Could not read your language setting.',
    );
  }
}

export async function handleUpdateMyLocaleLogic(
  deps: CustomerCrmLogicDeps,
  businessId: string,
  params: Record<string, unknown> = {},
  prompt = '',
): Promise<CommandResult> {
  const customerId = resolveSessionCustomerId(params);
  if (!customerId) {
    return failure(
      'update_my_locale',
      'Sign in to change your language setting.',
      { clarify: true, missing: ['sessionCustomerId'] },
    );
  }

  const slug = await resolveBusinessSlugFromParamsOrId(
    deps.businessRepo,
    businessId,
    params,
  );
  if (!slug) {
    return failure('update_my_locale', 'Business not found.');
  }

  const textPrompt = prompt || String(params._prompt ?? '');
  const requested =
    normalizeRequestedLocale(params.preferredLocale) ??
    normalizeRequestedLocale(params.locale) ??
    normalizeRequestedLocale(textPrompt);
  if (!requested) {
    return failure(
      'update_my_locale',
      'Which language would you like — English, Armenian, or Russian?',
      { clarify: true, missing: ['preferredLocale'] },
    );
  }

  try {
    const view = await deps.publicCustomerAuthService.updatePreferredLocale(
      slug,
      customerId,
      requested,
    );
    return success(
      'update_my_locale',
      `Your language is now set to ${view.preferredLocale}.`,
      view,
    );
  } catch (err: any) {
    return failure(
      'update_my_locale',
      err?.message ?? 'Could not update your language setting.',
      { requestedLocale: requested },
    );
  }
}
