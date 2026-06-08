import type { ClassificationSurface } from './ai-classification-engine.types.js';
import type { ComplexityRoute } from './command-complexity-router.service.js';
import type { ClassifiedIntent } from './ai-command-routing.util.js';
import {
  resolveAvailabilityIntentFromPrompt,
  type AvailabilityDisambiguationSurface,
} from './ai-intent-disambiguation.util.js';
import { ESCALATION_TIEBREAKER_RULES } from './ai-classification-escalation.fixtures.js';
import type { ClassificationConsensus } from './ai-classification-engine.types.js';

const READ_ONLY_SAFE_ACTIONS = new Set([
  'list_bookings',
  'show_appointments',
  'summarize_bookings',
  'summarize_day',
  'summarize_customers',
  'check_availability',
  'check_providers_for_service',
  'lookup_service_assignment',
  'list_my_appointments',
  'list_providers',
  'list_services',
  'recommend_specialists',
  'business_info',
  'booking_help',
  'unknown',
]);

const MUTATING_ACTION_PATTERN =
  /^(create_|cancel_|reschedule_|book_|bulk_|clear_|mark_|apply_|configure_|enable_|set_|update_|delete_|enter_|release_|staff_|push_|import_|merge_|privacy_|admin_|notify_|payment_|day_|sick_|hide_|block_|setup_|fill_|no_show|collect_|refund_|extend_|capture_|rotate_|run_|sync_|trigger_|toggle_|retry_|dismiss_|create_webhook|open_ticket|contact_support)/;

export function isMutatingClassificationAction(action: string): boolean {
  if (action === 'unknown') return false;
  if (READ_ONLY_SAFE_ACTIONS.has(action)) return false;
  if (action.startsWith('explain_') || action.startsWith('diagnose_')) {
    return false;
  }
  return MUTATING_ACTION_PATTERN.test(action) || !READ_ONLY_SAFE_ACTIONS.has(action);
}

function isAvailabilitySurface(
  surface: ClassificationSurface,
): surface is AvailabilityDisambiguationSurface {
  return surface === 'dashboard' || surface === 'customer' || surface === 'public';
}

/** Best-effort read-only action implied by deterministic router + prompt wording. */
export function inferDeterministicPreferredAction(
  prompt: string,
  surface: ClassificationSurface,
  route?: ComplexityRoute,
): string | null {
  if (!route || route.tier !== 'read_only') return null;

  if (isAvailabilitySurface(surface)) {
    const availability = resolveAvailabilityIntentFromPrompt(surface, prompt);
    if (availability) return availability.action;
  }

  if (/\b(how many|how much|revenue|earnings|busiest|total)\b/i.test(prompt)) {
    return surface === 'dashboard' ? 'summarize_bookings' : 'list_my_appointments';
  }
  if (/\b(show appointments|list bookings|calendar today)\b/i.test(prompt)) {
    return surface === 'dashboard' ? 'show_appointments' : 'list_my_appointments';
  }
  if (/\b(list|show)\b/i.test(prompt)) {
    return surface === 'dashboard' ? 'list_bookings' : 'list_my_appointments';
  }

  return null;
}

/** acc-3.5 — detect when deterministic router and LLM classify disagree on a mutating intent. */
export function assessClassificationConsensus(
  intent: ClassifiedIntent,
  deterministicRoute?: ComplexityRoute,
  prompt?: string,
  surface: ClassificationSurface = 'dashboard',
): ClassificationConsensus {
  const llmAction = intent.action;
  let deterministicHint: string | undefined;

  if (deterministicRoute?.tier === 'read_only') {
    deterministicHint = 'read_only_query';
  } else if (deterministicRoute?.tier === 'compound') {
    deterministicHint = 'compound_flow';
  } else if (deterministicRoute?.tier === 'orchestration') {
    deterministicHint = 'orchestration_flow';
  } else if (deterministicRoute?.tier === 'simple_mutate') {
    deterministicHint = 'simple_mutate';
  }

  const deterministicPreferredAction = prompt
    ? inferDeterministicPreferredAction(prompt, surface, deterministicRoute)
    : null;

  const llmMutating = isMutatingClassificationAction(llmAction);
  const readOnlyDisagreement =
    deterministicRoute?.tier === 'read_only' &&
    llmMutating &&
    !['check_availability', 'check_providers_for_service', 'lookup_service_assignment'].includes(
      llmAction,
    );

  const preferredActionDisagreement =
    Boolean(deterministicPreferredAction) &&
    llmMutating &&
    deterministicPreferredAction !== llmAction;

  const needsEscalation = readOnlyDisagreement || preferredActionDisagreement;

  let reason: string | undefined;
  if (readOnlyDisagreement) {
    reason = 'Deterministic router read_only disagrees with mutating LLM classify (acc-3.5)';
  } else if (preferredActionDisagreement) {
    reason = `Deterministic router prefers ${deterministicPreferredAction} but LLM chose ${llmAction} (acc-3.5)`;
  }

  return {
    needsEscalation,
    deterministicHint,
    deterministicPreferredAction: deterministicPreferredAction ?? undefined,
    llmAction,
    reason,
  };
}

