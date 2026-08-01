import { resolveLocale, t } from '../../common/i18n/messages.js';
import type { CommandResult } from './command-completion.types.js';
import {
  assembleHomeScreenWidgetSummary,
  buildExplainHomeScreenWidgetNavigate,
  parseExplainHomeScreenWidgetFromPrompt,
  resolveConsumerHomeScreenWidgetExplainContext,
} from './ai-explain-home-screen-widget.util.js';

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

export async function handleExplainHomeScreenWidgetLogic(
  _businessId: string,
  params: Record<string, unknown>,
  prompt = '',
): Promise<CommandResult> {
  const textPrompt = prompt || String(params._prompt ?? '');
  const locale = resolveLocale(
    typeof params.locale === 'string' ? params.locale : undefined,
  );
  const parsed = parseExplainHomeScreenWidgetFromPrompt(textPrompt);
  if (!parsed) {
    return failure(
      'explain_home_screen_widget',
      // e2e-bug.276 — localize clarify (was English-only under locale:hy|ru).
      t(locale, 'assistant.homeScreenWidgetClarify'),
      { clarify: true },
    );
  }

  const ctx = resolveConsumerHomeScreenWidgetExplainContext(params);
  const summary = assembleHomeScreenWidgetSummary(parsed.aspect, ctx);
  const navigate = buildExplainHomeScreenWidgetNavigate(parsed.aspect);

  return success('explain_home_screen_widget', summary, {
    aspect: parsed.aspect,
    widgetSupported: ctx.widgetSupported,
    platform: ctx.platform,
    widgetAuthed: ctx.widgetAuthed,
    hasNextAppointment: ctx.hasNextAppointment,
    hasQuickRebook: ctx.hasQuickRebook,
    consumerHomeScreenWidget: true,
    ...(navigate ? { navigate } : {}),
  });
}
