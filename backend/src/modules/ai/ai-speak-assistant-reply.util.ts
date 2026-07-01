import { CUSTOMER_PUBLIC_SPEAK_ASSISTANT_REPLY_CLASSIFIER_RULES } from './ai-speak-assistant-reply.fixtures.js';
import { SPEAK_ASSISTANT_REPLY_MULTILINGUAL_SCENARIOS } from './ai-speak-assistant-reply-multilingual.fixtures.js';
import type { SpeakAssistantReplyAspect } from './ai-speak-assistant-reply.fixtures.js';
import { isExplainVoiceInputPrompt } from './ai-explain-voice-input.util.js';

export { CUSTOMER_PUBLIC_SPEAK_ASSISTANT_REPLY_CLASSIFIER_RULES };

/** Matches consumer/public `speakReply`. */
export const SPEAK_REPLY_LABEL = 'Listen';

export const SPEAK_ASSISTANT_REPLY_INTENTS = ['speak_assistant_reply'] as const;

export type SpeakAssistantReplyIntent =
  (typeof SPEAK_ASSISTANT_REPLY_INTENTS)[number];

export type ConversationTurn = {
  role: 'user' | 'assistant';
  content: string;
};

const READ_ALOUD_CUE = new RegExp(
  String.raw`\b(read\s+(?:that|it|the\s+(?:answer|reply|last\s+message))\s+(?:aloud|out\s+loud)|read\s+aloud|speak\s+(?:the\s+)?(?:answer|reply|that)|listen\s+to\s+(?:that|the\s+answer|the\s+reply)|text[\s-]?to[\s-]?speech|\btts\b|can\s+you\s+read\s+(?:the\s+)?reply)\b|կարդալ\s+բարձր|լսել\s+պատասխան|прочитай\s+вслух|озвуч`,
  'iu',
);

const REPEAT_CUE = new RegExp(
  String.raw`\b(say\s+that\s+again|repeat\s+(?:what\s+you\s+said|that|the\s+answer)|say\s+again)\b|կրկին\s+աս|повтори\s+ответ`,
  'iu',
);

function readString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function matchMultilingualScenario(
  prompt: string,
): (typeof SPEAK_ASSISTANT_REPLY_MULTILINGUAL_SCENARIOS)[number] | null {
  const trimmed = prompt.trim();
  return (
    SPEAK_ASSISTANT_REPLY_MULTILINGUAL_SCENARIOS.find(
      (scenario) => scenario.prompt === trimmed,
    ) ?? null
  );
}

export function parseConversationHistory(
  params: Record<string, unknown> = {},
): ConversationTurn[] {
  const raw =
    params.conversationHistory ?? params.history ?? params.messages ?? null;
  if (!Array.isArray(raw)) return [];

  return raw
    .filter(
      (entry): entry is ConversationTurn =>
        !!entry &&
        typeof entry === 'object' &&
        (entry.role === 'user' || entry.role === 'assistant') &&
        typeof entry.content === 'string' &&
        entry.content.trim().length > 0,
    )
    .map((entry) => ({
      role: entry.role,
      content: entry.content.trim(),
    }));
}

export function resolveLastAssistantReply(
  params: Record<string, unknown> = {},
): string | undefined {
  const direct =
    readString(params.lastAssistantReply) ??
    readString(params.assistantReply) ??
    readString(params.lastAssistantMessage);
  if (direct) return direct;

  const history = parseConversationHistory(params);
  for (let index = history.length - 1; index >= 0; index -= 1) {
    const turn = history[index];
    if (turn.role === 'assistant' && turn.content) {
      return turn.content;
    }
  }
  return undefined;
}

export function isSpeakAssistantReplyIntent(
  action: string,
): action is SpeakAssistantReplyIntent {
  return (SPEAK_ASSISTANT_REPLY_INTENTS as readonly string[]).includes(action);
}

export function parseSpeakAssistantReplyAspect(
  prompt: string,
  params: Record<string, unknown> = {},
): SpeakAssistantReplyAspect {
  const fromParams = readString(params.aspect);
  if (
    fromParams === 'read_aloud' ||
    fromParams === 'repeat' ||
    fromParams === 'generic'
  ) {
    return fromParams;
  }
  if (REPEAT_CUE.test(prompt)) return 'repeat';
  if (READ_ALOUD_CUE.test(prompt)) return 'read_aloud';
  return 'generic';
}

export function isSpeakAssistantReplyPrompt(prompt: string): boolean {
  if (isExplainVoiceInputPrompt(prompt)) return false;
  if (matchMultilingualScenario(prompt)) return true;

  const text = prompt.trim();
  if (!text) return false;

  if (/^read\s+that\s+aloud\b/i.test(text)) return true;
  if (/^speak\s+the\s+answer\b/i.test(text)) return true;
  if (/^read\s+it\s+aloud\b/i.test(text)) return true;
  if (/^say\s+that\s+again\b/i.test(text)) return true;
  if (/^listen\s+to\s+the\s+answer\b/i.test(text)) return true;
  if (/\bcan\s+you\s+read\s+the\s+reply\b/i.test(text)) return true;
  if (/\btext\s+to\s+speech\b/i.test(text)) return true;
  if (/^repeat\s+what\s+you\s+said\b/i.test(text)) return true;
  if (/\bread\s+the\s+last\s+message\s+aloud\b/i.test(text)) return true;
  if (/^speak\s+that\s+reply\b/i.test(text)) return true;
  if (/^tts\s+please\b/i.test(text)) return true;
  if (/\bread\s+that\s+answer\s+out\s+loud\b/i.test(text)) return true;

  return READ_ALOUD_CUE.test(text) || REPEAT_CUE.test(text);
}

export function parseSpeakAssistantReplyFromPrompt(
  prompt: string,
  params: Record<string, unknown> = {},
): { aspect: SpeakAssistantReplyAspect; speakText?: string } | null {
  if (!isSpeakAssistantReplyPrompt(prompt)) return null;
  const speakText = resolveLastAssistantReply(params);
  return {
    aspect: parseSpeakAssistantReplyAspect(prompt, params),
    ...(speakText ? { speakText } : {}),
  };
}

export function rescueSpeakAssistantReplyIntent(
  prompt: string,
  action: string,
): { action: SpeakAssistantReplyIntent; rescueReason: string } | null {
  if (isSpeakAssistantReplyIntent(action)) return null;
  if (!isSpeakAssistantReplyPrompt(prompt)) return null;
  return {
    action: 'speak_assistant_reply',
    rescueReason: 'speak_assistant_reply',
  };
}

export function buildSpeakAssistantReplySummary(
  aspect: SpeakAssistantReplyAspect,
  hasReply: boolean,
): string {
  if (!hasReply) {
    return 'There is no assistant reply to read yet. Ask a question first, then say "Read that aloud".';
  }
  if (aspect === 'repeat') {
    return `Repeating the last answer aloud (${SPEAK_REPLY_LABEL}).`;
  }
  return `Reading the last answer aloud (${SPEAK_REPLY_LABEL}).`;
}
