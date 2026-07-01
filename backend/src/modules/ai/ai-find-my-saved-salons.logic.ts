import type { CommandResult } from './command-completion.types.js';
import {
  parseRecentSalonsFromParams,
  matchRecentSalonByHint,
} from './ai-saved-salons.shared.js';
import {
  buildFindMySavedSalonsNavigate,
  buildFindMySavedSalonsSummary,
  isFindMySavedSalonsPrompt,
  parseFindMySavedSalonsFromPrompt,
} from './ai-find-my-saved-salons.util.js';

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

export async function handleFindMySavedSalonsLogic(
  params: Record<string, unknown> = {},
  prompt = '',
): Promise<CommandResult> {
  const textPrompt = prompt || String(params._prompt ?? '');

  if (textPrompt && !isFindMySavedSalonsPrompt(textPrompt)) {
    return failure(
      'find_my_saved_salons',
      'Ask to show your saved or recently visited salons.',
      { clarify: true },
    );
  }

  const parsed = parseFindMySavedSalonsFromPrompt(textPrompt, params);
  if (!parsed) {
    return failure(
      'find_my_saved_salons',
      'Ask for your saved salons or where to find them.',
      { clarify: true },
    );
  }

  const recentSalons = parseRecentSalonsFromParams(params);
  const summary = buildFindMySavedSalonsSummary({
    aspect: parsed.aspect,
    recentSalons,
  });

  return success('find_my_saved_salons', summary, {
    aspect: parsed.aspect,
    recentSalons,
    navigate: buildFindMySavedSalonsNavigate(),
  });
}
