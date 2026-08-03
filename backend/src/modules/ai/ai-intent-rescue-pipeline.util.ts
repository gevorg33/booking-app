import type {
  IntentRescueInput,
  IntentRescueResult,
} from './ai-intent-rescue.service.js';
import { RESCUE_PIPELINE_BOUNDARY_MARKER } from './ai-intent-rescue.boundary.js';
import {
  applySemanticParamHintsToRescueInput,
  enrichRescueResultWithSemanticParamHints,
} from './semantic-rescue-param-hints.util.js';
import { isIntentAllowedOnSurface } from './ai-command-registry.util.js';
import { isPublicOnlyAssistantAction } from './ai-public-only-assistant-actions.js';

/** pipe-1.5.1 — domain-first rescue orchestration (semantic is pipeline-only). */
export const RESCUE_PIPELINE_PIPE_MARKER = RESCUE_PIPELINE_BOUNDARY_MARKER;

/** Rescue phases in execution order — domain heuristics only. */
export const RESCUE_PIPELINE_PHASES = [
  'provider_surface',
  'classified_disambiguation',
  'unknown_domain',
] as const;

export type RescuePipelinePhase = (typeof RESCUE_PIPELINE_PHASES)[number];

export type RescuePipelineContext = {
  prompt: string;
  action: string;
  params: Record<string, unknown>;
  reasoning?: string;
  employees: Array<{ id: string; name: string }>;
  customers: Array<{ id: string; name: string }>;
  timeZone: string;
  budgetSurface?: 'dashboard' | 'customer' | 'public';
};

export interface IntentRescuePipelineHost {
  runRescueProviderPhase(input: IntentRescueInput): IntentRescueResult | null;
  runRescueClassifiedPhase(
    input: IntentRescueInput,
    ctx: RescuePipelineContext,
  ): IntentRescueResult | null;
  runRescueUnknownPhase(
    input: IntentRescueInput,
    ctx: RescuePipelineContext,
  ): IntentRescueResult | null;
}

export function buildRescuePipelineContext(
  input: IntentRescueInput,
): RescuePipelineContext {
  const budgetSurface: 'dashboard' | 'customer' | 'public' | undefined =
    input.surface === 'public' ||
    input.surface === 'customer' ||
    input.surface === 'dashboard'
      ? input.surface
      : undefined;

  return {
    prompt: input.prompt,
    action: input.action,
    params: input.params ?? {},
    reasoning: input.reasoning,
    employees: input.employees ?? [],
    customers: input.customers ?? [],
    timeZone: input.timeZone ?? 'UTC',
    budgetSurface,
  };
}

/**
 * e2e-bug.77 — never accept a rescued action that the current surface cannot run.
 * Without this, ungated staff/provider rescues become security_blocked instead of
 * falling through to the real customer/public intent.
 *
 * Public booking shares most customer self-service intents; accept either surface.
 * e2e-bug.189 — customer gateway also delegates PUBLIC_ONLY discovery intents
 * (`list_providers`, `recommend_specialists`, …) into PublicBookingAssistantService,
 * so those public-registry actions must remain rescueable on surface=customer.
 */
export function acceptRescueForSurface(
  result: IntentRescueResult | null,
  surface: IntentRescueInput['surface'],
): IntentRescueResult | null {
  if (!result) return null;
  if (!surface) return result;
  if (
    result.action === 'unknown' ||
    result.action === 'error' ||
    result.action === 'security_blocked'
  ) {
    return result;
  }
  if (isIntentAllowedOnSurface(result.action, surface)) return result;
  if (
    surface === 'public' &&
    isIntentAllowedOnSurface(result.action, 'customer')
  ) {
    return result;
  }
  if (surface === 'customer' && isPublicOnlyAssistantAction(result.action)) {
    return result;
  }
  return null;
}

/**
 * Domain rescues first — provider surface, classified disambiguation, then unknown domain.
 * Semantic matching is excluded (pipeline stage only).
 */
export function runIntentRescuePipeline(
  host: IntentRescuePipelineHost,
  input: IntentRescueInput,
): IntentRescueResult | null {
  const enrichedInput = applySemanticParamHintsToRescueInput(input);
  const hints = enrichedInput.semanticParamHints;
  const ctx = buildRescuePipelineContext(enrichedInput);
  const surface = enrichedInput.surface;

  const provider = acceptRescueForSurface(
    host.runRescueProviderPhase(enrichedInput),
    surface,
  );
  if (provider) {
    return enrichRescueResultWithSemanticParamHints(provider, hints);
  }

  if (enrichedInput.action !== 'unknown') {
    const classifiedRaw = host.runRescueClassifiedPhase(enrichedInput, ctx);
    const classified = acceptRescueForSurface(classifiedRaw, surface);
    if (classified) {
      return enrichRescueResultWithSemanticParamHints(classified, hints);
    }
    // Wrong-surface classified steal — continue into unknown so customer/public
    // domain rescues can still win (e2e-bug.77).
    if (!classifiedRaw) {
      return null;
    }
  }

  const unknown = acceptRescueForSurface(
    host.runRescueUnknownPhase(enrichedInput, ctx),
    surface,
  );
  return enrichRescueResultWithSemanticParamHints(unknown, hints);
}
