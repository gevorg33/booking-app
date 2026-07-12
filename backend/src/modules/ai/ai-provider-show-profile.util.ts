import { PROVIDER_SHOW_PROFILE_PROMPT_SCENARIOS } from './ai-provider-show-profile.fixtures.js';

function containsArmenianScript(text: string): boolean {
  return /[԰-֏]/.test(text);
}

function containsCyrillicScript(text: string): boolean {
  return /[Ѐ-ӿ]/.test(text);
}

export function isShowProviderProfilePrompt(prompt: string): boolean {
  if (
    PROVIDER_SHOW_PROFILE_PROMPT_SCENARIOS.some(
      (scenario) => scenario.prompt === prompt,
    )
  ) {
    return true;
  }

  const lower = prompt.toLowerCase();
  if (/\b(?:change|update|edit|set)\b/.test(lower)) return false;

  if (containsArmenianScript(prompt) || containsCyrillicScript(prompt)) {
    return false;
  }

  return (
    /\b(?:what'?s|what\s+is)\s+my\s+(?:current\s+)?(?:title|avatar|profile)\b/.test(
      lower,
    ) ||
    /\bshow\s+my\s+profile\b/.test(lower) ||
    /\bwhat\s+avatar\s+am\s+i\s+using\b/.test(lower) ||
    /\bwhat'?s\s+on\s+my\s+(?:provider\s+)?profile\b/.test(lower)
  );
}

export function rescueShowProviderProfileIntent(
  prompt: string,
  action: string,
): { action: 'show_provider_profile'; rescueReason: string } | null {
  if (action === 'show_provider_profile') return null;
  if (!isShowProviderProfilePrompt(prompt)) return null;
  return {
    action: 'show_provider_profile',
    rescueReason: 'show_provider_profile',
  };
}
