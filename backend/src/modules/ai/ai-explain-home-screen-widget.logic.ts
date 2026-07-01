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
  const parsed = parseExplainHomeScreenWidgetFromPrompt(textPrompt);
  if (!parsed) {
    return failure(
      'explain_home_screen_widget',
      'Ask about the home screen widget (e.g. "Add next appointment to home screen" or "What does the widget show?").',
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
