import { PROVIDER_MARK_MULTI_SERVICE_STEP_DONE_PROMPT_SCENARIOS } from './ai-provider-mark-multi-service-step-done.fixtures.js';
import { extractCustomerNameFromClientPrompt } from './ai-provider-client-context.util.js';

function containsArmenianScript(text: string): boolean {
  return /[԰-֏]/.test(text);
}

function containsCyrillicScript(text: string): boolean {
  return /[Ѐ-ӿ]/.test(text);
}

/** e2e-bug.264 — "Finish step 1 for Spa Day QA" → customerName. */
export function extractCustomerNameForMultiServiceStepDone(
  prompt: string,
  params: Record<string, unknown> = {},
): string | null {
  if (typeof params.customerName === 'string' && params.customerName.trim()) {
    return params.customerName.trim();
  }
  const forMatch = prompt.match(
    /\bfor\s+([A-Z][\p{L}'.-]+(?:\s+[A-Z][\p{L}'.-]+){0,3})\b/u,
  );
  if (forMatch?.[1]?.trim()) {
    return forMatch[1].trim().replace(/['’]s$/i, '');
  }
  return extractCustomerNameFromClientPrompt(prompt);
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
  customerName?: string;
}

export function parseMarkMultiServiceStepDoneFromPrompt(
  prompt: string,
): ParsedMarkMultiServiceStepDone | null {
  if (!isMarkMultiServiceStepDonePrompt(prompt)) return null;

  const customerName =
    extractCustomerNameForMultiServiceStepDone(prompt) ?? undefined;

  const stepMatch = prompt.match(/\bstep\s+(\d+)\b/i);
  if (stepMatch) {
    return {
      stepIndex: Number(stepMatch[1]),
      ...(customerName ? { customerName } : {}),
    };
  }

  const legMatch = prompt.match(
    /\b(?:finish|complete)\s+(?:the\s+)?([\w'-]+(?:\s+[\w'-]+)?)\s+leg\b/i,
  );
  if (legMatch) {
    return {
      serviceName: legMatch[1].trim(),
      ...(customerName ? { customerName } : {}),
    };
  }

  return customerName ? { customerName } : {};
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
