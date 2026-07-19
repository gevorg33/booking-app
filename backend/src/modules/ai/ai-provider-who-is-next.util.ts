import { PROVIDER_WHO_IS_NEXT_PROMPT_SCENARIOS } from './ai-provider-who-is-next.fixtures.js';

export function isWhoIsNextPrompt(prompt: string): boolean {
  const lower = prompt.toLowerCase();

  if (/across\s+the\s+team|all\s+providers/.test(lower)) return false;
  // "ready for/to see the next client" is mark_ready_now, not a listing query.
  if (/\bready\b/.test(lower)) return false;
  if (/պատրաստ|готов/iu.test(prompt)) return false;

  if (
    /\bwho'?s\s+(?:my\s+)?next\b|\bwho\s+is\s+next\b|\bnext\s+(?:appointment|client|booking)\b|\bwho\s+do\s+i\s+have\s+next\b|\bwho'?s\s+up\s+next\b|\bwhat'?s\s+my\s+next\s+(?:appointment|booking)\b/i.test(
      lower,
    )
  ) {
    return true;
  }

  if (/հաջորդը|հաջորդ\s+հաճախորդ/iu.test(prompt)) return true;
  if (/кто\s+(?:мой\s+)?следующ|следующ(?:ий|ая)?\s+клиент/iu.test(prompt)) {
    return true;
  }

  return PROVIDER_WHO_IS_NEXT_PROMPT_SCENARIOS.some(
    (scenario) => scenario.prompt === prompt,
  );
}

export function rescueWhoIsNextIntent(
  prompt: string,
  action: string,
  params: Record<string, unknown> = {},
): {
  action: 'show_appointments';
  rescueReason: string;
  params: Record<string, unknown>;
} | null {
  if (!isWhoIsNextPrompt(prompt)) return null;
  return {
    action: 'show_appointments',
    rescueReason: 'who_is_next',
    params: {
      ...params,
      statusFilter: 'upcoming',
      nextOnly: true,
    },
  };
}
