import { PROVIDER_MARK_VISIT_IN_PROGRESS_PROMPT_SCENARIOS } from './ai-provider-mark-visit-in-progress.fixtures.js';

function containsArmenianScript(text: string): boolean {
  return /[԰-֏]/.test(text);
}

function containsCyrillicScript(text: string): boolean {
  return /[Ѐ-ӿ]/.test(text);
}

/** ai-cmd-provider-5.16.2 — dedicated alias for update_bookings(status=in_progress). */
export function isMarkVisitInProgressPrompt(prompt: string): boolean {
  const lower = prompt.toLowerCase();

  if (/\b(pay|paid|payment)\b/.test(lower)) return false;
  if (/\b(no[\s-]?show|running late|complete(?:d)?|done|finish(?:ed)?)\b/.test(lower)) {
    return false;
  }

  if (
    /\b(?:mark\s+(?:this\s+|the\s+)?(?:as\s+)?in[\s-]?progress|mark\s+[\w'.-]+'s\s+(?:appointment|visit|service)\s+as\s+started|mark\s+(?:this\s+|the\s+)?(?:appointment|visit|service)\s+as\s+started|start(?:ed)?\s+(?:the\s+)?(?:service|appointment|visit)|begin\s+(?:the\s+)?(?:service|appointment|visit)|begin\s+[\w'.-]+'s\s+[\w'.-]+|start\s+[\w'.-]+'s\s+(?:appointment|visit|service|color|haircut))\b/i.test(
      lower,
    )
  ) {
    return true;
  }

  if (containsArmenianScript(prompt) && /(սկսիր|սկսել)/iu.test(prompt)) {
    return true;
  }
  if (containsCyrillicScript(prompt) && /(начни|начать)/iu.test(prompt)) {
    return true;
  }

  return PROVIDER_MARK_VISIT_IN_PROGRESS_PROMPT_SCENARIOS.some(
    (scenario) => scenario.prompt === prompt,
  );
}

export function rescueMarkVisitInProgressIntent(
  prompt: string,
  action: string,
): {
  action: 'mark_visit_in_progress';
  rescueReason: string;
  params: Record<string, unknown>;
} | null {
  if (!isMarkVisitInProgressPrompt(prompt)) return null;
  if (action === 'mark_visit_in_progress') return null;
  return {
    action: 'mark_visit_in_progress',
    rescueReason: 'mark_visit_in_progress',
    params: { status: 'in_progress' },
  };
}
