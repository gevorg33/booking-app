import type { CommandResult } from './command-completion.types.js';
import {
  VOICE_START_LABEL,
  buildExplainVoiceInputGuidance,
  parseExplainVoiceInputFromPrompt,
} from './ai-explain-voice-input.util.js';

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

export async function handleExplainVoiceInputLogic(
  _businessId: string,
  params: Record<string, unknown> = {},
  prompt?: string,
): Promise<CommandResult> {
  const parsed = parseExplainVoiceInputFromPrompt(
    String(prompt ?? params._prompt ?? ''),
    params,
  );
  if (!parsed) {
    return failure(
      'explain_voice_input',
      'Ask about voice input (e.g. "How do I use voice?" or "Mic not working").',
      { clarify: true },
    );
  }

  const { summaryParts, nextSteps, hint } = buildExplainVoiceInputGuidance(
    parsed.aspect,
    parsed.voiceErrorCode,
  );

  return success(
    'explain_voice_input',
    summaryParts.filter(Boolean).join(' '),
    {
      aspect: parsed.aspect,
      hint,
      voiceStartLabel: VOICE_START_LABEL,
      nextSteps,
      ...(parsed.voiceErrorCode
        ? { voiceErrorCode: parsed.voiceErrorCode }
        : {}),
      voiceInputHelp: true,
    },
  );
}
