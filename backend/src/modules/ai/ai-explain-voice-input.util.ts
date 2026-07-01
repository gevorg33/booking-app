import { CUSTOMER_PUBLIC_EXPLAIN_VOICE_INPUT_CLASSIFIER_RULES } from './ai-explain-voice-input.fixtures.js';
import { EXPLAIN_VOICE_INPUT_MULTILINGUAL_SCENARIOS } from './ai-explain-voice-input-multilingual.fixtures.js';
import type { ExplainVoiceInputAspect } from './ai-explain-voice-input.fixtures.js';

export { CUSTOMER_PUBLIC_EXPLAIN_VOICE_INPUT_CLASSIFIER_RULES };

/** Matches consumer/public `voiceStart`. */
export const VOICE_START_LABEL = 'Voice input';

export const VOICE_DENIED_HINT = 'Microphone access was denied.';
export const VOICE_NO_SPEECH_HINT = 'No speech detected. Try again.';
export const VOICE_ERROR_HINT = 'Voice input failed. Try again.';
export const VOICE_UNSUPPORTED_HINT =
  'Voice input is not supported on this device.';

export type VoiceErrorCode =
  | 'unsupported'
  | 'not-allowed'
  | 'no-speech'
  | 'error';

export const EXPLAIN_VOICE_INPUT_INTENTS = ['explain_voice_input'] as const;

export type ExplainVoiceInputIntent =
  (typeof EXPLAIN_VOICE_INPUT_INTENTS)[number];

const SPEAK_REPLY_CUE = new RegExp(
  String.raw`\b(read\s+(?:that|it|the\s+answer)\s+aloud|speak\s+(?:the\s+)?answer|read\s+aloud|text[\s-]?to[\s-]?speech|listen\s+to\s+(?:that|the\s+answer)|tts)\b|կարդալ\s+բարձր|прочитай\s+вслух`,
  'iu',
);

const HOW_TO_USE_CUE = new RegExp(
  String.raw`\b(how\s+(?:do\s+i|to)\s+(?:use\s+)?voice|use\s+voice|talk\s+to\s+(?:the\s+)?(?:booking\s+)?assistant|speak\s+instead\s+of\s+typing|where\s+is\s+(?:the\s+)?(?:microphone|mic)\s+button|enable\s+voice|voice\s+input\s+button)\b|ինչպես\s+օգտագործ.{0,15}ձայն|как\s+пользоваться\s+голос`,
  'iu',
);

const MIC_DENIED_CUE = new RegExp(
  String.raw`\b(microphone\s+access\s+(?:was\s+)?denied|mic\s+(?:access\s+)?denied|not[\s-]allowed|allow\s+microphone|permission\s+denied)\b|թույլտվությունը\s+մերժ|доступ\s+к\s+микрофон`,
  'iu',
);

const NO_SPEECH_CUE = new RegExp(
  String.raw`\bno\s+speech\s+detected|did(?:n't| not)\s+hear|nothing\s+detected\b|խոսք\s+չի\s+հայտնաբեր|речь\s+не\s+распознан`,
  'iu',
);

const UNSUPPORTED_CUE = new RegExp(
  String.raw`\b(voice\s+input\s+is\s+not\s+supported|not\s+supported\s+on\s+this\s+(?:device|browser)|unsupported\s+device)\b|չի\s+աջակց|не\s+поддержива`,
  'iu',
);

const MIC_ERROR_CUE = new RegExp(
  String.raw`\b(mic\s+not\s+working|microphone\s+not\s+working|voice\s+input\s+failed|speech\s+recognition\s+(?:is\s+)?broken|can't\s+use\s+voice|cannot\s+use\s+voice|voice\s+(?:doesn't|does not)\s+work)\b|խոսափող.{0,15}չի\s+աշխատ|микрофон\s+не\s+работ`,
  'iu',
);

function readString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function matchMultilingualScenario(
  prompt: string,
): (typeof EXPLAIN_VOICE_INPUT_MULTILINGUAL_SCENARIOS)[number] | null {
  const trimmed = prompt.trim();
  return (
    EXPLAIN_VOICE_INPUT_MULTILINGUAL_SCENARIOS.find(
      (scenario) => scenario.prompt === trimmed,
    ) ?? null
  );
}

export function parseVoiceErrorCode(
  params: Record<string, unknown> = {},
): VoiceErrorCode | undefined {
  const raw =
    readString(params.voiceErrorCode) ??
    readString(params.voiceError) ??
    readString(params.speechErrorCode);
  if (raw === 'unsupported') return 'unsupported';
  if (raw === 'not-allowed' || raw === 'denied') return 'not-allowed';
  if (raw === 'no-speech') return 'no-speech';
  if (raw === 'error' || raw === 'failed') return 'error';
  return undefined;
}

export function isExplainVoiceInputIntent(
  action: string,
): action is ExplainVoiceInputIntent {
  return (EXPLAIN_VOICE_INPUT_INTENTS as readonly string[]).includes(action);
}

