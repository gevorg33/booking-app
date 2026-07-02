import type { CommandResult } from './command-completion.types.js';
import {
  buildPrivacyExportNavigate,
  buildPrivacyExportSignInNavigate,
  isPrivacyExportCustomerPrompt,
} from './ai-privacy-export.util.js';

export type PrivacyExportLogicDeps = {
  customerPrivacyService: {
    exportCustomerData: (
      businessId: string,
      customerId: string,
    ) => Promise<unknown>;
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

export async function handlePrivacyExportLogic(
  deps: PrivacyExportLogicDeps,
  businessId: string,
  params: Record<string, unknown> = {},
  prompt = '',
): Promise<CommandResult> {
  const textPrompt = prompt || String(params._prompt ?? '');

  if (textPrompt && !isPrivacyExportCustomerPrompt(textPrompt)) {
    return failure(
      'privacy_export',
      'Ask to export or download your personal data.',
      { clarify: true },
    );
  }

  const customerId = resolveSessionCustomerId(params);
  if (!customerId) {
    return failure('privacy_export', 'Sign in to export your data.', {
      clarify: true,
      navigate: buildPrivacyExportSignInNavigate(),
    });
  }

  const data = await deps.customerPrivacyService.exportCustomerData(
    businessId,
    customerId,
  );

  return success('privacy_export', 'Your data export is ready.', {
    export: data,
    navigate: buildPrivacyExportNavigate(),
  });
}
