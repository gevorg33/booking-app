import type { GuideResponse, GuideStep } from './command-completion.types.js';

/** Strip UI verbs and bullet noise for TTS (ai-guide-1.4.4). */
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

export function interpolateVoiceTemplate(
  template: string,
  values: Record<string, string | undefined>,
): string {
  return template.replace(/\{(\w+)\}/g, (_match, key: string) => {
    const value = values[key]?.trim();
    return value || '';
  }).replace(/\s{2,}/g, ' ').trim();
}

export function resolveGuideStepVoiceSummary(step: GuideStep): string {
  const explicit = step.voiceSummary?.trim();
  if (explicit) return explicit;
  const body = step.body?.trim();
  if (body) return buildVoiceFriendlyFallback(body);
  return step.title?.trim() ?? '';
}

/** Plain-text TTS payload from a product-guide response (ai-guide-1.4.4). */
export function formatGuideVoiceText(
  guide: GuideResponse | null | undefined,
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

export function enrichGuideResponseVoiceSummaries(
  guide: GuideResponse,
): GuideResponse {
  const steps = guide.steps.map((step) => ({
    ...step,
    voiceSummary: resolveGuideStepVoiceSummary(step),
  }));
  const voiceSummary =
    guide.voiceSummary?.trim() ||
    (guide.summary ? buildVoiceFriendlyFallback(guide.summary) : undefined);

  return {
    ...guide,
    voiceSummary,
    steps,
  };
}
