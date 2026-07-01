import type { CommandResult } from './command-completion.types.js';
import {
  handleGetManageLinkLogic,
  type GetManageLinkLogicDeps,
} from './ai-get-manage-link.logic.js';
import {
  isRecoverLostManageLinkPrompt,
  parseRecoverLostManageLinkFromPrompt,
} from './ai-recover-lost-manage-link.util.js';

function failure(
  action: string,
  summary: string,
  details?: Record<string, unknown>,
): CommandResult {
  return { success: false, action, summary, details: details ?? {} };
}

function remapAction(result: CommandResult): CommandResult {
  if (result.action === 'get_manage_link') {
    return { ...result, action: 'recover_lost_manage_link' };
  }
  return result;
}

export async function handleRecoverLostManageLinkLogic(
  deps: GetManageLinkLogicDeps,
  businessId: string,
  params: Record<string, unknown> = {},
  prompt = '',
): Promise<CommandResult> {
  const textPrompt = prompt || String(params._prompt ?? '');

  if (textPrompt && !isRecoverLostManageLinkPrompt(textPrompt)) {
    return failure(
      'recover_lost_manage_link',
      'Say you lost your confirmation email or give the email or phone used when booking so we can resend your manage link.',
      { clarify: true },
    );
  }

  const parsed = parseRecoverLostManageLinkFromPrompt(textPrompt, params);
  if (!parsed) {
    return failure(
      'recover_lost_manage_link',
      'Provide the email or phone from your booking so we can resend your manage link.',
      { clarify: true, missing: ['email', 'phone'] },
    );
  }

  const mergedParams = {
    ...params,
    ...parsed,
    guestLookup: true,
    _prompt: textPrompt,
  };

  return remapAction(
    await handleGetManageLinkLogic(deps, businessId, mergedParams, textPrompt),
  );
}
