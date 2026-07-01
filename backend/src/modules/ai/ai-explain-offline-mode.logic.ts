import type { CommandResult } from './command-completion.types.js';
import {
  assembleOfflineModeSummary,
  parseExplainOfflineModeFromPrompt,
  resolveConsumerOfflineExplainContext,
} from './ai-explain-offline-mode.util.js';

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

export async function handleExplainOfflineModeLogic(
  _businessId: string,
  params: Record<string, unknown>,
  prompt = '',
): Promise<CommandResult> {
  const textPrompt = prompt || String(params._prompt ?? '');
  const parsed = parseExplainOfflineModeFromPrompt(textPrompt);
  if (!parsed) {
    return failure(
      'explain_offline_mode',
      'Ask about offline mode (e.g. "Why does it say offline?" or "Will my booking sync?").',
      { clarify: true },
    );
  }

  const ctx = resolveConsumerOfflineExplainContext(params);
  const summary = assembleOfflineModeSummary(parsed.aspect, ctx);

  return success('explain_offline_mode', summary, {
    aspect: parsed.aspect,
    online: ctx.online,
    queuedCount: ctx.queuedCount,
    fromCache: ctx.fromCache,
    consumerOffline: true,
  });
}
