/** ai-cmd-provider-6.9 — provider mobile clinic tasks, lab results queue & booking lab summaries. */

import { isExplainResultStatusPrompt } from './ai-consumer-clinic-test-results.util.js';

export const PROVIDER_CLINIC_TASKS_AND_RESULTS_READ_INTENTS = [
  'list_lab_results_queue',
  'list_booking_lab_summaries',
] as const;

export const PROVIDER_CLINIC_TASKS_AND_RESULTS_MUTATE_INTENTS = [
  'claim_clinic_task',
  'complete_clinic_task',
] as const;

export const PROVIDER_CLINIC_TASKS_AND_RESULTS_INTENTS = [
  ...PROVIDER_CLINIC_TASKS_AND_RESULTS_READ_INTENTS,
  ...PROVIDER_CLINIC_TASKS_AND_RESULTS_MUTATE_INTENTS,
] as const;

export type ProviderClinicTasksAndResultsIntent =
  (typeof PROVIDER_CLINIC_TASKS_AND_RESULTS_INTENTS)[number];

function containsArmenianScript(text: string): boolean {
  return /[԰-֏]/.test(text);
}

function containsCyrillicScript(text: string): boolean {
  return /[Ѐ-ӿ]/.test(text);
}

export function isProviderClinicTasksAndResultsIntent(
  action: string,
): action is ProviderClinicTasksAndResultsIntent {
  return (
    PROVIDER_CLINIC_TASKS_AND_RESULTS_INTENTS as readonly string[]
  ).includes(action);
}

export function isListLabResultsQueuePrompt(prompt: string): boolean {
  const normalized = prompt.toLowerCase();
  if (/\b(this\s+booking|this\s+visit|this\s+appointment)\b/.test(normalized)) {
    return false;
  }
  if (
    /\b(show|list|what'?s?|any|check|see)\b/.test(normalized) &&
    /\b(lab\s+results?|test\s+results?)\b/.test(normalized) &&
    /\b(queue|waiting|pending|review|assigned|inbox)\b/.test(normalized) &&
    !/\b(?:mean|means)\b/.test(normalized)
  ) {
    return true;
  }
  if (isExplainResultStatusPrompt(prompt)) return false;
  if (
    containsArmenianScript(prompt) &&
    /(լաբորատոր|արդյունք).*(հերթ|սպասող)/i.test(prompt) &&
    !/ինչու/iu.test(prompt)
  ) {
    return true;
  }
  if (
    containsCyrillicScript(prompt) &&
    /(результат|лаборатор).*(очеред|ожида)/i.test(prompt) &&
    !/почему/iu.test(prompt)
  ) {
    return true;
  }
  return false;
}

export function isClaimClinicTaskPrompt(prompt: string): boolean {
  const normalized = prompt.toLowerCase();
  if (isCompleteClinicTaskPrompt(prompt)) return false;
  return (
    /\b(claim|take|grab|pick\s+up)\b/.test(normalized) &&
    /\btask\b/.test(normalized)
  );
}

export function isCompleteClinicTaskPrompt(prompt: string): boolean {
  const normalized = prompt.toLowerCase();
  return (
    (/\b(mark|complete|finish|close\s+out)\b/.test(normalized) &&
      /\btask\b/.test(normalized) &&
      /\b(done|complete|completed|finished)\b/.test(normalized)) ||
    (/\bcomplete\b/.test(normalized) && /\btask\b/.test(normalized))
  );
}

export function isListBookingLabSummariesPrompt(prompt: string): boolean {
  const normalized = prompt.toLowerCase();
  if (/\bbooking\s+(?:site|page|portal|website)\b/.test(normalized)) {
    return false;
  }
  return (
    /\b(flagged|abnormal)\b.*\bresults?\b/.test(normalized) ||
    (/\b(lab|test)\s+results?\b/.test(normalized) &&
      /\b(this\s+booking|this\s+visit|this\s+appointment|on\s+this\s+visit)\b/.test(
        normalized,
      )) ||
    (/\bshow\b/.test(normalized) &&
      /\b(cbc|results?)\b/.test(normalized) &&
      /\b(last\s+time|previous|this\s+visit)\b/.test(normalized))
  );
}

export function extractClinicTaskIdFromPrompt(
  prompt: string,
): string | null {
  const match = prompt.match(/\btask\s*#?\s*([a-z0-9-]{6,})\b/i);
  return match?.[1] ?? null;
}

export function extractBookingIdForLabSummariesFromPrompt(
  prompt: string,
): string | null {
  const match =
    prompt.match(/\bbooking\s*#?\s*([a-z0-9-]{6,})\b/i) ??
    prompt.match(/\bappointment\s*#?\s*([a-z0-9-]{6,})\b/i);
  return match?.[1] ?? null;
}

export function rescueProviderClinicTasksAndResultsIntent(
  prompt: string,
  action: string,
): { action: ProviderClinicTasksAndResultsIntent; rescueReason: string } | null {
  if (isProviderClinicTasksAndResultsIntent(action)) return null;

  if (isListBookingLabSummariesPrompt(prompt)) {
    return {
      action: 'list_booking_lab_summaries',
      rescueReason: 'list_booking_lab_summaries',
    };
  }
  if (isListLabResultsQueuePrompt(prompt)) {
    return {
      action: 'list_lab_results_queue',
      rescueReason: 'list_lab_results_queue',
    };
  }
  if (isCompleteClinicTaskPrompt(prompt)) {
    return { action: 'complete_clinic_task', rescueReason: 'complete_clinic_task' };
  }
  if (isClaimClinicTaskPrompt(prompt)) {
    return { action: 'claim_clinic_task', rescueReason: 'claim_clinic_task' };
  }
  return null;
}

export function formatLabResultsQueueSummary(
  results: Array<{
    testName: string | null;
    customerName: string | null;
    status: string;
    measurementFlag: string | null;
  }>,
): string {
  if (!results.length) {
    return 'No lab results are waiting in your queue right now.';
  }
  const flagged = results.filter(
    (r) => r.measurementFlag && r.measurementFlag !== 'normal',
  ).length;
  const preview = results
    .slice(0, 3)
    .map((r) => `${r.testName ?? 'Test'} — ${r.customerName ?? 'patient'} (${r.status})`)
    .join('; ');
  return `${results.length} result${results.length === 1 ? '' : 's'} in your queue${flagged ? `, ${flagged} flagged` : ''}: ${preview}${results.length > 3 ? '…' : ''}.`;
}

export function formatBookingLabSummariesText(
  summaries: Array<{
    testName: string;
    orderStatus: string;
    resultStatus?: string;
    measurementFlag?: string;
  }>,
): string {
  if (!summaries.length) {
    return 'No lab tests are on file for this booking.';
  }
  const flagged = summaries.filter(
    (s) => s.measurementFlag && s.measurementFlag !== 'normal',
  ).length;
  const lines = summaries.map(
    (s) =>
      `${s.testName}: ${s.resultStatus ?? s.orderStatus}${s.measurementFlag && s.measurementFlag !== 'normal' ? ` (${s.measurementFlag})` : ''}`,
  );
  return `${summaries.length} lab test${summaries.length === 1 ? '' : 's'} on this booking${flagged ? `, ${flagged} flagged` : ''}:\n${lines.join('\n')}`;
}
