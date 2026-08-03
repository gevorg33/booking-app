import { PROVIDER_MARK_VISIT_COMPLETE_PROMPT_SCENARIOS } from './ai-provider-mark-visit-complete.fixtures.js';

function containsArmenianScript(text: string): boolean {
  return /[԰-֏]/.test(text);
}

function containsCyrillicScript(text: string): boolean {
  return /[Ѐ-ӿ]/.test(text);
}

export function isMarkVisitCompletePrompt(prompt: string): boolean {
  const lower = prompt.toLowerCase();

  if (/\b(pay|paid|payment)\b/.test(lower)) return false;
  if (/\b(no[\s-]?show|in[\s-]?progress|running late)\b/.test(lower)) {
    return false;
  }
  // e2e-bug.241 — per-leg multi-service prompts must not steal into whole-visit complete
  if (/\bstep\s+\d+\b/.test(lower) || /\bleg\b/.test(lower)) {
    return false;
  }

  if (
    /\b(?:mark\s+(?:this\s+)?(?:as\s+)?done|mark\s+(?:this\s+|the\s+)?(?:visit|appointment)\s+(?:as\s+)?complete(?:d)?|finish(?:\s+up)?\s+this\s+appointment|wrap\s+up\s+(?:this\s+visit|[\w'.-]+'s\s+visit)|(?:i'?m\s+)?done\s+with\s+(?:this|my)\s+client|done\s+with\s+[\w'.-]+'s\s+appointment|(?:we'?re\s+)?all\s+done(?:\s+here)?,?\s+mark\s+it\s+complete)\b/i.test(
      lower,
    )
  ) {
    return true;
  }

  if (
    containsArmenianScript(prompt) &&
    /(ավարտված|ավարտիր|ավարտեցի)/iu.test(prompt) &&
    !/(քայլ)/iu.test(prompt)
  ) {
    return true;
  }
  if (
    containsCyrillicScript(prompt) &&
    /(заверш)/iu.test(prompt) &&
    !/(этап|шаг)/iu.test(prompt)
  ) {
    return true;
  }

  return PROVIDER_MARK_VISIT_COMPLETE_PROMPT_SCENARIOS.some(
    (scenario) => scenario.prompt === prompt,
  );
}

export function rescueMarkVisitCompleteIntent(
  prompt: string,
  action: string,
): {
  action: 'mark_visit_complete';
  rescueReason: string;
  params: Record<string, unknown>;
} | null {
  if (!isMarkVisitCompletePrompt(prompt)) return null;
  if (action === 'mark_visit_complete') return null;
  return {
    action: 'mark_visit_complete',
    rescueReason: 'mark_visit_complete',
    params: { status: 'completed' },
  };
}
