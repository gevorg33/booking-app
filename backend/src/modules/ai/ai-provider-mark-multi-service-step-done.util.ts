import { PROVIDER_MARK_MULTI_SERVICE_STEP_DONE_PROMPT_SCENARIOS } from './ai-provider-mark-multi-service-step-done.fixtures.js';

function containsArmenianScript(text: string): boolean {
  return /[԰-֏]/.test(text);
}

function containsCyrillicScript(text: string): boolean {
  return /[Ѐ-ӿ]/.test(text);
}

/** ai-cmd-provider-5.18.3 — mark one leg of a multi-service booking done (per-leg status within the group), not the whole visit. */
export function isMarkMultiServiceStepDonePrompt(prompt: string): boolean {
  const lower = prompt.toLowerCase();

  if (/\b(pay|paid|payment)\b/.test(lower)) return false;

  if (
    /\b(?:finish|complete)\b.{0,20}\bstep\s+\d+\b/i.test(lower) ||
    /\b(?:finish|complete)\b.{0,30}\bleg\b/i.test(lower)
  ) {
    return true;
  }

  if (
    containsArmenianScript(prompt) &&
    /(քայլ)/iu.test(prompt) &&
    /(ավարտված|ավարտիր|ավարտեցի)/iu.test(prompt)
  ) {
    return true;
  }
  if (
    containsCyrillicScript(prompt) &&
    /(этап|шаг)/iu.test(prompt) &&
    /(заверш)/iu.test(prompt)
  ) {
    return true;
  }

  return PROVIDER_MARK_MULTI_SERVICE_STEP_DONE_PROMPT_SCENARIOS.some(
    (scenario) => scenario.prompt === prompt,
  );
}

export interface ParsedMarkMultiServiceStepDone {
  stepIndex?: number;
  serviceName?: string;
}

export function parseMarkMultiServiceStepDoneFromPrompt(
  prompt: string,
): ParsedMarkMultiServiceStepDone | null {
  if (!isMarkMultiServiceStepDonePrompt(prompt)) return null;

  const stepMatch = prompt.match(/\bstep\s+(\d+)\b/i);
  if (stepMatch) return { stepIndex: Number(stepMatch[1]) };

  const legMatch = prompt.match(
    /\b(?:finish|complete)\s+(?:the\s+)?([\w'-]+(?:\s+[\w'-]+)?)\s+leg\b/i,
  );
  if (legMatch) {
    return { serviceName: legMatch[1].trim() };
  }

  return {};
}

export function rescueMarkMultiServiceStepDoneIntent(
  prompt: string,
  action: string,
): {
  action: 'mark_multi_service_step_done';
  rescueReason: string;
  params: Record<string, unknown>;
} | null {
  const parsed = parseMarkMultiServiceStepDoneFromPrompt(prompt);
  if (!parsed) return null;
  if (action === 'mark_multi_service_step_done') return null;
  return {
    action: 'mark_multi_service_step_done',
    rescueReason: 'mark_multi_service_step_done',
    params: { ...parsed },
  };
}