export function parseExplainVoiceInputAspect(
  prompt: string,
  params: Record<string, unknown> = {},
): ExplainVoiceInputAspect {
  const fromParams = readString(params.aspect);
  if (
    fromParams === 'how_to_use' ||
    fromParams === 'mic_denied' ||
    fromParams === 'no_speech' ||
    fromParams === 'mic_error' ||
    fromParams === 'unsupported' ||
    fromParams === 'generic' ||
    fromParams === 'all'
  ) {
    return fromParams;
  }

  const errorCode = parseVoiceErrorCode(params);
  if (errorCode === 'unsupported') return 'unsupported';
  if (errorCode === 'not-allowed') return 'mic_denied';
  if (errorCode === 'no-speech') return 'no_speech';
  if (errorCode === 'error') return 'mic_error';

  if (MIC_DENIED_CUE.test(prompt)) return 'mic_denied';
  if (NO_SPEECH_CUE.test(prompt)) return 'no_speech';
  if (UNSUPPORTED_CUE.test(prompt)) return 'unsupported';
  if (MIC_ERROR_CUE.test(prompt)) return 'mic_error';
  if (HOW_TO_USE_CUE.test(prompt)) return 'how_to_use';
  return 'generic';
}

export function isExplainVoiceInputPrompt(prompt: string): boolean {
  if (matchMultilingualScenario(prompt)) return true;
  if (SPEAK_REPLY_CUE.test(prompt)) return false;

  const text = prompt.trim();
  if (!text) return false;

  if (/^how\s+do\s+i\s+use\s+voice\b/i.test(text)) return true;
  if (/^mic\s+not\s+working\b/i.test(text)) return true;
  if (/\bmicrophone\s+access\s+was\s+denied\b/i.test(text)) return true;
  if (/\bno\s+speech\s+detected\b/i.test(text)) return true;
  if (/\bvoice\s+input\s+failed\b/i.test(text)) return true;
  if (/\bhow\s+do\s+i\s+talk\s+to\s+the\s+booking\s+assistant\b/i.test(text)) {
    return true;
  }
  if (/\bwhere\s+is\s+the\s+microphone\s+button\b/i.test(text)) return true;
  if (/\bvoice\s+input\s+is\s+not\s+supported\b/i.test(text)) return true;
  if (/\bcan(?:not|'t)\s+use\s+voice\b/i.test(text)) return true;
  if (/\bspeech\s+recognition\s+is\s+broken\b/i.test(text)) return true;
  if (/\ballow\s+microphone\s+access\b/i.test(text)) return true;
  if (/\bcan\s+i\s+speak\s+instead\s+of\s+typing\b/i.test(text)) return true;

  return (
    HOW_TO_USE_CUE.test(text) ||
    MIC_DENIED_CUE.test(text) ||
    NO_SPEECH_CUE.test(text) ||
    UNSUPPORTED_CUE.test(text) ||
    MIC_ERROR_CUE.test(text)
  );
}

export function parseExplainVoiceInputFromPrompt(
  prompt: string,
  params: Record<string, unknown> = {},
): { aspect: ExplainVoiceInputAspect; voiceErrorCode?: VoiceErrorCode } | null {
  if (!isExplainVoiceInputPrompt(prompt)) return null;
  const voiceErrorCode = parseVoiceErrorCode(params);
  return {
    aspect: parseExplainVoiceInputAspect(prompt, params),
    ...(voiceErrorCode ? { voiceErrorCode } : {}),
  };
}

export function rescueExplainVoiceInputIntent(
  prompt: string,
  action: string,
): { action: ExplainVoiceInputIntent; rescueReason: string } | null {
  if (isExplainVoiceInputIntent(action)) return null;
  if (!isExplainVoiceInputPrompt(prompt)) return null;
  return {
    action: 'explain_voice_input',
    rescueReason: 'explain_voice_input',
  };
}

export function buildExplainVoiceInputGuidance(
  aspect: ExplainVoiceInputAspect,
  voiceErrorCode?: VoiceErrorCode,
): { summaryParts: string[]; nextSteps: string[]; hint: string } {
  const resolvedAspect =
    voiceErrorCode === 'unsupported'
      ? 'unsupported'
      : voiceErrorCode === 'not-allowed'
        ? 'mic_denied'
        : voiceErrorCode === 'no-speech'
          ? 'no_speech'
          : voiceErrorCode === 'error'
            ? 'mic_error'
            : aspect;

  const nextSteps: string[] = [];
  let hint = VOICE_ERROR_HINT;

  if (resolvedAspect === 'how_to_use') {
    hint = VOICE_START_LABEL;
    return {
      summaryParts: [
        `Tap the microphone icon labeled ${VOICE_START_LABEL} next to the message box.`,
        'Speak your booking request clearly, then review the transcript before sending.',
      ],
      nextSteps: [
        'Hold the mic button, speak, then tap again to stop listening.',
        'Edit the transcript if speech recognition misheard you.',
      ],
      hint,
    };
  }

  if (resolvedAspect === 'mic_denied') {
    hint = VOICE_DENIED_HINT;
    nextSteps.push(
      'Open your browser or phone settings and allow microphone access for this site or app.',
      'Reload the page, then tap Voice input again and choose Allow.',
    );
  } else if (resolvedAspect === 'no_speech') {
    hint = VOICE_NO_SPEECH_HINT;
    nextSteps.push(
      'Move closer to the microphone and speak clearly after tapping Voice input.',
      'Reduce background noise, then tap the mic and try again.',
    );
  } else if (resolvedAspect === 'unsupported') {
    hint = VOICE_UNSUPPORTED_HINT;
    nextSteps.push(
      'On the web, try Chrome or Safari on a device with a working microphone.',
      'You can still type your request in the assistant message box.',
    );
  } else {
    hint = VOICE_ERROR_HINT;
    nextSteps.push(
      'Check your connection, reload the assistant, and tap Voice input again.',
      'If the error persists, type your request instead.',
    );
  }

  return {
    summaryParts: [hint, ...nextSteps.slice(0, 1)],
    nextSteps,
    hint,
  };
}
