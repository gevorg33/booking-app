import type { CommandResult } from './command-completion.types.js';
import {
  buildPrivacyDeleteNavigate,
  buildPrivacyDeleteSignInNavigate,
  isPrivacyDeleteCustomerPrompt,
} from './ai-privacy-delete.util.js';

export type PrivacyDeleteLogicDeps = {
  customerPrivacyService: {
    deleteCustomerData: (
      businessId: string,
      customerId: string,
    ) => Promise<void | { deleted: true }>;
  };
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

function resolveSessionCustomerId(
  params: Record<string, unknown>,
): string | undefined {
  const raw = params.sessionCustomerId ?? params.customerId;
  return typeof raw === 'string' && raw.trim() ? raw.trim() : undefined;
}

export async function handlePrivacyDeleteLogic(
  deps: PrivacyDeleteLogicDeps,
  businessId: string,
  params: Record<string, unknown> = {},
  prompt = '',
): Promise<CommandResult> {
  const textPrompt = prompt || String(params._prompt ?? '');

  if (textPrompt && !isPrivacyDeleteCustomerPrompt(textPrompt)) {
    return failure(
      'privacy_delete',
      'Ask to delete or erase your account data.',
      { clarify: true },
    );
  }

  const customerId = resolveSessionCustomerId(params);
  if (!customerId) {
    return failure('privacy_delete', 'Sign in to delete your data.', {
      clarify: true,
      navigate: buildPrivacyDeleteSignInNavigate(),
    });
  }

  await deps.customerPrivacyService.deleteCustomerData(businessId, customerId);

  return success('privacy_delete', 'Your account data has been anonymized.', {
    deleted: true,
    navigate: buildPrivacyDeleteNavigate(),
  });
}