export interface ClassificationTieBreakerPayload {
  action: string;
  params?: Record<string, unknown>;
  confidence?: number;
  reasoning?: string;
  sideWith?: 'deterministic' | 'primary' | 'other';
}

export interface ClassificationTieBreakerResult extends ClassificationTieBreakerPayload {
  model: string;
  resolved: boolean;
}

export function buildEscalationTieBreakerSystemPrompt(
  surface: ClassificationSurface,
  allowedActions: string[],
): string {
  return `You are the Orchestrix classification tie-breaker (acc-3.5).
A fast classifier disagreed with the deterministic complexity router on a ${surface} command.
Return JSON only:
{
  "action": "snake_case_intent",
  "params": { ...extracted fields... },
  "confidence": number between 0 and 1,
  "reasoning": "one short sentence",
  "sideWith": "deterministic" | "primary" | "other"
}

${ESCALATION_TIEBREAKER_RULES}
Allowed actions for this turn: ${allowedActions.join(' | ')} | unknown`;
}

export function buildEscalationTieBreakerUserPayload(input: {
  prompt: string;
  surface: ClassificationSurface;
  intent: ClassifiedIntent;
  consensus: ClassificationConsensus;
  deterministicRoute?: ComplexityRoute;
  shortlist?: string[];
}): string {
  return JSON.stringify(
    {
      userMessage: input.prompt,
      surface: input.surface,
      deterministicRouter: input.deterministicRoute ?? null,
      deterministicPreferredAction: input.consensus.deterministicPreferredAction ?? null,
      primaryClassifier: {
        action: input.intent.action,
        params: input.intent.params ?? {},
        confidence: input.intent.confidence ?? null,
        reasoning: input.intent.reasoning ?? null,
      },
      shortlist: input.shortlist ?? [],
      disagreementReason: input.consensus.reason ?? null,
    },
    null,
    0,
  );
}

export function applyEscalationTieBreakerToIntent(
  intent: ClassifiedIntent,
  tieBreaker: ClassificationTieBreakerResult,
): ClassifiedIntent {
  if (!tieBreaker.resolved || !tieBreaker.action) {
    return intent;
  }

  return {
    ...intent,
    action: tieBreaker.action,
    params: {
      ...(intent.params ?? {}),
      ...(tieBreaker.params ?? {}),
      _classificationSource: 'escalation_model',
      _classificationEscalate: false,
      _classificationTieBreakerModel: tieBreaker.model,
      _classificationTieBreakerSide: tieBreaker.sideWith ?? 'other',
    },
    confidence: Math.max(
      typeof intent.confidence === 'number' ? intent.confidence : 0,
      tieBreaker.confidence ?? 0.85,
    ),
    reasoning:
      tieBreaker.reasoning ??
      `Escalation model tie-breaker chose ${tieBreaker.action} (acc-3.5)`,
  };
}

export function resolveAllowedEscalationActions(
  shortlist: string[] | undefined,
  consensus: ClassificationConsensus,
  primaryAction: string,
): string[] {
  const base = new Set<string>(['unknown', primaryAction]);
  if (consensus.deterministicPreferredAction) {
    base.add(consensus.deterministicPreferredAction);
  }
  for (const action of shortlist ?? []) {
    base.add(action);
  }
  if (consensus.deterministicPreferredAction) {
    base.add(consensus.deterministicPreferredAction);
  }
  base.add('check_providers_for_service');
  base.add('check_availability');
  base.add('list_bookings');
  base.add('summarize_bookings');
  return [...base];
}
