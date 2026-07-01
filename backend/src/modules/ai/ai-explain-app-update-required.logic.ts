import type { CommandResult } from './command-completion.types.js';
import {
  assembleAppUpdateRequiredSummary,
  parseExplainAppUpdateRequiredFromPrompt,
  resolveConsumerAppUpdateExplainContext,
  shouldDismissConsumerAppUpdateNudge,
} from './ai-explain-app-update-required.util.js';

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

export async function handleExplainAppUpdateRequiredLogic(
  _businessId: string,
  params: Record<string, unknown>,
  prompt = '',
): Promise<CommandResult> {
  const textPrompt = prompt || String(params._prompt ?? '');
  const parsed = parseExplainAppUpdateRequiredFromPrompt(textPrompt);
  if (!parsed) {
    return failure(
      'explain_app_update_required',
      'Ask about the app update gate (e.g. "Why must I update the app?" or "Skip this update").',
      { clarify: true },
    );
  }

  const ctx = resolveConsumerAppUpdateExplainContext(params);
  const summary = assembleAppUpdateRequiredSummary(parsed.aspect, ctx);
  const dismissNudge = shouldDismissConsumerAppUpdateNudge(parsed.aspect, ctx);

  return success('explain_app_update_required', summary, {
    aspect: parsed.aspect,
    currentVersion: ctx.currentVersion,
    blocked: ctx.blocked,
    blockedReason: ctx.blockedReason,
    nudgeVisible: ctx.nudgeVisible,
    nudgeDismissed: ctx.nudgeDismissed,
    minSupportedVersion: ctx.config?.minSupportedVersion ?? null,
    latestVersion: ctx.config?.latestVersion ?? null,
    storeUrl: ctx.config?.storeUrl ?? null,
    consumerAppGate: true,
    ...(dismissNudge ? { clientAction: 'dismissConsumerAppUpdateNudge' } : {}),
  });
}
