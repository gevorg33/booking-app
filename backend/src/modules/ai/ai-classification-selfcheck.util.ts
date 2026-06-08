import type {
  ClassificationSurface,
  ClassificationVerification,
} from './ai-classification-engine.types.js';
import type { ClassifiedIntent } from './ai-command-routing.util.js';
import { deriveFieldLevelConfidence } from './ai-classification-field-confidence.util.js';
import {
  isFirstAvailableBookingPrompt,
  isTeamWideProviderAvailabilityQuery,
} from './ai-intent-heuristics.js';
import {
  disambiguateMisclassifiedAvailabilityIntent,
  isLookupServiceAssignmentPrompt,
  resolveAvailabilityIntentFromPrompt,
  type AvailabilityDisambiguationSurface,
} from './ai-intent-disambiguation.util.js';
import {
  CONFIGURE_ACTION_PATTERN,
  EXPLAIN_ACTION_PATTERN,
  READ_ONLY_ACTION_PREFIXES,
  SELF_CHECK_CLARIFY_CONFIDENCE_CAP,
  SELF_CHECK_LLM_TRIGGER_MAX_CONFIDENCE,
  SELF_CHECK_MISMATCH_CONFIDENCE_CAP,
} from './ai-classification-selfcheck.fixtures.js';

const BOOK_VERB =
  /\b(book|schedule|reserve|appointment|put on the books)\b/i;
const CANCEL_VERB = /\b(cancel|call off|drop|remove)\b/i;
const RESCHEDULE_VERB = /\b(reschedule|move|shift|change time)\b/i;
const READ_VERB =
  /\b(show|list|summarize|how many|how much|earnings|revenue|busiest|total)\b/i;
const EXPLAIN_VERB =
  /\b(explain|why does|why do|what does|how does|why was|why is)\b/i;
const CONFIGURE_VERB =
  /\b(configure|set up|enable|turn on|turn off|apply)\b/i;

const READ_ONLY_SUMMARIZE_ACTIONS = new Set([
  'summarize_bookings',
  'summarize_day',
  'summarize_customers',
  'summarize_revenue',
  'list_bookings',
  'show_appointments',
  'list_my_appointments',
  'payment_sweep',
  'revenue_forecast',
]);

const BOOKING_MUTATION_ACTIONS = new Set([
  'create_booking',
  'book_nearest_slot',
  'book_appointment',
  'cancel_bookings',
  'cancel_my_booking',
  'reschedule_booking',
  'bulk_smart_cancel',
]);

function isReadOnlyAction(action: string): boolean {
  if (READ_ONLY_SUMMARIZE_ACTIONS.has(action)) return true;
  return READ_ONLY_ACTION_PREFIXES.some((prefix) => action.startsWith(prefix));
}

function isAvailabilitySurface(
  surface: ClassificationSurface,
): surface is AvailabilityDisambiguationSurface {
  return surface === 'dashboard' || surface === 'customer' || surface === 'public';
}

function applyMismatch(
  reasons: string[],
  reason: string,
  confidence: number,
  cap = SELF_CHECK_MISMATCH_CONFIDENCE_CAP,
): number {
  reasons.push(reason);
  return Math.min(confidence, cap);
}

function deriveFieldConfidence(
  prompt: string,
  action: string,
  params: Record<string, unknown>,
  actionConfidence: number,
  surface: ClassificationSurface,
) {
  return deriveFieldLevelConfidence(prompt, action, params, actionConfidence);
}

export interface RunClassificationSelfCheckInput {
  prompt: string;
  surface: ClassificationSurface;
  intent: ClassifiedIntent;
}

