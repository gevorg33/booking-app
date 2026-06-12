import type { ConfidenceGateResult } from './command-understanding.types.js';
import type { AiConfidenceThresholds } from './ai-settings.types.js';

/** Default thresholds for semantic escalation (pipe-1.3.2). */
export const DEFAULT_SEMANTIC_ESCALATION_CONFIDENCE = 0.65;
export const DEFAULT_SEMANTIC_SKIP_CONFIDENCE = 0.82;

export interface ConfidenceGateOptions {
  low?: number;
  high?: number;
}

/**
 * Resolves confidence gate bands from AiSettingsService (pipe-1.3.3).
 * `sessionHighOverride` is the A/B `_confidenceHigh` from ai-gateway when present.
 */
export function resolveConfidenceGateThresholds(
  aiConfidence: AiConfidenceThresholds,
  sessionHighOverride?: number,
): { low: number; high: number } {
  return {
    low: aiConfidence.low,
    high: sessionHighOverride ?? aiConfidence.high,
  };
}

/**
 * True when semantic_match should run after classify (pipe-1.3.2).
 * - `unknown` action → always true
 * - `confidence < low` (default 0.65) → true
 * - `confidence >= high` (default 0.82) → false
 * - ambiguous band `[low, high)` → false (defer to classifier + rerank)
 */
export function shouldEscalateToSemantic(
  action: string,
  confidence: number | undefined,
  options?: ConfidenceGateOptions,
): boolean {
  return evaluateConfidenceGate(action, confidence, options)
    .shouldEscalateToSemantic;
}

/** Full confidence gate evaluation for pipe-1 understand pipeline. */
export function evaluateConfidenceGate(
  action: string,
  confidence: number | undefined,
  options?: ConfidenceGateOptions,
): ConfidenceGateResult {
  const low = options?.low ?? DEFAULT_SEMANTIC_ESCALATION_CONFIDENCE;
  const high = options?.high ?? DEFAULT_SEMANTIC_SKIP_CONFIDENCE;

  if (action === 'unknown') {
    return {
      action,
      confidence,
      shouldEscalateToSemantic: true,
      decision: 'escalate_semantic',
      lowThreshold: low,
      highThreshold: high,
      reason: 'classifier returned unknown',
    };
  }
  if (typeof confidence !== 'number') {
    return {
      action,
      confidence,
      shouldEscalateToSemantic: true,
      decision: 'escalate_semantic',
      lowThreshold: low,
      highThreshold: high,
      reason: 'classifier confidence missing',
    };
  }
  if (confidence >= high) {
    return {
      action,
      confidence,
      shouldEscalateToSemantic: false,
      decision: 'skip_semantic',
      lowThreshold: low,
      highThreshold: high,
      reason: `confidence ${confidence} >= high threshold ${high}`,
    };
  }
  if (confidence < low) {
    return {
      action,
      confidence,
      shouldEscalateToSemantic: true,
      decision: 'escalate_semantic',
      lowThreshold: low,
      highThreshold: high,
      reason: `confidence ${confidence} < low threshold ${low}`,
    };
  }
  return {
    action,
    confidence,
    shouldEscalateToSemantic: false,
    decision: 'ambiguous_band',
    lowThreshold: low,
    highThreshold: high,
    reason: `confidence ${confidence} in ambiguous band [${low}, ${high})`,
  };
}
