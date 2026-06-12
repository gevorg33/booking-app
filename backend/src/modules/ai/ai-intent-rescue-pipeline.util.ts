import type { IntentRescueInput, IntentRescueResult } from './ai-intent-rescue.service.js';
import { RESCUE_PIPELINE_BOUNDARY_MARKER } from './ai-intent-rescue.boundary.js';
import {
  applySemanticParamHintsToRescueInput,
  enrichRescueResultWithSemanticParamHints,
} from './semantic-rescue-param-hints.util.js';

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
  const budgetSurface:
    | 'dashboard'
    | 'customer'
    | 'public'
    | undefined =
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

  const provider = host.runRescueProviderPhase(enrichedInput);
  if (provider) {
    return enrichRescueResultWithSemanticParamHints(provider, hints);
  }

  if (enrichedInput.action !== 'unknown') {
    const classified = host.runRescueClassifiedPhase(enrichedInput, ctx);
    if (classified) {
      return enrichRescueResultWithSemanticParamHints(classified, hints);
    }
    return null;
  }

  const unknown = host.runRescueUnknownPhase(enrichedInput, ctx);
  return enrichRescueResultWithSemanticParamHints(unknown, hints);
}
