import { extractServiceNamesFromPrompt } from './ai-self-service-booking.util.js';

export function hasMultiServiceDayServicesCue(prompt: string): boolean {
  return extractServiceNamesFromPrompt(prompt).length >= 2;
}

export function hasMultiServiceDayPlanningCue(prompt: string): boolean {
  return (
    /\bfind\s+(?:a\s+)?(?:time|slot|opening)\b/i.test(prompt) ||
    /\bsame\s+(?:afternoon|day|morning|evening|visit)\b/i.test(prompt) ||
    /\bcheck\s+(?:and\s+)?book\b/i.test(prompt) ||
    /\bthen\s+book\b/i.test(prompt) ||
    (/\band\s+book\b/i.test(prompt) &&
      /\b(?:find|same\s+(?:afternoon|day)|check)\b/i.test(prompt))
  );
}
