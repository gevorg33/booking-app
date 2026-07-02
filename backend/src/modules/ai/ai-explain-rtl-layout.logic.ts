import type { CommandResult } from './command-completion.types.js';
import {
  ADOPTION_A11Y_STYLESHEET,
  buildExplainRtlLayoutGuidance,
  parseExplainRtlLayoutFromPrompt,
} from './ai-explain-rtl-layout.util.js';

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

export async function handleExplainRtlLayoutLogic(
  _businessId: string,
  params: Record<string, unknown> = {},
  prompt?: string,
): Promise<CommandResult> {
  const parsed = parseExplainRtlLayoutFromPrompt(
    String(prompt ?? params._prompt ?? ''),
    params,
  );
  if (!parsed) {
    return failure(
      'explain_rtl_layout',
      'Ask about reading direction or RTL layout (e.g. "Why is text on the right?" or "What is RTL?").',
      { clarify: true },
    );
  }

  const { summaryParts, nextSteps, hint } = buildExplainRtlLayoutGuidance(
    parsed.aspect,
    parsed.documentDirection,
    parsed.locale,
  );

  return success('explain_rtl_layout', summaryParts.filter(Boolean).join(' '), {
    aspect: parsed.aspect,
    hint,
    documentDirection: parsed.documentDirection,
    locale: parsed.locale,
    adoptionA11yStylesheet: ADOPTION_A11Y_STYLESHEET,
    nextSteps,
    rtlLayoutHelp: true,
  });
}
