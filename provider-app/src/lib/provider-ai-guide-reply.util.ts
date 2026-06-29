import type { AiGuideResponse, AiGuideStep } from './ai-client.types';

export function buildVoiceFriendlyFallback(text: string): string {
  return text
    .replace(/\bTap\b/g, 'Open')
    .replace(/\bSwipe\b/g, 'Confirm')
    .replace(/[•·]/g, '.')
    .replace(/\s*\n+\s*/g, '. ')
    .replace(/\s{2,}/g, ' ')
    .replace(/\.(\s*\.)+/g, '.')
    .trim();
}

export function resolveGuideStepVoiceSummary(step: AiGuideStep): string {
  return step.voiceSummary?.trim() || buildVoiceFriendlyFallback(step.body);
}

/** Plain-text TTS payload from a product-guide response (ai-guide-1.4.4). */
export function formatGuideVoiceText(
  guide: AiGuideResponse | null | undefined,
  fallbackSummary?: string,
): string {
  const summary =
    guide?.voiceSummary?.trim() ||
    guide?.summary?.trim() ||
    fallbackSummary?.trim() ||
    '';
  if (!guide?.steps?.length) return summary;

  const stepParts = guide.steps.map((step, index) => {
    const voice = resolveGuideStepVoiceSummary(step);
    if (guide.steps.length === 1) return voice;
    return `Step ${index + 1}. ${voice}`;
  });

  return summary ? `${summary} ${stepParts.join(' ')}` : stepParts.join(' ');
}

export function resolveAssistantSpeakText(input: {
  text?: string;
  summary?: string;
  guide?: AiGuideResponse | null;
  voiceSummary?: string;
}): string {
  if (input.voiceSummary?.trim()) return input.voiceSummary.trim();
  if (input.guide) return formatGuideVoiceText(input.guide, input.summary ?? input.text);
  return input.summary?.trim() || input.text?.trim() || '';
}