/** acc-3.4 — deterministic rule pass: does action + params satisfy the prompt? */
export function runClassificationSelfCheck(
  input: RunClassificationSelfCheckInput,
): ClassificationVerification {
  const reasons: string[] = [];
  const params = input.intent.params ?? {};
  let confidence =
    typeof input.intent.confidence === 'number' ? input.intent.confidence : 0.72;
  const action = input.intent.action;

  if (action === 'unknown') {
    return {
      ok: true,
      confidence,
      fieldConfidence: deriveFieldConfidence(
        input.prompt,
        input.intent.action,
        params,
        confidence,
        input.surface,
      ),
      reasons,
      source: 'rules',
    };
  }

  const bookLike =
    BOOK_VERB.test(input.prompt) &&
    !CANCEL_VERB.test(input.prompt) &&
    !RESCHEDULE_VERB.test(input.prompt);
  const availabilityLike =
    isTeamWideProviderAvailabilityQuery(input.prompt) ||
    /\b(who is free|who has availability|which provider|any provider|open slots?)\b/i.test(
      input.prompt,
    );
  const readLike = READ_VERB.test(input.prompt);
  const explainLike = EXPLAIN_VERB.test(input.prompt);
  const configureLike = CONFIGURE_VERB.test(input.prompt);
  const cancelLike = CANCEL_VERB.test(input.prompt);
  const rescheduleLike = RESCHEDULE_VERB.test(input.prompt);

  if (isAvailabilitySurface(input.surface)) {
    const availabilityFix = disambiguateMisclassifiedAvailabilityIntent(
      input.surface,
      input.prompt,
      action,
      params,
    );
    if (availabilityFix) {
      confidence = applyMismatch(
        reasons,
        `availability intent mismatch: expected ${availabilityFix.action}, got ${action}`,
        confidence,
      );
    }
  } else if (availabilityLike && BOOKING_MUTATION_ACTIONS.has(action)) {
    confidence = applyMismatch(
      reasons,
      'availability query misclassified as mutating booking action',
      confidence,
    );
  }

  if (
    bookLike &&
    isFirstAvailableBookingPrompt(input.prompt) &&
    (action === 'check_providers_for_service' ||
      action === 'check_availability' ||
      action === 'lookup_service_assignment')
  ) {
    confidence = applyMismatch(
      reasons,
      'flexible booking misclassified as availability read',
      confidence,
      0.4,
    );
  }

  if (readLike && !bookLike && !cancelLike && !rescheduleLike) {
    const expectedRead = resolveExpectedReadAction(input.prompt, input.surface);
    if (
      BOOKING_MUTATION_ACTIONS.has(action) ||
      (expectedRead && action !== expectedRead && !isReadOnlyAction(action))
    ) {
      confidence = applyMismatch(
        reasons,
        'read-only analytics/list query misclassified as mutating action',
        confidence,
        SELF_CHECK_CLARIFY_CONFIDENCE_CAP,
      );
    }
  }

  if (cancelLike && !action.includes('cancel')) {
    confidence = applyMismatch(
      reasons,
      'cancel wording misclassified as non-cancel action',
      confidence,
    );
  }

  if (rescheduleLike && action !== 'reschedule_booking') {
    confidence = applyMismatch(
      reasons,
      'reschedule wording misclassified as non-reschedule action',
      confidence,
      0.42,
    );
  }

  if (explainLike && !EXPLAIN_ACTION_PATTERN.test(action)) {
    confidence = applyMismatch(
      reasons,
      'explain/read-help wording misclassified as non-explain action',
      confidence,
      SELF_CHECK_CLARIFY_CONFIDENCE_CAP,
    );
  }

  if (configureLike && !CONFIGURE_ACTION_PATTERN.test(action)) {
    confidence = applyMismatch(
      reasons,
      'configure/setup wording misclassified as non-configure action',
      confidence,
      0.42,
    );
  }

  if (
    input.surface === 'dashboard' &&
    isLookupServiceAssignmentPrompt(input.prompt) &&
    action === 'check_providers_for_service'
  ) {
    confidence = applyMismatch(
      reasons,
      'staff assignment lookup misclassified as customer availability',
      confidence,
    );
  }

  if (
    (action === 'create_booking' || action === 'book_appointment') &&
    bookLike &&
    !params.bookingFirstAvailable &&
    !params.serviceName &&
    !params.serviceCategory &&
    !params.serviceNames
  ) {
    confidence = applyMismatch(
      reasons,
      'booking action missing serviceName/serviceCategory param',
      confidence,
      0.48,
    );
  }

  if (
    (action === 'create_booking' || action === 'book_appointment') &&
    bookLike &&
    !params.bookingFirstAvailable &&
    !params.timeSlot &&
    /\b(at|@)\s*\d{1,2}(:\d{2})?\b/i.test(input.prompt)
  ) {
    confidence = applyMismatch(
      reasons,
      'booking action missing timeSlot despite fixed time in prompt',
      confidence,
      0.5,
    );
  }

  const fieldConfidence = deriveFieldConfidence(
    input.prompt,
    action,
    params,
    confidence,
    input.surface,
  );

  return {
    ok: reasons.length === 0,
    confidence,
    fieldConfidence,
    reasons,
    source: 'rules',
  };
}

function resolveExpectedReadAction(
  prompt: string,
  surface: ClassificationSurface,
): string | null {
  if (!isAvailabilitySurface(surface)) return null;
  return resolveAvailabilityIntentFromPrompt(surface, prompt)?.action ?? null;
}

export function shouldRunLlmSelfCheck(
  verification: ClassificationVerification,
  intent: ClassifiedIntent,
): boolean {
  if (intent.action === 'unknown') return false;
  if (isReadOnlyAction(intent.action) && verification.ok) return false;
  if (!verification.ok) return true;
  return verification.confidence <= SELF_CHECK_LLM_TRIGGER_MAX_CONFIDENCE;
}

export interface LlmSelfCheckResult {
  satisfies: boolean;
  confidence: number;
  reason?: string;
}

export function mergeLlmSelfCheckWithRules(
  ruleVerification: ClassificationVerification,
  llmResult: LlmSelfCheckResult | null,
): ClassificationVerification {
  if (!llmResult) {
    return ruleVerification;
  }

  const reasons = [...ruleVerification.reasons];
  let confidence = ruleVerification.confidence;

  if (llmResult.satisfies && !ruleVerification.ok) {
    confidence = Math.max(confidence, Math.min(llmResult.confidence, 0.68));
    reasons.push(
      `LLM self-check overrides rule mismatch: ${llmResult.reason ?? 'satisfies'}`,
    );
    return {
      ok: confidence >= 0.55,
      confidence,
      fieldConfidence: {
        ...ruleVerification.fieldConfidence,
        action: confidence,
      },
      reasons,
      source: 'rules+llm',
      llmVerified: true,
    };
  }

  if (!llmResult.satisfies) {
    confidence = Math.min(
      confidence,
      Math.min(llmResult.confidence, SELF_CHECK_MISMATCH_CONFIDENCE_CAP),
    );
    reasons.push(
      llmResult.reason ?? 'LLM self-check: action+params do not satisfy prompt',
    );
    return {
      ok: false,
      confidence,
      fieldConfidence: {
        ...ruleVerification.fieldConfidence,
        action: confidence,
      },
      reasons,
      source: 'rules+llm',
      llmVerified: false,
    };
  }

  return {
    ...ruleVerification,
    source: 'rules+llm',
    llmVerified: true,
  };
}

/** Back-compat alias used by engine util + tests. */
export function verifyClassifiedIntent(
  prompt: string,
  intent: ClassifiedIntent,
  surface: ClassificationSurface = 'dashboard',
): ClassificationVerification {
  return runClassificationSelfCheck({ prompt, surface, intent });
}
