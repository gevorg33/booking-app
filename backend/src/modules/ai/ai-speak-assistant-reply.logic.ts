import type { CommandResult } from './command-completion.types.js';
import {
  SPEAK_REPLY_LABEL,
  buildSpeakAssistantReplySummary,
  parseSpeakAssistantReplyFromPrompt,
  resolveLastAssistantReply,
} from './ai-speak-assistant-reply.util.js';

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

export async function handleSpeakAssistantReplyLogic(
  _businessId: string,
  params: Record<string, unknown> = {},
  prompt?: string,
): Promise<CommandResult> {
  const parsed = parseSpeakAssistantReplyFromPrompt(
    String(prompt ?? params._prompt ?? ''),
    params,
  );
  if (!parsed) {
    return failure(
      'speak_assistant_reply',
      'Ask to hear the last answer (e.g. "Read that aloud" or "Speak the answer").',
      { clarify: true },
    );
  }

  const speakText = resolveLastAssistantReply(params);
  if (!speakText) {
    return failure(
      'speak_assistant_reply',
      buildSpeakAssistantReplySummary(parsed.aspect, false),
      {
        aspect: parsed.aspect,
        clarify: true,
        noAssistantReply: true,
        speakReplyLabel: SPEAK_REPLY_LABEL,
      },
    );
  }

  return success(
    'speak_assistant_reply',
    buildSpeakAssistantReplySummary(parsed.aspect, true),
    {
      aspect: parsed.aspect,
      speakText,
      speakReplyLabel: SPEAK_REPLY_LABEL,
      clientAction: 'speakAssistantReply',
      ttsRequested: true,
    },
  );
}
